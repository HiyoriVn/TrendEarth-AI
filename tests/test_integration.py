"""Independent cached-data calculations and static integration contract."""
import calendar
import hashlib
import json
import math
import unittest
from pathlib import Path
from scipy.stats import t

ROOT = Path(__file__).resolve().parents[1]


class IntegrationTests(unittest.TestCase):
    def test_independent_annual_ols_and_contract(self):
        summary = json.loads((ROOT / 'data/raw/probe-summary.json').read_text())
        for site in ('hanoi', 'can-tho'):
            with self.subTest(site=site):
                raw = (ROOT / f'data/raw/{site}-raw.json').read_bytes()
                payload = json.loads(raw)
                data = json.loads((ROOT / f'data/processed/{site}.json').read_text())
                required = 'locationId label requestedCoordinates returnedGridCoordinates variable unit startYear endYear validYears excludedYears completeYearCount reportingThresholdYears source sourceUrl accessedAt verificationStatus responseMetadata missingValueMarkersObserved processing missingValuePolicy observations trend'.split()
                self.assertTrue(set(required) <= data.keys())
                self.assertEqual(data['rawInputSha256'], hashlib.sha256(raw).hexdigest())
                record = next(x for x in summary['results'] if x['site'] == site)
                self.assertEqual(record['rawSha256'], data['rawInputSha256'])
                values = payload['properties']['parameter']['T2M']
                annual = []
                for year in range(1991, 2025):
                    months = [values.get(f'{year}{m:02d}') for m in range(1, 13)]
                    if any(not isinstance(v, (int, float)) or isinstance(v, bool) or not math.isfinite(v) or v == payload['header']['fill_value'] for v in months):
                        continue
                    days = [calendar.monthrange(year, m)[1] for m in range(1, 13)]
                    annual.append((year, sum(v*d for v,d in zip(months, days))/sum(days)))
                self.assertEqual(data['validYears'], [y for y,v in annual])
                self.assertEqual(data['completeYearCount'], len(annual))
                for observed, (_, expected) in zip(data['observations'], annual):
                    self.assertAlmostEqual(observed['value'], expected, places=12)
                n = len(annual)
                xbar = sum(x for x,y in annual)/n
                ybar = sum(y for x,y in annual)/n
                sxx = sum((x-xbar)**2 for x,y in annual)
                slope = sum((x-xbar)*(y-ybar) for x,y in annual)/sxx
                intercept = ybar-slope*xbar
                residual = sum((y-intercept-slope*x)**2 for x,y in annual)
                se = math.sqrt(residual/(n-2)/sxx)
                pvalue = 2*t.sf(abs(slope/se), n-2)
                fit = data['trend']
                for key,value in [('slopePerYear', slope), ('slopePerDecade', slope*10), ('intercept',intercept), ('pValueTwoSided',float(pvalue))]:
                    self.assertTrue(math.isclose(fit[key],value,rel_tol=1e-12,abs_tol=1e-12), key)
                self.assertEqual(data['reportingThresholdYears'], 30)
                self.assertIn('exploratory', fit['method'])
                print(f'{site}: {n} complete years; independent slope/decade={slope*10:.15g}; p={pvalue:.15g}')
