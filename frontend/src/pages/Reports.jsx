import { useState } from 'react';
import { downloadFile } from '../api/client';
import AlertBanner from '../components/AlertBanner';
import { useTheme } from '../context/ThemeContext';
import { btnPrimaryBase, card, inputClass, label as labelClass, primaryStyle } from '../ui/classes';

const BATCH_ID = 'b1';

export default function Reports() {
  const { getThemeColor } = useTheme();
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
    <div className={card + ' max-w-md'}>
      <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">Monthly pack</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Band distribution, needs-attention alerts, and the full trainee table — one PDF
        for the Saturday review with the CEO (SPEC.md §7 v1).
      </p>
      {error && <div className="mb-3"><AlertBanner level="crit">{error}</AlertBanner></div>}
      <label className={labelClass}>Month</label>
      <input className={inputClass()} style={{ marginBottom: 16 }} type="month" value={month}
        onChange={(e) => setMonth(e.target.value)} />
      <button onClick={handleDownload} disabled={downloading} className={btnPrimaryBase} style={primaryStyle(getThemeColor())}>
        {downloading ? 'Preparing…' : 'Download PDF'}
      </button>
    </div>
  );
}
