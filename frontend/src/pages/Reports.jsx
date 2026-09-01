import { useState } from 'react';

const BATCH_ID = 'b1';

export default function Reports() {
  const [month, setMonth] = useState('2026-09');

  return (
    <div className="card" style={{ maxWidth: 420 }}>
      <h3>Monthly pack</h3>
      <div className="sub" style={{ marginBottom: 14 }}>
        Band distribution, needs-attention alerts, and the full trainee table — one PDF
        for the Saturday review with the CEO (SPEC.md §7 v1).
      </div>
      <div className="lbl">Month</div>
      <input className="sel" type="month" value={month}
        onChange={(e) => setMonth(e.target.value)}
        style={{ marginBottom: 14, display: 'block' }} />
      <a className="btn" style={{ display: 'inline-block', textDecoration: 'none' }}
        href={`/api/batches/${BATCH_ID}/report?month=${month}`}>
        Download PDF
      </a>
    </div>
  );
}
