import { useEffect, useState } from 'react';
import { api } from '../../api/client';

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function MyChecklist() {
  const [items, setItems] = useState(null);
  const [error, setError] = useState(null);
  const [uploadingIndex, setUploadingIndex] = useState(null);

  function reload() {
    api.get('/checklist/me').then(setItems).catch((e) => setError(e.message));
  }
  useEffect(reload, []);

  async function handleFile(index, file) {
    if (!file) return;
    setUploadingIndex(index);
    setError(null);
    try {
      const dataUrl = await fileToDataUrl(file);
      await api.post(`/checklist/${index}/evidence`, { dataUrl });
      reload();
    } catch (e) {
      setError(e.message);
    } finally {
      setUploadingIndex(null);
    }
  }

  if (error) return <div className="alert crit"><span className="ai">!</span><div>{error}</div></div>;
  if (!items) return <div className="sub">Loading…</div>;

  const done = items.filter((i) => i.done).length;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <div className="prog" style={{ flex: 1 }}><i style={{ width: `${(done / items.length) * 100}%` }} /></div>
        <span className="mono sub" style={{ margin: 0 }}>{done}/{items.length}</span>
      </div>
      <div className="sub" style={{ marginBottom: 14 }}>
        Add a photo before your buddy or coordinator can sign an item off.
      </div>

      {items.map((item) => (
        <div key={item.index} className="card" style={{ marginBottom: 8 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <span className="mono" style={{ color: item.done ? 'var(--bandA)' : 'var(--rule)' }}>{item.done ? '✓' : '○'}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '.89rem', color: item.done ? 'var(--ink-2)' : 'var(--ink)' }}>{item.text}</div>
              {item.evidenceUrl && (
                <img src={item.evidenceUrl} alt="" style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 4, marginTop: 6 }} />
              )}
              {item.done && <div className="sub" style={{ marginTop: 4 }}>Signed by {item.signedBy}</div>}
            </div>
            {!item.done && (
              <label className="btn ghost" style={{ cursor: 'pointer', fontSize: '.8rem', padding: '5px 10px' }}>
                {uploadingIndex === item.index ? '…' : (item.evidenceUrl ? 'Retake' : 'Add photo')}
                <input type="file" accept="image/*" capture="environment" style={{ display: 'none' }}
                  onChange={(e) => handleFile(item.index, e.target.files?.[0])} />
              </label>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
