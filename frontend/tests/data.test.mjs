import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validateDataset, canReport } from '../src/data.js';

const load = async site => JSON.parse(await readFile(new URL(`../../data/processed/${site}.json`, import.meta.url), 'utf8'));
// Fixtures below are mutated copies used only for validation tests, never production assets.
const hanoi = await load('hanoi');

for (const site of ['hanoi', 'can-tho']) {
  test(`real ${site} dataset validates with all 34 complete years`, async () => {
    const data = await load(site);
    assert.doesNotThrow(() => validateDataset(data, site));
    assert.equal(data.observations.length, 34);
    assert.equal(canReport(data), true);
    assert.ok(data.sourceUrl.startsWith('https://power.larc.nasa.gov/'));
    assert.match(data.trend.method, /exploratory/i);
  });
}

for (const [name, mutate] of [
  ['mismatched complete-year count', data => { data.completeYearCount = 33; }],
  ['non-finite observation', data => { data.observations[0].value = Infinity; }],
  ['wrong location identity', data => { data.locationId = 'can-tho'; }],
  ['wrong temperature unit', data => { data.unit = 'kelvin'; }],
  ['unsorted annual observations', data => { data.observations.reverse(); }],
  ['duplicate annual observations', data => { data.observations[1] = {...data.observations[0]}; }],
  ['non-finite fit coefficient', data => { data.trend.slopePerYear = NaN; }],
  ['wrong reporting policy', data => { data.reportingThresholdYears = 20; }],
]) {
  test(`rejects ${name}`, () => {
    const data = structuredClone(hanoi);
    mutate(data);
    assert.throws(() => validateDataset(data, 'hanoi'));
  });
}

function incomplete(count) {
  const data = structuredClone(hanoi);
  const removed = data.observations.splice(count);
  data.validYears = data.observations.map(row => row.year);
  data.completeYearCount = count;
  data.excludedYears = removed.map(row => ({year: row.year, reason: 'Incomplete or invalid monthly T2M', months: [`${row.year}01`]}));
  data.trend.validYearCount = count;
  return data;
}

test('29 complete years retains observations and suppresses fit', () => {
  const data = incomplete(29);
  data.trend.reportingStatus = 'SUPPRESSED_INSUFFICIENT_DATA';
  for (const field of ['slopePerYear', 'slopePerDecade', 'intercept', 'pValueTwoSided', 'rSquared']) data.trend[field] = null;
  assert.doesNotThrow(() => validateDataset(data, 'hanoi'));
  assert.equal(canReport(data), false);
  assert.equal(data.observations.length, 29);
});

test('reported fit cannot bypass 30-year gate', () => {
  const data = incomplete(29);
  assert.equal(canReport(data), false);
  assert.throws(() => validateDataset(data, 'hanoi'));
});

test('exactly 30 valid complete years can report', () => {
  const data = incomplete(30);
  assert.doesNotThrow(() => validateDataset(data, 'hanoi'));
  assert.equal(canReport(data), true);
});

test('zero complete years is valid missing-data state with all exclusions retained', () => {
  const data = incomplete(0);
  data.trend.reportingStatus = 'SUPPRESSED_INSUFFICIENT_DATA';
  for (const field of ['slopePerYear', 'slopePerDecade', 'intercept', 'pValueTwoSided', 'rSquared']) data.trend[field] = null;
  assert.doesNotThrow(() => validateDataset(data, 'hanoi'));
  assert.equal(canReport(data), false);
  assert.equal(data.excludedYears.length, 34);
});

test('suppressed state rejects numeric fit leakage', () => {
  const data = incomplete(29);
  data.trend.reportingStatus = 'SUPPRESSED_INSUFFICIENT_DATA';
  assert.throws(() => validateDataset(data, 'hanoi'));
});
