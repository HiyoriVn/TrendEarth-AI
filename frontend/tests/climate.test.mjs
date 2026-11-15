import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { baseline, displaySeries, inspectYear, buildCsv } from '../src/climate.js';

// Synthetic numerical fixtures are test-only, never copied to production assets.
const fixture = () => ({
  locationId: 'fixture',
  observations: Array.from({ length: 34 }, (_, i) => ({ year: 1991 + i, value: i })),
  excludedYears: [], sourceUrl: 'https://power.larc.nasa.gov/example', accessedAt: '2026-11-14T18:00:00Z',
});
const load = async site => JSON.parse(await readFile(new URL(`../../data/processed/${site}.json`, import.meta.url), 'utf8'));

test('fixed baseline is the arithmetic mean of all 30 reference annual values', () => {
  assert.equal(baseline(fixture()), 14.5);
  const transformed = displaySeries(fixture(), 'anomaly');
  assert.equal(transformed.filter(row => row.year <= 2020).reduce((sum, row) => sum + row.value, 0), 0);
  assert.equal(transformed.at(-1).value, 18.5);
});

test('one missing baseline year suppresses anomalies rather than silently filling', () => {
  const data = fixture(); data.observations.splice(9, 1);
  assert.equal(baseline(data), null);
  assert.deepEqual(displaySeries(data, 'anomaly'), []);
});

test('missing post-baseline year does not invalidate the complete baseline', () => {
  const data = fixture(); data.observations.pop();
  assert.equal(baseline(data), 14.5);
});

test('trailing average needs five complete contiguous years and does not extrapolate', () => {
  const values = displaySeries(fixture(), 'moving');
  assert.equal(values.length, 30);
  assert.deepEqual(values[0], { year: 1995, value: 2 });
  assert.deepEqual(values.at(-1), { year: 2024, value: 31 });
});

test('trailing average never bridges a missing year', () => {
  const data = fixture(); data.observations = data.observations.filter(row => row.year !== 2000);
  const years = displaySeries(data, 'moving').map(row => row.year);
  for (let year = 2000; year <= 2004; year++) assert.equal(years.includes(year), false);
  assert.equal(years.includes(1999), true);
  assert.equal(years.includes(2005), true);
});

test('empty annual input gives explicit empty transforms and no baseline', () => {
  const data = fixture(); data.observations = [];
  assert.equal(baseline(data), null);
  assert.deepEqual(displaySeries(data, 'annual'), []);
  assert.deepEqual(displaySeries(data, 'moving'), []);
});

test('inspector aligns by calendar year regardless of input observation order', () => {
  const a = fixture(), b = fixture(); b.locationId = 'second';
  b.observations.reverse(); b.observations.find(row => row.year === 2005).value = 19;
  const rows = inspectYear([a, b], 2005);
  assert.equal(rows[0].value, 14); assert.equal(rows[1].value, 19);
  assert.equal(rows[1].value - rows[0].value, 5);
  assert.equal(rows[0].locationId, 'fixture'); assert.equal(rows[1].locationId, 'second');
});

test('inspector reports excluded versus missing without inventing values', () => {
  const data = fixture(); data.observations = data.observations.filter(row => row.year !== 1995);
  data.excludedYears = [{ year: 1995, reason: 'Incomplete months' }];
  assert.deepEqual(inspectYear([data], 1995)[0], { locationId: 'fixture', year: 1995, value: null, status: 'excluded' });
  data.excludedYears = [];
  assert.equal(inspectYear([data], 1995)[0].status, 'missing');
  assert.throws(() => inspectYear([data], 2025));
});

test('CSV includes all years, raw annual values, identities and provenance', async () => {
  const datasets = await Promise.all(['hanoi', 'can-tho'].map(load));
  const csv = buildCsv(datasets), lines = csv.trim().split('\r\n');
  assert.equal(lines.length, 69);
  for (const data of datasets) {
    assert.ok(csv.includes(`1991,"${data.locationId}",${data.observations[0].value},"complete"`));
    assert.ok(csv.includes(`"${data.sourceUrl}"`));
    assert.ok(csv.includes(`"${data.accessedAt}"`));
    const anomalies = displaySeries(data, 'anomaly').filter(row => row.year <= 2020);
    assert.ok(Math.abs(anomalies.reduce((sum, row) => sum + row.value, 0) / 30) < 1e-12);
  }
});

test('CSV exports missing annual fields as empty and safely escapes textual metadata', () => {
  const data = fixture(); data.observations = [];
  data.locationId = '=DANGEROUS'; data.sourceUrl = 'https://example.test/"quoted",field';
  data.excludedYears = [{ year: 1991, reason: '@formula' }];
  const csv = buildCsv([data]);
  assert.ok(csv.includes('1991,"\'=DANGEROUS",,"excluded"') === false);
  assert.ok(csv.includes('1991,"\'=DANGEROUS","","excluded","\'@formula"'));
  assert.ok(csv.includes('"https://example.test/""quoted"",field"'));
});

test('transforms preserve source observations and reject malformed numerical input', () => {
  const data = fixture(), before = JSON.stringify(data);
  displaySeries(data, 'annual'); displaySeries(data, 'anomaly'); displaySeries(data, 'moving'); buildCsv([data]);
  assert.equal(JSON.stringify(data), before);
  data.observations[0].value = Infinity;
  assert.throws(() => displaySeries(data, 'annual'));
  assert.throws(() => buildCsv([data]));
  assert.throws(() => displaySeries(fixture(), 'forecast'));
});
