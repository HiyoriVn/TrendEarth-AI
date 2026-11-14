import calendar
import hashlib
import io
import json
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "pipeline"))
from analyze import (  # noqa: E402
    SITES, annual_observations, build_dataset, ols_summary,
)
from fetch_power import _record_response, request_url  # noqa: E402


class AnnualAggregationTests(unittest.TestCase):
    def test_leap_and_normal_year_day_weights(self):
        source = {f"{year}{month:02d}": (10.0 if month == 2 else 20.0)
                  for year in (1999, 2000) for month in range(1, 13)}
        observations, excluded = annual_observations(source, -999, range(1999, 2001))
        self.assertEqual(excluded, [])
        self.assertEqual(len(observations), 2)
        self.assertAlmostEqual(observations[0]["value"], (20 * 337 + 10 * 28) / 365)
        self.assertAlmostEqual(observations[1]["value"], (20 * 337 + 10 * 29) / 366)

    def test_excludes_sentinel_missing_and_nonfinite_months(self):
        source = {f"2001{month:02d}": 20.0 for month in range(1, 13)}
        source["200101"] = -999
        source["200202"] = float("nan")
        source.update({f"2002{month:02d}": 20.0 for month in range(1, 13) if month != 2})
        observations, excluded = annual_observations(source, -999, [2001, 2002, 2003])
        self.assertEqual(observations, [])
        self.assertEqual([item["year"] for item in excluded], [2001, 2002, 2003])
        self.assertIn("200101", excluded[0]["months"])
        self.assertIn("200202", excluded[1]["months"])

    def test_annual_keys_are_ignored(self):
        source = {f"2000{month:02d}": 20.0 for month in range(1, 13)}
        source["200013"] = 9999.0
        observations, excluded = annual_observations(source, -999, [2000])
        self.assertEqual(excluded, [])
        self.assertAlmostEqual(observations[0]["value"], 20.0)


class RegressionPolicyTests(unittest.TestCase):
    def test_ols_and_decade_scaling(self):
        observations = [{"year": year, "value": 1.0 + .2 * (year - 1991)}
                        for year in range(1991, 2025)]
        fit = ols_summary(observations)
        self.assertEqual(fit["reportingStatus"], "REPORTED_EXPLORATORY")
        self.assertAlmostEqual(fit["slopePerDecade"], 2.0)
        self.assertAlmostEqual(fit["pValueTwoSided"], 0.0, places=12)
        self.assertAlmostEqual(fit["intercept"] + 1991 * fit["slopePerYear"], observations[0]["value"])

    def test_29_complete_years_suppresses_every_fit_value(self):
        observations = [{"year": year, "value": year * .01} for year in range(1991, 2020)]
        fit = ols_summary(observations)
        self.assertEqual(fit["reportingThresholdYears"], 30)
        self.assertEqual(fit["reportingStatus"], "SUPPRESSED_INSUFFICIENT_DATA")
        for key in ("slopePerYear", "slopePerDecade", "intercept", "pValueTwoSided", "rSquared"):
            self.assertIsNone(fit[key])

    def test_exactly_30_complete_years_reports(self):
        observations = [{"year": year, "value": float(year)} for year in range(1991, 2021)]
        self.assertEqual(ols_summary(observations)["reportingStatus"], "REPORTED_EXPLORATORY")

    def test_zero_variance_suppresses_fit(self):
        observations = [{"year": year, "value": 23.0} for year in range(1991, 2025)]
        fit = ols_summary(observations)
        self.assertEqual(fit["reportingStatus"], "SUPPRESSED_DEGENERATE_DATA")
        self.assertIsNone(fit["pValueTwoSided"])

    def test_duplicate_or_unsorted_years_suppress_fit(self):
        observations = [{"year": year, "value": float(year)} for year in range(1991, 2021)]
        observations[-1]["year"] = 2019
        fit = ols_summary(observations)
        self.assertEqual(fit["reportingStatus"], "SUPPRESSED_INVALID_INPUT")
        self.assertIsNone(fit["slopePerYear"])


class ProvenanceValidationTests(unittest.TestCase):
    def test_fetch_retains_actual_json_bytes_and_hash(self):
        body = b'{"type":"Feature"}'

        class Response(io.BytesIO):
            status = 200

            class Headers:
                @staticmethod
                def get_content_type():
                    return "application/json"

            headers = Headers()

            def __enter__(self):
                return self

            def __exit__(self, *_args):
                self.close()

        with patch("fetch_power.urlopen", return_value=Response(body)):
            record, captured = _record_response("hanoi", 1)
        self.assertEqual(record["status"], "RAW_RECEIVED_NOT_VALIDATED")
        self.assertEqual(captured, body)
        self.assertEqual(record["rawSha256"], hashlib.sha256(body).hexdigest())

    def test_fetch_failure_is_explicit_and_has_no_fake_body(self):
        from urllib.error import URLError

        with patch("fetch_power.urlopen", side_effect=URLError("offline")):
            record, captured = _record_response("can-tho", 1)
        self.assertEqual(record["status"], "FETCH_FAILED")
        self.assertIsNone(record["httpStatus"])
        self.assertIsNone(captured)
        self.assertIn("offline", record["errorMessage"])

    def test_request_urls_are_site_specific_nasa_monthly_requests(self):
        for site, coords in SITES.items():
            url = request_url(site)
            self.assertIn("power.larc.nasa.gov/api/temporal/monthly/point", url)
            self.assertIn("parameters=T2M", url)
            self.assertIn("start=1991", url)
            self.assertIn("end=2024", url)
            self.assertIn(f"latitude={coords['latitude']}", url)

    def test_rejects_unmatched_raw_hash(self):
        site = "hanoi"
        raw = (ROOT / "data" / "raw" / f"{site}-raw.json").read_bytes()
        summary = json.loads((ROOT / "data" / "raw" / "probe-summary.json").read_text(encoding="utf-8"))
        provenance = next(row for row in summary["results"] if row["site"] == site).copy()
        provenance["rawSha256"] = "0" * 64
        with self.assertRaisesRegex(ValueError, "SHA-256"):
            build_dataset(site, raw, provenance)

    def test_real_capture_reproduces_derived_dataset(self):
        summary = json.loads((ROOT / "data" / "raw" / "probe-summary.json").read_text(encoding="utf-8"))
        for site in SITES:
            raw = (ROOT / "data" / "raw" / f"{site}-raw.json").read_bytes()
            provenance = next(row for row in summary["results"] if row["site"] == site)
            dataset = build_dataset(site, raw, provenance, summary.get("captureEvidence"))
            persisted = json.loads((ROOT / "data" / "processed" / f"{site}.json").read_text(encoding="utf-8"))
            self.assertEqual(dataset["observations"], persisted["observations"])
            self.assertEqual(dataset["trend"], persisted["trend"])
            self.assertEqual(dataset["rawInputSha256"], hashlib.sha256(raw).hexdigest())
            self.assertEqual(dataset["completeYearCount"], 34)
            self.assertEqual(dataset["responseMetadata"]["captureEvidence"]["workflowRunId"], 43624190717)


if __name__ == "__main__":
    unittest.main()
