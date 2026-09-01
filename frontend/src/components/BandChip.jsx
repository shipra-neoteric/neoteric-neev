const BAND_NAME = { A: 'Fast', B: 'On track', C: 'Developing', D: 'At risk' };

export default function BandChip({ band }) {
  if (!band) {
    return <span className="band" style={{ color: 'var(--ink-3)' }}>— pending checkpoint</span>;
  }
  return (
    <span className={`band b${band}`}>
      <span className="dot" />{band} · {BAND_NAME[band]}
    </span>
  );
}
