#!/usr/bin/env python3
"""Validate captured NASA POWER JSON and derive reproducible annual T2M trends."""
from __future__ import annotations

import argparse
import calendar
import hashlib
import json
import math
import os
import sys
from datetime import datetime
from pathlib import Path
from typing import Any
from urllib.parse import parse_qs, urlsplit

from scipy.stats import linregress

ROOT = Path(__file__).resolve().parents[1]
START_YEAR = 1991
END_YEAR = 2024
REPORTING_THRESHOLD_YEARS = 30
EXPECTED_START = f"{START_YEAR}0101"
EXPECTED_END = f"{END_YEAR}1231"
SITES: dict[str, dict[str, Any]] = {
    "hanoi": {"label": "Hanoi (NASA POWER point)", "latitude": 21.03, "longitude": 105.85},
    "can-tho": {"label": "Can Tho (NASA POWER point)", "latitude": 10.03, "longitude": 105.78},
}
VALID_RAW_STATUS = "RAW_RECEIVED_NOT_VALIDATED"


def _finite_number(value: Any) -> bool:
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(value)


def _validate_timestamp(value: Any) -> None:
    if not isinstance(value, str) or not value.strip():
        raise ValueError("Missing NASA response access timestamp")
    try:
        stamp = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError as exc:
        raise ValueError("NASA response access timestamp is not ISO-8601") from exc
    if stamp.tzinfo is None:
        raise ValueError("NASA response access timestamp must include a timezone")


def _validate_request_url(url: Any, site: str) -> None:
    if not isinstance(url, str):
        raise ValueError("Missing exact NASA POWER request URL")
    parsed = urlsplit(url)
    query = parse_qs(parsed.query, keep_blank_values=True)
    cfg = SITES[site]
    expected = {
        "parameters": "T2M",
        "community": "SB",
        "format": "JSON",
        "start": str(START_YEAR),
        "end": str(END_YEAR),
    }
    if parsed.scheme != "https" or parsed.netloc.lower() != "power.larc.nasa.gov":
        raise ValueError("Request URL is not the official NASA POWER HTTPS host")
    if parsed.path != "/api/temporal/monthly/point":
        raise ValueError("Request URL is not the NASA POWER Monthly Point endpoint")
    for key, value in expected.items():
        if query.get(key) != [value]:
            raise ValueError(f"NASA request URL has unexpected {key} parameter")
    try:
        lat = float(query["latitude"][0])
        lon = float(query["longitude"][0])
    except (KeyError, IndexError, ValueError) as exc:
        raise ValueError("NASA request URL is missing valid site coordinates") from exc
    if not math.isclose(lat, cfg["latitude"], abs_tol=1e-9) or not math.isclose(lon, cfg["longitude"], abs_tol=1e-9):
        raise ValueError(f"NASA request URL coordinates do not match {site}")


def annual_observations(monthly: dict[str, Any], fill_value: float,
                        years=range(START_YEAR, END_YEAR + 1)) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    """Create day-weighted means only for years with 12 valid monthly values."""
    if not isinstance(monthly, dict):
        raise ValueError("NASA monthly T2M values must be a JSON object")
    if not _finite_number(fill_value):
        raise ValueError("NASA header does not contain a finite fill_value")

    observations: list[dict[str, Any]] = []
    excluded: list[dict[str, Any]] = []
    for year in years:
        if isinstance(year, bool) or not isinstance(year, int):
            raise ValueError("Analysis years must be integers")
        values: list[tuple[int, float]] = []
        missing: list[str] = []
        for month in range(1, 13):
            key = f"{year}{month:02d}"
            value = monthly.get(key)
            if not _finite_number(value) or value == fill_value:
                missing.append(key)
            else:
                values.append((month, float(value)))
        if missing:
            excluded.append({
                "year": year,
                "reason": "Incomplete or invalid monthly T2M",
                "months": missing,
            })
            continue

        days = [calendar.monthrange(year, month)[1] for month, _ in values]
        denominator = sum(days)
        expected_days = 366 if calendar.isleap(year) else 365
        if denominator != expected_days:
            raise ValueError(f"Calendar day count is inconsistent for {year}")
        mean = sum(value * day_count for (_, value), day_count in zip(values, days)) / denominator
        if not math.isfinite(mean):
            excluded.append({"year": year, "reason": "Annual mean is not finite", "months": []})
            continue
        observations.append({"year": year, "value": mean})
    return observations, excluded


