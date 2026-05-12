// @ts-nocheck
import React from 'react';

export function useTweaks(defaults){
  const [state, setState] = React.useState(() => ({...defaults}));
  function setTweak(k, v){ setState(s => ({...s, [k]: v})); }
  return [state, setTweak];
}

export function TweaksPanel({ children, title }){
  return (
    <div className="tweaks">
      <h4>{title}</h4>
      {children}
    </div>
  );
}

export const TweakSection = ({ label, children }) => <section className="tweak-section"><h5>{label}</h5>{children}</section>;
export const TweakRadio = ({ label, value, options, onChange }) => (
  <div className="tweak-radio">
    {options.map(o => <label key={o.value}><input type="radio" checked={value===o.value} onChange={() => onChange(o.value)}/> {o.label}</label>)}
  </div>
);
export const TweakSelect = ({ label, value, options, onChange }) => (
  <select value={value} onChange={e=>onChange(e.target.value)}>
    {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
  </select>
);
export const TweakColor = ({ label, value, options, onChange }) => (
  <div className="tweak-color">{options.map(o => <button key={o} onClick={() => onChange(o)}>{o}</button>)}</div>
);
