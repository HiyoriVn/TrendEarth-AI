/** Descriptive transforms only. These functions never refit scientific inference. */
const finite = value => typeof value === 'number' && Number.isFinite(value);

function annualMap(data) {
  const result = new Map();
  for (const row of data.observations) {
    if (!Number.isInteger(row.year) || !finite(row.value) || result.has(row.year)) {
      throw new Error('Descriptive transforms require unique complete annual observations.');
    }
    result.set(row.year, row.value);
  }
  return result;
}

/** Fixed 1991–2020 reference; all 30 complete annual values are mandatory. */
export function baseline(data) {
  const values = annualMap(data);
  let sum = 0;
  for (let year = 1991; year <= 2020; year += 1) {
    if (!values.has(year)) return null;
    sum += values.get(year);
  }
  return sum / 30;
}

export function displaySeries(data, mode = 'annual') {
  const values = annualMap(data);
  const years = [...values.keys()].sort((a, b) => a - b);
  if (mode === 'annual') return years.map(year => ({ year, value: values.get(year) }));
  if (mode === 'anomaly') {
    const reference = baseline(data);
    return reference === null ? [] : years.map(year => ({ year, value: values.get(year) - reference }));
  }
  if (mode === 'moving') {
    return years.flatMap(year => {
      const window = Array.from({ length: 5 }, (_, index) => year - 4 + index);
      if (!window.every(item => values.has(item))) return [];
      return [{ year, value: window.reduce((sum, item) => sum + values.get(item), 0) / 5 }];
    });
  }
  throw new Error(`Unknown display mode: ${mode}`);
}

export function inspectYear(datasets, year) {
  if (!Number.isInteger(year) || year < 1991 || year > 2024) throw new Error('Year must be within 1991–2024.');
  return datasets.map(data => {
    const values = annualMap(data);
    const status = values.has(year) ? 'complete'
      : data.excludedYears.some(row => row.year === year) ? 'excluded' : 'missing';
    return { locationId: data.locationId, year, value: values.get(year) ?? null, status };
  });
}

// Quote every field, escape embedded quotes, and neutralize spreadsheet formulas
// in textual metadata. Finite numeric temperatures remain real numeric cells.
function csvCell(value) {
  if (value === null || value === undefined) return '""';
  if (typeof value === 'number') {
    if (!finite(value)) throw new Error('Cannot export non-finite climate values.');
    return String(value);
  }
  let text = String(value);
  if (/^[\s\u0000-\u001f]*[=+\-@]/.test(text) || /^[\t\r\n]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

/** Raw annual means only; descriptive chart modes never alter exported data. */
export function buildCsv(datasets) {
  const rows = [['year', 'locationId', 'annualC', 'status', 'exclusionReason', 'sourceUrl', 'accessedAt']];
  for (let year = 1991; year <= 2024; year += 1) {
    for (const [index, row] of inspectYear(datasets, year).entries()) {
      const data = datasets[index];
      const reason = data.excludedYears.find(item => item.year === year)?.reason ?? '';
      rows.push([year, row.locationId, row.value, row.status, reason, data.sourceUrl, data.accessedAt]);
    }
  }
  return rows.map(row => row.map(csvCell).join(',')).join('\r\n') + '\r\n';
}