def ols_summary(observations: list[dict[str, Any]]) -> dict[str, Any]:
    """Fit OLS only when the MVP's explicitly conservative reporting gate is met."""
    threshold = REPORTING_THRESHOLD_YEARS
    n = len(observations)
    result: dict[str, Any] = {
        "method": "OLS; two-sided classical p-value is exploratory",
        "reportingStatus": "SUPPRESSED_INSUFFICIENT_DATA",
        "reportingThresholdYears": threshold,
        "validYearCount": n,
        "slopePerYear": None,
        "slopePerDecade": None,
        "intercept": None,
        "pValueTwoSided": None,
        "rSquared": None,
    }
    if n < threshold:
        return result

    years: list[int] = []
    values: list[float] = []
    for row in observations:
        if not isinstance(row, dict):
            result["reportingStatus"] = "SUPPRESSED_INVALID_INPUT"
            return result
        year, value = row.get("year"), row.get("value")
        if isinstance(year, bool) or not isinstance(year, int) or not _finite_number(value):
            result["reportingStatus"] = "SUPPRESSED_INVALID_INPUT"
            return result
        years.append(year)
        values.append(float(value))
    if len(set(years)) != n or years != sorted(years):
        result["reportingStatus"] = "SUPPRESSED_INVALID_INPUT"
        return result
    if max(values) == min(values):
        result["reportingStatus"] = "SUPPRESSED_DEGENERATE_DATA"
        return result

    try:
        fitted = linregress(years, values)
    except (ValueError, FloatingPointError):
        result["reportingStatus"] = "SUPPRESSED_INVALID_FIT"
        return result
    fields = (fitted.slope, fitted.intercept, fitted.pvalue, fitted.rvalue)
    if not all(math.isfinite(value) for value in fields):
        result["reportingStatus"] = "SUPPRESSED_INVALID_FIT"
        return result

    result.update({
        "reportingStatus": "REPORTED_EXPLORATORY",
        "slopePerYear": float(fitted.slope),
        "slopePerDecade": float(10 * fitted.slope),
        "intercept": float(fitted.intercept),
        "pValueTwoSided": float(fitted.pvalue),
        "rSquared": float(fitted.rvalue ** 2),
    })
    return result


def _validate_payload(data: Any, site: str) -> tuple[dict[str, Any], dict[str, Any], dict[str, Any], dict[str, Any]]:
    if not isinstance(data, dict) or data.get("type") != "Feature":
        raise ValueError("NASA response is not a GeoJSON Feature object")
    header = data.get("header")
    params = data.get("parameters")
    properties = data.get("properties")
    geometry = data.get("geometry")
    if not all(isinstance(value, dict) for value in (header, params, properties, geometry)):
        raise ValueError("NASA response is missing header, parameters, properties, or geometry")
    if header.get("start") != EXPECTED_START or header.get("end") != EXPECTED_END:
        raise ValueError("NASA response time coverage does not match 1991-2024")
    sources = header.get("sources")
    if not isinstance(sources, list) or "MERRA2" not in sources:
        raise ValueError("NASA response does not identify the expected MERRA-2 source")
    parameter = params.get("T2M")
    if not isinstance(parameter, dict) or parameter.get("units") not in {"C", "degC"}:
        raise ValueError("NASA T2M unit is missing or is not Celsius")
    parameter_values = properties.get("parameter")
    if not isinstance(parameter_values, dict) or not isinstance(parameter_values.get("T2M"), dict):
        raise ValueError("NASA response is missing properties.parameter.T2M monthly values")
    if geometry.get("type") != "Point":
        raise ValueError("NASA response geometry is not a Point")
    coords = geometry.get("coordinates")
    if (not isinstance(coords, list) or len(coords) < 2
            or not _finite_number(coords[0]) or not _finite_number(coords[1])
            or not -180 <= coords[0] <= 180 or not -90 <= coords[1] <= 90):
        raise ValueError("NASA response geometry has invalid longitude/latitude")
    cfg = SITES[site]
    if abs(float(coords[0]) - cfg["longitude"]) > 1 or abs(float(coords[1]) - cfg["latitude"]) > 1:
        raise ValueError("NASA response geometry is unexpectedly far from the requested point")
    fill_value = header.get("fill_value")
    if not _finite_number(fill_value):
        raise ValueError("NASA response header has no finite fill_value")

    monthly = parameter_values["T2M"]
    allowed_keys = {
        f"{year}{month:02d}"
        for year in range(START_YEAR, END_YEAR + 1)
        for month in range(1, 13)
    }
    allowed_keys.update(f"{year}13" for year in range(START_YEAR, END_YEAR + 1))
    if any(not isinstance(key, str) for key in monthly):
        raise ValueError("NASA T2M time keys must be strings")
    unexpected = sorted(set(monthly) - allowed_keys)
    if unexpected:
        raise ValueError("NASA T2M contains keys outside the requested period: " + ", ".join(unexpected[:5]))
    return header, parameter, geometry, monthly


