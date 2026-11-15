#!/usr/bin/env python3
"""Diagnose live NASA POWER monthly/point T2M responses without inventing values."""
import datetime as dt
import json
import os
import sys
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import Request, urlopen

SITES = {"hanoi": (21.03, 105.85), "can-tho": (10.03, 105.78)}
OUT = Path(os.getenv("PROBE_OUTPUT", "artifacts/nasa-power-probe"))
OUT.mkdir(parents=True, exist_ok=True)
results = []
for name, (lat, lon) in SITES.items():
    qs = urlencode({"parameters": "T2M", "community": "SB", "longitude": lon,
                    "latitude": lat, "format": "JSON", "start": "1991", "end": "2024"})
    url = "https://power.larc.nasa.gov/api/temporal/monthly/point?" + qs
    item = {"site": name, "requestedCoordinates": {"latitude": lat, "longitude": lon},
            "requestUrl": url, "accessedAt": dt.datetime.now(dt.timezone.utc).isoformat(),
            "status": "UNVERIFIED"}
    try:
        with urlopen(Request(url, headers={"Accept": "application/json",
                       "User-Agent": "TrendEarth-science-probe/1.0"}), timeout=50) as response:
            content = response.read()
            item["httpStatus"] = response.status
            item["contentType"] = response.headers.get("Content-Type")
        body = json.loads(content)
        (OUT / (name + "-raw.json")).write_text(json.dumps(body, indent=2), encoding="utf8")
        if not isinstance(body, dict):
            raise ValueError("Root JSON was not an object")
        item["topLevelKeys"] = sorted(body)
        item["header"] = body.get("header")
        item["parametersMetadata"] = body.get("parameters")
        item["geometry"] = body.get("geometry")
        t2m = body.get("properties", {}).get("parameter", {}).get("T2M")
        if not isinstance(t2m, dict):
            raise ValueError("Could not find properties.parameter.T2M")
        keys = sorted(k for k in t2m if k.isdigit() and len(k) == 6 and 1 <= int(k[4:]) <= 12)
        item["monthlyKeysCount"] = len(keys)
        item["firstMonth"] = keys[0] if keys else None
        item["lastMonth"] = keys[-1] if keys else None
        item["nonMonthlyKeys"] = sorted(set(t2m) - set(keys))[:20]
        item["candidateMissingValuesToInvestigate"] = sorted(set(
            v for k, v in t2m.items() if k in keys and isinstance(v, (int, float)) and v < -90))
        item["status"] = "RAW_RECEIVED_NOT_VALIDATED"
    except Exception as exc:
        item["error"] = str(exc)
        item["exceptionType"] = type(exc).__name__
    results.append(item)
    print(name, item["status"], item.get("error", ""), flush=True)
(OUT / "summary.json").write_text(json.dumps({"scope": "diagnostic only; NOT verified climate statistics",
    "results": results}, indent=2), encoding="utf8")
sys.exit(0 if all(r["status"] == "RAW_RECEIVED_NOT_VALIDATED" for r in results) else 1)
