import React from 'react';
import {displaySeries} from '../climate.js';
import {canReport} from '../data.js';
import {format, names} from './Details.jsx';

const labels = {annual: 'Annual mean temperature', anomaly: 'Temperature anomaly vs 1991–2020', moving: 'Trailing 5-year mean temperature'};
function segments(rows) {
  return rows.reduce((groups, row) => {
    if (!groups.length || groups.at(-1).at(-1).year + 1 !== row.year) groups.push([]);
    groups.at(-1).push(row);
    return groups;
  }, []);
}

export function ClimateChart({datasets, mode, year, onYear}) {
  const series = datasets.map(data => ({data, rows: displaySeries(data, mode)}));
  const values = series.flatMap(({data, rows}) => [...rows.map(row => row.value), ...(mode === 'annual' && canReport(data) ? [1991, 2024].map(value => data.trend.intercept + data.trend.slopePerYear * value) : [])]);
  if (!values.length) return <section className="panel state" role="status"><h2>This display is unavailable</h2><p>{mode === 'anomaly' ? 'The anomaly display requires every complete annual value in the 1991–2020 baseline.' : 'No complete annual values or contiguous five-year windows are available.'} Select another display to inspect available observations.</p></section>;
  const width = 1100, height = 340, left = 66, right = 24, top = 25, bottom = 55;
  const min = Math.floor((Math.min(...values) - .2) * 2) / 2;
  const max = Math.ceil((Math.max(...values) + .2) * 2) / 2;
  const x = value => left + (value - 1991) / 33 * (width - left - right);
  const y = value => top + (max - value) / (max - min) * (height - top - bottom);
  const selected = series.map(({data, rows}) => ({id: data.locationId, row: rows.find(row => row.year === year)}));
  return <section className="panel chart-panel">
    <div className="chart-heading"><div><p className="eyebrow">THE CLIMATE RECORD · 1991–2024</p><h2>{labels[mode]}</h2></div><div className="legend">{datasets.map(data => <span className={data.locationId} key={data.locationId}><i/>{names[data.locationId]}</span>)}{mode === 'annual' && datasets.some(canReport) && <span><i className="fit"/>Dashed: OLS fit</span>}</div></div>
    {series.some(item => !item.rows.length) && <p className="warning">One location has insufficient coverage for this display. No substitute values are drawn.</p>}
    <div className="chart-scroll" role="region" tabIndex="0" aria-label="Temperature visualization; scroll horizontally on small screens">
      <svg viewBox={`0 0 ${width} ${height}`} aria-labelledby="chart-title chart-desc" role="img">
        <title id="chart-title">{labels[mode]} for {datasets.map(data => names[data.locationId]).join(' and ')}</title>
        <desc id="chart-desc">Temperature in degrees Celsius against calendar year. Hover, focus or click annual points to inspect their values below. Missing years break the solid observation lines. Original OLS fits are dashed and appear only in annual mean mode.</desc>
        {Array.from({length: 5}, (_, index) => min + (max - min) * index / 4).map(value => <g key={value}><line className="grid" x1={left} x2={width-right} y1={y(value)} y2={y(value)}/><text x={left-12} y={y(value)+4} textAnchor="end">{value.toFixed(1)}</text></g>)}
        {mode === 'anomaly' && min <= 0 && max >= 0 && <line className="zero" x1={left} x2={width-right} y1={y(0)} y2={y(0)}/>}
        {[1991, 1995, 2000, 2005, 2010, 2015, 2020, 2024].map(value => <text key={value} x={x(value)} y={height-26} textAnchor="middle">{value}</text>)}
        <text x={10} y={15}>°C</text><text x={width-right} y={height-4} textAnchor="end">Year</text>
        <line className="inspect-line" x1={x(year)} x2={x(year)} y1={top} y2={height-bottom}/>
        {series.map(({data, rows}) => <g className={`series ${data.locationId}`} key={data.locationId}>
          {segments(rows).map((group, index) => <polyline className="observation-line" key={index} points={group.map(row => `${x(row.year)},${y(row.value)}`).join(' ')}/>)}
          {mode === 'annual' && canReport(data) && <line className="fit-line" x1={x(1991)} x2={x(2024)} y1={y(data.trend.intercept + data.trend.slopePerYear * 1991)} y2={y(data.trend.intercept + data.trend.slopePerYear * 2024)}/>}
          {rows.map(row => <circle className={`point ${row.year === year ? 'selected' : ''}`} key={row.year} cx={x(row.year)} cy={y(row.value)} r="4" tabIndex="0" role="button" aria-label={`${names[data.locationId]}, ${row.year}, ${format(row.value)} degrees Celsius. Inspect year.`} onMouseEnter={() => onYear(row.year)} onFocus={() => onYear(row.year)} onClick={() => onYear(row.year)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onYear(row.year); } }}><title>{names[data.locationId]} {row.year}: {format(row.value)} °C</title></circle>)}
        </g>)}
      </svg>
    </div>
    <div className="chart-readout" aria-label="Selected chart year"><strong>{year}</strong>{selected.map(({id, row}) => <span className={id} key={id}>{names[id]} <b>{row ? `${format(row.value)} °C` : 'No displayed value'}</b></span>)}</div>
    <p className="chart-footnote">Hover or focus a point to update the year inspector. On mobile, use the year selector below. {mode !== 'annual' && 'Descriptive transform only; OLS statistics above remain for raw annual means.'}</p>
  </section>;
}