def build_dataset(site: str, raw_bytes: bytes, provenance: dict[str, Any],
                  capture_evidence: dict[str, Any] | None = None) -> dict[str, Any]:
    if site not in SITES:
        raise ValueError(f"Unsupported site: {site}")
    if not isinstance(raw_bytes, bytes):
        raise ValueError("Raw NASA response must be bytes")
    if not isinstance(provenance, dict):
        raise ValueError("Raw-response provenance must be an object")
    if provenance.get("status") != VALID_RAW_STATUS or provenance.get("httpStatus") != 200:
        raise ValueError(f"No successful, unvalidated NASA response is recorded for {site}")
    if str(provenance.get("contentType", "")).split(";", 1)[0].strip().lower() != "application/json":
        raise ValueError(f"NASA response content type is not application/json for {site}")

    source_url = provenance.get("requestUrl")
    _validate_request_url(source_url, site)
    requested = provenance.get("requestedCoordinates")
    if (not isinstance(requested, dict)
            or not math.isclose(float(requested.get("latitude", math.nan)), SITES[site]["latitude"], abs_tol=1e-9)
            or not math.isclose(float(requested.get("longitude", math.nan)), SITES[site]["longitude"], abs_tol=1e-9)):
        raise ValueError(f"Recorded requested coordinates do not match {site}")
    _validate_timestamp(provenance.get("accessedAt"))

    raw_hash = hashlib.sha256(raw_bytes).hexdigest()
    if provenance.get("rawSha256") != raw_hash:
        raise ValueError(f"Raw response SHA-256 does not match provenance for {site}")
    try:
        payload = json.loads(raw_bytes)
    except (UnicodeDecodeError, json.JSONDecodeError) as exc:
        raise ValueError(f"NASA response is not valid UTF-8 JSON for {site}") from exc
    header, parameter, geometry, monthly = _validate_payload(payload, site)

    observations, excluded_years = annual_observations(monthly, header["fill_value"])
    trend = ols_summary(observations)
    coords = geometry["coordinates"]
    missing_markers = sorted({float(value) for value in monthly.values()
                              if _finite_number(value) and value == header["fill_value"]})
    capture = capture_evidence if isinstance(capture_evidence, dict) else None
    response_metadata: dict[str, Any] = {
        "header": header,
        "parameters": {"T2M": parameter},
        "geometry": geometry,
        "responseType": payload.get("type"),
    }
    if capture:
        response_metadata["captureEvidence"] = capture

    return {
        "schemaVersion": "1.0",
        "locationId": site,
        "label": SITES[site]["label"],
        "requestedCoordinates": {"latitude": SITES[site]["latitude"], "longitude": SITES[site]["longitude"]},
        "returnedGridCoordinates": {"latitude": float(coords[1]), "longitude": float(coords[0])},
        "returnedGeometryElevationM": float(coords[2]) if len(coords) > 2 and _finite_number(coords[2]) else None,
        "returnedCoordinatesMeaning": "NASA POWER response geometry point; native grid-cell center not independently established",
        "variable": "T2M",
        "unit": "degC",
        "startYear": START_YEAR,
        "endYear": END_YEAR,
        "validYears": [item["year"] for item in observations],
        "excludedYears": excluded_years,
        "completeYearCount": len(observations),
        "reportingThresholdYears": REPORTING_THRESHOLD_YEARS,
        "source": "NASA POWER Monthly Point API; meteorological source MERRA-2",
        "sourceUrl": source_url,
        "accessedAt": provenance["accessedAt"],
        "verificationStatus": "SOURCE_RESPONSE_VALIDATED_AND_PROCESSED",
        "responseMetadata": response_metadata,
        "missingValueMarkersObserved": missing_markers,
        "processing": "Custom TrendEarth day-weighted annual mean from 12 NASA monthly means; Gregorian leap years respected; YYYY13 annual summaries ignored.",
        "missingValuePolicy": "Reject documented fill value and invalid/non-finite month; exclude incomplete years; never impute.",
        "rawInputSha256": raw_hash,
        "observations": observations,
        "trend": trend,
    }


def _atomic_write_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_name(f".{path.name}.{os.getpid()}.tmp")
    try:
        temporary.write_text(json.dumps(value, ensure_ascii=False, indent=2, allow_nan=False) + "\n", encoding="utf-8")
        os.replace(temporary, path)
    finally:
        if temporary.exists():
            temporary.unlink()


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--raw-dir", type=Path, default=ROOT / "data" / "raw")
    parser.add_argument("--out-dir", type=Path, default=ROOT / "data" / "processed")
    args = parser.parse_args(argv)
    try:
        summary = json.loads((args.raw_dir / "probe-summary.json").read_text(encoding="utf-8"))
        if not isinstance(summary, dict) or not isinstance(summary.get("results"), list):
            raise ValueError("Probe summary is missing its results list")
        provenance = {item.get("site"): item for item in summary["results"] if isinstance(item, dict)}
        outputs: dict[str, dict[str, Any]] = {}
        for site in SITES:
            source = provenance.get(site)
            if source is None:
                raise ValueError(f"Probe summary has no NASA response record for {site}")
            raw_path = args.raw_dir / f"{site}-raw.json"
            outputs[site] = build_dataset(site, raw_path.read_bytes(), source, summary.get("captureEvidence"))
        # Validate both locations before replacing either processed file.
        for site, dataset in outputs.items():
            _atomic_write_json(args.out_dir / f"{site}.json", dataset)
            trend = dataset["trend"]
            print(f"{site}: {dataset['completeYearCount']} complete years; {trend['reportingStatus']}; "
                  f"slope={trend['slopePerDecade']} degC/decade; p={trend['pValueTwoSided']}")
        return 0
    except (OSError, ValueError, json.JSONDecodeError, KeyError, TypeError) as exc:
        print(f"ERROR: dataset generation stopped safely: {type(exc).__name__}: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
