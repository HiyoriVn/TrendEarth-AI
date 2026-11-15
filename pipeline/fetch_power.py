#!/usr/bin/env python3
"""Fetch and retain raw NASA POWER monthly T2M responses; no analysis is done here."""
from __future__ import annotations

import argparse
import hashlib
import json
import math
import os
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
START_YEAR = 1991
END_YEAR = 2024
BASE_URL = "https://power.larc.nasa.gov/api/temporal/monthly/point"
SITES: dict[str, dict[str, Any]] = {
    "hanoi": {"latitude": 21.03, "longitude": 105.85},
    "can-tho": {"latitude": 10.03, "longitude": 105.78},
}


def request_url(site: str) -> str:
    if site not in SITES:
        raise ValueError(f"Unsupported NASA POWER site: {site}")
    cfg = SITES[site]
    query = urlencode([
        ("parameters", "T2M"), ("community", "SB"),
        ("longitude", cfg["longitude"]), ("latitude", cfg["latitude"]),
        ("format", "JSON"), ("start", START_YEAR), ("end", END_YEAR),
    ])
    return f"{BASE_URL}?{query}"


def _iso_utc_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="microseconds")


def _record_response(site: str, timeout_seconds: float) -> tuple[dict[str, Any], bytes | None]:
    cfg = SITES[site]
    url = request_url(site)
    record: dict[str, Any] = {
        "site": site,
        "requestedCoordinates": {"latitude": cfg["latitude"], "longitude": cfg["longitude"]},
        "requestUrl": url,
        "accessedAt": _iso_utc_now(),
    }
    request = Request(url, headers={
        "Accept": "application/json",
        "User-Agent": "TrendEarth-AI-data-pipeline/1.0",
    })
    try:
        with urlopen(request, timeout=timeout_seconds) as response:
            status = int(response.status)
            content_type = response.headers.get_content_type()
            body = response.read()
    except HTTPError as exc:
        body = exc.read()
        record.update({
            "status": "HTTP_ERROR",
            "httpStatus": int(exc.code),
            "contentType": exc.headers.get_content_type() if exc.headers else None,
            "responseBodySha256": hashlib.sha256(body).hexdigest(),
            "errorType": type(exc).__name__,
            "errorMessage": str(exc),
        })
        return record, body
    except (URLError, TimeoutError, OSError) as exc:
        record.update({
            "status": "FETCH_FAILED",
            "httpStatus": None,
            "contentType": None,
            "errorType": type(exc).__name__,
            "errorMessage": str(exc),
        })
        return record, None

    digest = hashlib.sha256(body).hexdigest()
    record.update({"httpStatus": status, "contentType": content_type,
                   "responseBodySha256": digest})
    if status != 200:
        record["status"] = "HTTP_ERROR"
        record["errorMessage"] = f"NASA POWER returned HTTP {status}"
        return record, body
    if content_type != "application/json":
        record["status"] = "RAW_RECEIVED_NON_JSON"
        record["errorMessage"] = f"Expected application/json, received {content_type}"
        return record, body
    try:
        payload = json.loads(body)
    except (UnicodeDecodeError, json.JSONDecodeError) as exc:
        record.update({"status": "RAW_RECEIVED_INVALID_JSON", "errorType": type(exc).__name__,
                       "errorMessage": str(exc)})
        return record, body

    record["status"] = "RAW_RECEIVED_NOT_VALIDATED"
    record["rawSha256"] = digest
    if isinstance(payload, dict):
        record["topLevelKeys"] = sorted(payload)
        header = payload.get("header")
        parameters = payload.get("parameters")
        geometry = payload.get("geometry")
        if isinstance(header, dict):
            record["header"] = header
        if isinstance(parameters, dict) and isinstance(parameters.get("T2M"), dict):
            record["parametersMetadata"] = {"T2M": parameters["T2M"]}
        if isinstance(geometry, dict):
            record["geometry"] = geometry
        try:
            monthly = payload["properties"]["parameter"]["T2M"]
            if isinstance(monthly, dict):
                month_keys = sorted(key for key in monthly if isinstance(key, str)
                                    and len(key) == 6 and key.isdigit()
                                    and 1 <= int(key[4:]) <= 12)
                record["monthlyKeysCount"] = len(month_keys)
                record["firstMonth"] = month_keys[0] if month_keys else None
                record["lastMonth"] = month_keys[-1] if month_keys else None
                record["nonMonthlyKeys"] = sorted(key for key in monthly if key not in month_keys)[:40]
                fill = header.get("fill_value") if isinstance(header, dict) else None
                record["observedFillValues"] = sorted({value for value in monthly.values()
                                                        if isinstance(value, (int, float)) and value == fill})
        except (KeyError, TypeError):
            record["responseShapeNote"] = "properties.parameter.T2M not found; analysis must reject this response"
    else:
        record["status"] = "RAW_RECEIVED_INVALID_JSON_ROOT"
        record["errorMessage"] = "JSON root is not an object"
    return record, body


def _atomic_write(path: Path, content: bytes) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_name(f".{path.name}.{os.getpid()}.tmp")
    try:
        temporary.write_bytes(content)
        os.replace(temporary, path)
    finally:
        if temporary.exists():
            temporary.unlink()


def _atomic_write_json(path: Path, value: Any) -> None:
    body = json.dumps(value, ensure_ascii=False, indent=2, allow_nan=False).encode("utf-8") + b"\n"
    _atomic_write(path, body)


def fetch_all(raw_dir: Path, timeout_seconds: float = 30.0) -> tuple[dict[str, Any], int]:
    if not math.isfinite(timeout_seconds) or timeout_seconds <= 0:
        raise ValueError("Timeout must be a finite positive number")
    results: list[dict[str, Any]] = []
    bodies: dict[str, bytes] = {}
    for site in SITES:
        record, body = _record_response(site, timeout_seconds)
        results.append(record)
        if body is not None:
            bodies[site] = body

    summary = {
        "scope": "raw NASA response capture only; validation and statistics are performed by analyze.py",
        "attemptedAt": _iso_utc_now(),
        "results": results,
    }
    # Keep unsuccessful sites' previous raw files untouched. The per-run summary
    # blocks analysis unless both site records are successful and hash-matched.
    for site, body in bodies.items():
        suffix = "json" if next(r for r in results if r["site"] == site)["status"] == "RAW_RECEIVED_NOT_VALIDATED" else "body.bin"
        _atomic_write(raw_dir / f"{site}-raw.{suffix}", body)
    _atomic_write_json(raw_dir / "probe-summary.json", summary)
    success = all(r.get("status") == "RAW_RECEIVED_NOT_VALIDATED" and r.get("httpStatus") == 200
                  for r in results)
    return summary, 0 if success else 1


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--raw-dir", type=Path, default=ROOT / "data" / "raw")
    parser.add_argument("--timeout", type=float, default=30.0)
    args = parser.parse_args(argv)
    try:
        summary, code = fetch_all(args.raw_dir, args.timeout)
    except (OSError, ValueError) as exc:
        print(f"ERROR: NASA fetch preparation failed: {type(exc).__name__}: {exc}", file=sys.stderr)
        return 1
    for result in summary["results"]:
        print(f"{result['site']}: {result['status']}; HTTP={result.get('httpStatus')}; "
              f"error={result.get('errorMessage')}")
    return code


if __name__ == "__main__":
    raise SystemExit(main())
