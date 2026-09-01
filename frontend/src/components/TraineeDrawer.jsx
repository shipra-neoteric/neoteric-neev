import { useEffect, useState } from 'react';
import { api } from '../api/client';
import BandChip from './BandChip';

const PODS = [1, 2, 3, 4];
const STATUSES = ['active', 'exited', 'gateway_passed', 'confirmed'];

const emptyForm = { name: '', phone: '', email: '', branch: '', pod: 1, baseline: '', status: 'active' };

export default function TraineeDrawer({ code, onClose, onSaved }) {
  const isCreate = !code;
  const [detail, setDetail] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isCreate) {
      setForm(emptyForm);
      setDetail(null);
      return;
    }
    api.get(`/trainees/${code}`).then((d) => {
      setDetail(d);
      setForm({
        name: d.name, phone: d.phone ?? '', email: d.email ?? '',
        branch: d.branch ?? '', pod: d.pod, baseline: d.baseline ?? '', status: d.status,
      });
    }).catch((e) => setError(e.message));
  }, [code]);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const body = {
        name: form.name,
        phone: form.phone || null,
        email: form.email || null,
        branch: form.branch,
        pod: Number(form.pod),
        baseline: form.baseline === '' ? null : Number(form.baseline),
      };
      if (isCreate) {
        await api.post('/trainees', body);
      } else {
        await api.put(`/trainees/${code}`, { ...body, status: form.status });
      }
      onSaved();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  const baselineLocked = !isCreate && detail?.baseline != null;

  return (
    <>
      <div className="scrim on" onClick={onClose} />
      <aside className="drawer on" role="dialog" aria-label="Trainee">
        <div className="dhead">
          <div style={{ flex: 1 }}>
            <h2>{isCreate ? 'Add trainee' : (detail?.name ?? code)}</h2>
            {!isCreate && detail && (
              <div className="sub" style={{ margin: '2px 0 0' }}>{code} · Pod {detail.pod} · {detail.branch}</div>
            )}
          </div>
          <button className="x" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div style={{ padding: '18px 20px' }}>
          {error && <div className="alert crit" style={{ marginBottom: 14 }}><span className="ai">!</span><div>{error}</div></div>}

          {!isCreate && detail && (
            <>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
                <BandChip band={detail.band} />
                <span className="sub" style={{ margin: 0 }}>Site buddy: {detail.buddy ?? '—'}</span>
              </div>
              <div className="grid g2" style={{ marginBottom: 16 }}>
                <div className="card">
                  <div className="lbl">Checkpoint</div>
                  <div className="big">{detail.checkpoint ?? '—'}</div>
                  <div className="sub">
                    {detail.checkpoint != null
                      ? `Written ${detail.written} + Practical ${detail.practical} + Behavioural ${detail.behavioural}`
                      : 'Not yet assessed'}
                  </div>
                </div>
                <div className="card">
                  <div className="lbl">Velocity</div>
                  <div className="big">{detail.velocity ?? '—'}</div>
                  <div className="sub">{detail.baseline} → {detail.checkpoint ?? '?'} out of 100</div>
                </div>
              </div>
            </>
          )}

          <div className="card" style={{ marginBottom: 16 }}>
            <h3>{isCreate ? 'New trainee' : 'Edit'}</h3>
            <div className="lbl" style={{ marginTop: 8 }}>Name</div>
            <input className="sel" style={{ width: '100%' }} value={form.name} onChange={(e) => set('name', e.target.value)} />

            <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
              <div style={{ flex: 1 }}>
                <div className="lbl">Phone</div>
                <input className="sel" style={{ width: '100%' }} value={form.phone} onChange={(e) => set('phone', e.target.value)} />
              </div>
              <div style={{ flex: 1 }}>
                <div className="lbl">Email</div>
                <input className="sel" style={{ width: '100%' }} value={form.email} onChange={(e) => set('email', e.target.value)} />
              </div>
            </div>

            <div className="lbl" style={{ marginTop: 10 }}>Branch / college</div>
            <input className="sel" style={{ width: '100%' }} value={form.branch} onChange={(e) => set('branch', e.target.value)} />

            <div style={{ display: 'flex', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
              <div>
                <div className="lbl">Pod</div>
                <select className="sel" value={form.pod} onChange={(e) => set('pod', e.target.value)}>
                  {PODS.map((p) => <option key={p} value={p}>Pod {p}</option>)}
                </select>
              </div>
              <div>
                <div className="lbl">Baseline (D01)</div>
                <input className="sel" type="number" min={0} max={100} style={{ width: 80 }}
                  value={form.baseline} disabled={baselineLocked}
                  onChange={(e) => set('baseline', e.target.value)} />
                {baselineLocked && <div className="sub" style={{ margin: '4px 0 0' }}>Locked once set</div>}
              </div>
              {!isCreate && (
                <div>
                  <div className="lbl">Status</div>
                  <select className="sel" value={form.status} onChange={(e) => set('status', e.target.value)}>
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              )}
            </div>

            <button className="btn" style={{ marginTop: 16 }} onClick={save} disabled={saving || !form.name}>
              {saving ? 'Saving…' : isCreate ? 'Add trainee' : 'Save changes'}
            </button>
          </div>

          {!isCreate && detail?.history && (
            <div className="card">
              <h3>Daily record</h3>
              <div className="tw" style={{ maxHeight: 260, overflowY: 'auto' }}>
                <table>
                  <thead><tr><th>Day</th><th>Attendance</th><th>Log score</th><th>Note</th></tr></thead>
                  <tbody>
                    {detail.history.map((h) => (
                      <tr key={h.code}>
                        <td>{h.code} · {h.label}</td>
                        <td className="n">{h.attendance ?? '—'}</td>
                        <td className="n">{h.log_score ?? '—'}</td>
                        <td className="sub" style={{ margin: 0 }}>{h.log_note || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
