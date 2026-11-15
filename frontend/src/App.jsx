import React, {useEffect, useState} from 'react';
import {validateDataset} from './data.js';
import {buildCsv} from './climate.js';
import {ClimateChart} from './components/ClimateChart.jsx';
import {Metrics, Methods, YearInspector} from './components/Details.jsx';
import './style.css';

const names = {hanoi: 'Hanoi', 'can-tho': 'Can Tho'};

export default function App() {
  const [state, setState] = useState({status: 'loading'});
  const [attempt, setAttempt] = useState(0);
  const [site, setSite] = useState('hanoi');
  const [compare, setCompare] = useState(false);
  const [mode, setMode] = useState('annual');
  const [year, setYear] = useState(2024);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    setState({status: 'loading'});
    Promise.all(Object.keys(names).map(async id => {
      const response = await fetch(`${import.meta.env.BASE_URL}data/${id}.json`, {signal: controller.signal});
      if (!response.ok) throw new Error(`${names[id]} dataset ${response.status === 404 ? 'file is missing' : `request failed (HTTP ${response.status})`}.`);
      let data;
      try { data = await response.json(); } catch { throw new Error(`${names[id]} dataset is not valid JSON.`); }
      return validateDataset(data, id);
    })).then(data => { if (active) setState({status: 'ready', data}); })
      .catch(error => { if (active && error.name !== 'AbortError') setState({status: 'error', message: error.message}); });
    return () => { active = false; controller.abort(); };
  }, [attempt]);

  const datasets = state.status === 'ready' ? state.data.filter(data => compare || data.locationId === site) : [];
  function download() {
    const url = URL.createObjectURL(new Blob([buildCsv(datasets)], {type: 'text/csv;charset=utf-8'}));
    const link = document.createElement('a');
    link.href = url;
    link.download = `trendearth-${compare ? 'comparison' : site}-1991-2024.csv`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return <>
    <a className="skip" href="#explorer">Skip to climate explorer</a>
    <header><a className="brand" href="#">TrendEarth <span>AI</span></a><span className="event">NASA SPACE APPS 2026 <b>CLIMATE EXPLORER</b></span></header>
    <main id="explorer">
      <section className="intro"><div><p className="eyebrow">NASA POWER / MERRA-2 · VIETNAM</p><h1>Two places. <em>A clearer climate story.</em></h1><p>Explore the annual record, compare locations, and inspect descriptive changes with transparent methods.</p></div><span className="period">1991—2024<small>34 annual observations per complete series</small></span></section>
      <section className="toolbar panel" aria-label="Climate explorer controls">
        <div><label htmlFor="view">Explore</label><select id="view" value={compare ? 'compare' : 'single'} onChange={event => setCompare(event.target.value === 'compare')}><option value="single">Single location</option><option value="compare">Compare Hanoi vs Can Tho</option></select></div>
        {!compare && <div><label htmlFor="location">Location</label><select id="location" value={site} onChange={event => setSite(event.target.value)}><option value="hanoi">Hanoi</option><option value="can-tho">Can Tho</option></select></div>}
        <div><label htmlFor="display">Chart display</label><select id="display" value={mode} onChange={event => setMode(event.target.value)}><option value="annual">Annual mean (°C)</option><option value="anomaly">Temperature anomaly (°C)</option><option value="moving">Trailing 5-year mean (°C)</option></select></div>
        <div className="dataset-label"><span>FIXED VARIABLE</span><strong>Air temperature at 2 m</strong><small>T2M · NASA model point estimates</small></div>
        <button className="download" onClick={download} disabled={!datasets.length}>↓ Download CSV</button>
      </section>
      <p className="sr-only" aria-live="polite">{state.status === 'loading' ? 'Loading NASA datasets' : state.status === 'ready' ? `${compare ? 'Comparing Hanoi and Can Tho' : names[site]}. ${mode} display selected.` : state.message}</p>
      {state.status === 'loading' && <div className="panel state" role="status">Loading and validating the NASA datasets…</div>}
      {state.status === 'error' && <div className="panel state" role="alert"><h2>Data unavailable</h2><p>{state.message}</p><p>No substitute measurements are displayed.</p><button onClick={() => setAttempt(value => value + 1)}>Try again</button></div>}
      {datasets.length > 0 && <>
        <Metrics datasets={datasets}/>
        <ClimateChart datasets={datasets} mode={mode} year={year} onYear={setYear}/>
        <YearInspector datasets={datasets} mode={mode} year={year} onYear={setYear}/>
        <Methods datasets={datasets} mode={mode}/>
      </>}
      <footer><span>TrendEarth AI · Evidence before inference.</span><a href="https://power.larc.nasa.gov/" target="_blank" rel="noreferrer">NASA POWER data source ↗</a></footer>
    </main>
  </>;
}
