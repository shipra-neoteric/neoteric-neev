import { useState } from 'react';
import { downloadFile } from '../api/client';

const BATCH_ID = 'b1';

export default function Reports() {
  const [month, setMonth] = useState('2026-09');
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState(null);

  async function handleDownload() {
    setDownloading(true);
    setError(null);
    try {
      const { blob, filename } = await downloadFile(`/batches/${BATCH_ID}/report?month=${month}`);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e.message);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="card" style={{ maxWidth: 420 }}>
      <h3>Monthly pack</h3>
      <div className="sub" style={{ marginBottom: 14 }}>
        Band distribution, needs-attention alerts, and the full trainee table — one PDF
        for the Saturday review with the CEO (SPEC.md §7 v1).
      </div>
      {error && <div className="alert crit" style={{ marginBottom: 12 }}><span className="ai">!</span><div>{error}</div></div>}
      <div className="lbl">Month</div>
      <input className="sel" type="month" value={month}
        onChange={(e) => setMonth(e.target.value)}
        style={{ marginBottom: 14, display: 'block' }} />
      <button className="btn" onClick={handleDownload} disabled={downloading}>
        {downloading ? 'Preparing…' : 'Download PDF'}
      </button>
    </div>
  );
}
