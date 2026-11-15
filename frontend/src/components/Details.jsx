import React from 'react';
import {baseline, displaySeries} from '../climate.js';
import {canReport} from '../data.js';

export const names = {hanoi: 'Hanoi', 'can-tho': 'Can Tho'};
export const format = (value, digits = 3) => Number.isFinite(value) ? value.toFixed(digits) : 'Unavailable';

export function Metrics({datasets}) {
  return <section className="metrics" aria-label="Original full-window annual OLS statistics">
    {datasets.map(data => <article className={`metric-site ${data.locationId}`} key={data.locationId}>
      <div className="site-title"><span className="site-dot"/><h2>{names[data.locationId]}</h2><span>RAW ANNUAL SERIES · 1991–2024</span></div>
      <div className="metric-grid">
        <div><span>OLS slope</span><strong>{canReport(data) ? format(data.trend.slopePerDecade) : '—'}<small> °C / decade</small></strong></div>
        <div><span>Exploratory p-value</span><strong>{canReport(data) ? format(data.trend.pValueTwoSided, 4) : '—'}</strong></div>
        <div><span>Complete years</span><strong>{data.completeYearCount}<small> / 34</small></strong></div>
      </div>
      {!canReport(data) && <p className="warning">Fit suppressed: requires 30 complete years and a valid, nondegenerate fit.</p>}
    </article>)}
  </section>;
}

export function YearInspector({datasets, mode, year, onYear}) {
  const rows = datasets.map(data => ({data, raw: data.observations.find(row => row.year === year)?.value, shown: displaySeries(data, mode).find(row => row.year === year)?.value}));
  const difference = rows.length === 2 && rows.every(row => Number.isFinite(row.raw)) ? rows[1].raw - rows[0].raw : null;
  return <section className="inspector panel" aria-label="Interactive year inspector">
    <div><p className="eyebrow">YEAR INSPECTOR</p><label htmlFor="inspect-year">Inspect a year</label><select id="inspect-year" value={year} onChange={event => onYear(Number(event.target.value))}>{Array.from({length: 34}, (_, index) => 1991 + index).map(value => <option key={value} value={value}>{value}</option>)}</select><p>Hover, focus or click chart points, or use this selector.</p></div>
    <div className="inspector-values" aria-live="polite">{rows.map(({data, raw, shown}) => <div key={data.locationId}><span>{names[data.locationId]} · {year}</span><strong>{format(raw)} <small>°C annual mean</small></strong>{mode !== 'annual' && <p>Displayed {mode === 'anomaly' ? 'anomaly' : 'trailing mean'}: {format(shown)}{Number.isFinite(shown) ? ' °C' : ''}</p>}{!Number.isFinite(raw) && <p>Year excluded or unavailable; no value imputed.</p>}</div>)}{rows.length === 2 && <div><span>Can Tho − Hanoi</span><strong>{format(difference)} <small>{difference === null ? '' : '°C annual difference'}</small></strong><p>Same-year point estimates, not a causal comparison.</p></div>}</div>
  </section>;
}

export function Methods({datasets, mode}) {
 return <>
  <section className="interpretation"><div><p className="eyebrow">WHAT THIS VIEW MEANS</p><h2>{mode === 'annual' ? 'The observations and the fitted trend tell different parts of the story.' : mode === 'anomaly' ? 'Anomalies show departures from each point’s own baseline.' : 'Smoothing reveals the slower pattern without adding observations.'}</h2></div><p>{mode === 'annual' ? 'Solid lines are complete annual temperature values. Dashed lines are the original OLS fits, shown only when the reporting policy permits.' : mode === 'anomaly' ? 'Each annual temperature is compared with that site’s complete 1991–2020 annual baseline. A positive anomaly means warmer than its own reference mean, not warmer than the other site.' : 'Each displayed point averages that year and the previous four complete annual values. The first possible value is 1995. Windows with a missing year are omitted.'} OLS cards above always describe the original 1991–2024 annual means; transformed views do not show or recalculate a regression.</p></section>
  <details className="panel disclosure"><summary>Understand the science <span>Definitions, reporting policy & limitations</span></summary><div className="method-grid">
    <article><h3>Temperature anomaly</h3><p>Annual mean minus the arithmetic mean of all 30 complete annual values in 1991–2020. A baseline is unavailable if any reference year is missing; no filling or partial baseline is used.</p>{datasets.map(data => <p key={data.locationId}>{names[data.locationId]} baseline: <strong>{format(baseline(data))}{baseline(data) !== null ? ' °C · 30/30 years' : ' · incomplete reference period'}</strong></p>)}</article>
    <article><h3>Trailing 5-year moving average</h3><p>The arithmetic mean of five contiguous complete annual values ending at the displayed year. It is a descriptive transform, not a forecast or an inference test. Gaps are never bridged.</p></article>
    <article><h3>Regression & exploratory p-value</h3><p>Original OLS fits annual mean against calendar year; °C/decade is ten times the yearly slope. The two-sided classical p-value tests a zero slope under model assumptions. Serial autocorrelation is not corrected. It does not establish causation or practical importance.</p></article>
    <article><h3>30-year product policy</h3><p>TrendEarth reports fits only with at least 30 complete annual values and a valid fit. This conservative reporting rule is not a universal statistical requirement or a guarantee of valid inference.</p></article>
  </div><p className="limitation">NASA POWER / MERRA-2 provides model/reanalysis point estimates, not weather-station or whole-city measurements. Native grid-cell centers are not independently established by returned geometry. TrendEarth AI is a project name; this app does not train an AI model or predict future climate. NASA attribution does not imply endorsement.</p></details>
  <details className="panel disclosure"><summary>NASA provenance & annual values <span>Exact sources, exclusions and accessible data</span></summary><div className="provenance-grid">{datasets.map(data => <article key={data.locationId}><h3>{names[data.locationId]} · NASA POWER</h3><p>{data.source}</p><a className="source-url" href={data.sourceUrl} target="_blank" rel="noreferrer">{data.sourceUrl}</a><p>Accessed: <time>{data.accessedAt}</time></p><p>Requested: {data.requestedCoordinates.latitude}° N, {data.requestedCoordinates.longitude}° E<br/>Returned geometry: {data.returnedGridCoordinates.latitude}° N, {data.returnedGridCoordinates.longitude}° E</p><p>{data.processing} {data.missingValuePolicy}</p><p>Excluded years: {data.excludedYears.length ? data.excludedYears.map(row => `${row.year} (${row.reason})`).join('; ') : 'None'}</p><div className="table-scroll"><table><caption>{names[data.locationId]} original annual means</caption><thead><tr><th scope="col">Year</th><th scope="col">Temperature (°C)</th></tr></thead><tbody>{data.observations.map(row => <tr key={row.year}><th scope="row">{row.year}</th><td>{format(row.value, 4)}</td></tr>)}</tbody></table></div></article>)}</div></details>
 </>;
}
