const SITES = {
  hanoi: { latitude: 21.03, longitude: 105.85 },
  'can-tho': { latitude: 10.03, longitude: 105.78 },
};
const numericFitFields = ['slopePerYear', 'slopePerDecade', 'intercept', 'pValueTwoSided', 'rSquared'];
const finite = value => typeof value === 'number' && Number.isFinite(value);
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const fail = message => { throw new Error(`Invalid climate dataset: ${message}`); };
const near = (a, b) => Math.abs(a - b) <= 1e-10;

export function canReport(data) {
  return data?.trend?.reportingStatus === 'REPORTED_EXPLORATORY'
    && data.completeYearCount >= 30 && data.reportingThresholdYears === 30
    && numericFitFields.every(key => finite(data.trend[key]));
}

export function validateDataset(data, site) {
  if (!object(data) || !SITES[site] || data.locationId !== site) fail('location does not match selection');
  if (data.schemaVersion !== '1.0' || data.variable !== 'T2M' || data.unit !== 'degC'
      || data.startYear !== 1991 || data.endYear !== 2024) fail('unsupported schema, variable, unit or period');
  for (const key of ['label', 'source', 'processing', 'missingValuePolicy', 'returnedCoordinatesMeaning']) {
    if (typeof data[key] !== 'string' || !data[key].trim()) fail(`${key} is missing`);
  }
  if (data.verificationStatus !== 'SOURCE_RESPONSE_VALIDATED_AND_PROCESSED') fail('source is not validated');
  if (typeof data.accessedAt !== 'string' || !Number.isFinite(Date.parse(data.accessedAt))) fail('invalid access timestamp');
  if (!/^[a-f0-9]{64}$/.test(data.rawInputSha256)) fail('missing source hash');
  let url;
  try { url = new URL(data.sourceUrl); } catch { fail('invalid NASA source URL'); }
  if (url.protocol !== 'https:' || url.hostname !== 'power.larc.nasa.gov'
      || url.pathname !== '/api/temporal/monthly/point') fail('unexpected source URL');
  for (const [key, expected] of Object.entries({parameters:'T2M', community:'SB', format:'JSON', start:'1991', end:'2024'})) {
    if (url.searchParams.getAll(key).length !== 1 || url.searchParams.get(key) !== expected) fail(`invalid request ${key}`);
  }
  for (const key of ['latitude', 'longitude']) {
    if (!object(data.requestedCoordinates) || !finite(data.requestedCoordinates[key])
        || !near(data.requestedCoordinates[key], SITES[site][key])
        || !near(Number(url.searchParams.get(key)), SITES[site][key])) fail('requested coordinates mismatch');
  }
  if (!object(data.returnedGridCoordinates) || !finite(data.returnedGridCoordinates.latitude)
      || !finite(data.returnedGridCoordinates.longitude)
      || Math.abs(data.returnedGridCoordinates.latitude) > 90
      || Math.abs(data.returnedGridCoordinates.longitude) > 180) fail('invalid returned coordinates');
  if (!object(data.responseMetadata) || !Array.isArray(data.missingValueMarkersObserved)) fail('missing source metadata');
  if (!Array.isArray(data.observations) || !Array.isArray(data.validYears) || !Array.isArray(data.excludedYears)) fail('missing annual observations');
  if (!Number.isInteger(data.completeYearCount) || data.completeYearCount !== data.observations.length
      || data.validYears.length !== data.completeYearCount || data.reportingThresholdYears !== 30) fail('inconsistent annual counts or reporting policy');
  let previous = 1990;
  const included = new Set();
  data.observations.forEach((row, index) => {
    if (!object(row) || !Number.isInteger(row.year) || row.year <= previous || row.year > 2024
        || !finite(row.value) || data.validYears[index] !== row.year) fail('invalid, unsorted or duplicate observation');
    previous = row.year;
    included.add(row.year);
  });
  const excluded = new Set();
  for (const row of data.excludedYears) {
    if (!object(row) || !Number.isInteger(row.year) || row.year < 1991 || row.year > 2024
        || included.has(row.year) || excluded.has(row.year) || typeof row.reason !== 'string'
        || !row.reason.trim() || !Array.isArray(row.months)) fail('invalid excluded year');
    excluded.add(row.year);
  }
  if (included.size + excluded.size !== 34) fail('annual coverage is not fully accounted for');
  if (!object(data.trend) || data.trend.validYearCount !== data.completeYearCount
      || data.trend.reportingThresholdYears !== 30 || typeof data.trend.method !== 'string'
      || !data.trend.method.toLowerCase().includes('exploratory')) fail('invalid trend metadata');
  if (data.trend.reportingStatus === 'REPORTED_EXPLORATORY') {
    if (!canReport(data) || !near(data.trend.slopePerDecade, 10 * data.trend.slopePerYear)
        || data.trend.pValueTwoSided < 0 || data.trend.pValueTwoSided > 1
        || data.trend.rSquared < 0 || data.trend.rSquared > 1) fail('invalid reported fit');
  } else {
    if (!['SUPPRESSED_INSUFFICIENT_DATA', 'SUPPRESSED_DEGENERATE_DATA', 'SUPPRESSED_INVALID_INPUT', 'SUPPRESSED_INVALID_FIT'].includes(data.trend.reportingStatus)
        || numericFitFields.some(key => data.trend[key] !== null)) fail('suppressed fit contains numeric outputs');
    if (data.completeYearCount < 30 && data.trend.reportingStatus !== 'SUPPRESSED_INSUFFICIENT_DATA') fail('wrong below-threshold reporting state');
    if (data.completeYearCount >= 30 && data.trend.reportingStatus === 'SUPPRESSED_INSUFFICIENT_DATA') fail('wrong complete-year reporting state');
  }
  return data;
}
