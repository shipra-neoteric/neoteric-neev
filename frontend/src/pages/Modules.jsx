import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import YouTubePlayer from '../components/YouTubePlayer';

const DEPT_NAME = { SUP: 'Supervision', QC: 'Quality', MEA: 'Measurement', STR: 'Store' };

export default function Modules() {
  const { session } = useAuth();
  const [modules, setModules] = useState(null);
  const [error, setError] = useState(null);
  const [playing, setPlaying] = useState(null);
  const [addingFor, setAddingFor] = useState(null);
  const [url, setUrl] = useState('');
  const [saving, setSaving] = useState(false);

  const canAdd = session.role === 'coordinator' || session.role === 'supervisor';
  const canApprove = session.role === 'supervisor';

  function reload() {
    api.get('/modules?with=videos').then(setModules).catch((e) => setError(e.message));
  }
  useEffect(reload, []);

  async function addVideo(moduleId) {
    if (!url) return;
    setSaving(true);
    setError(null);
    try {
      await api.post('/videos', { module_id: moduleId, url });
      setUrl('');
      setAddingFor(null);
      reload();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function approve(videoId) {
    try {
      await api.put(`/videos/${videoId}/approve`, {});
      reload();
    } catch (e) {
      setError(e.message);
    }
  }

  if (error) return <div className="alert crit"><span className="ai">!</span><div>{error}</div></div>;
  if (!modules) return <div className="sub">Loading…</div>;

  return (
    <div>
      {modules.map((m) => (
        <div key={m._id} className="mod" style={{ marginBottom: 8, padding: '11px 15px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
            <span className="mono" style={{ color: 'var(--ochre)', fontSize: '.8rem', fontWeight: 600 }}>{m.code}</span>
            <span style={{ flex: 1, fontWeight: 600, color: 'var(--ink)' }}>{m.title}</span>
            <span className={`dt d${m.department}`}>{DEPT_NAME[m.department]}</span>
            {canAdd && (
              <button className="btn ghost" style={{ fontSize: '.8rem', padding: '4px 9px' }}
                onClick={() => { setAddingFor(addingFor === m._id ? null : m._id); setUrl(''); }}>
                + Video
              </button>
            )}
          </div>

          {addingFor === m._id && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <input className="sel" style={{ flex: 1 }} placeholder="Paste a YouTube URL"
                value={url} onChange={(e) => setUrl(e.target.value)} />
              <button className="btn" onClick={() => addVideo(m._id)} disabled={saving}>
                {saving ? 'Adding…' : 'Add'}
              </button>
            </div>
          )}

          {m.videos.length > 0 && (
            <div className="vids">
              {m.videos.map((v) => (
                <div key={v._id} className="vid" onClick={() => setPlaying(v)}>
                  <div className="thumb"><div className="play" /></div>
                  <div className="vmeta">
                    <b>{v.title ?? v.youtubeId}</b>
                    <small>{v.channel}</small>
                    <div>
                      <span className={`vst ${v.status === 'linked' ? 'linked' : 'sugg'}`}>
                        {v.status === 'linked' ? 'LINKED' : 'SUGGESTED'}
                      </span>
                      {canApprove && v.status === 'suggested' && (
                        <button className="btn ghost" style={{ fontSize: '.72rem', padding: '2px 7px', marginLeft: 6 }}
                          onClick={(e) => { e.stopPropagation(); approve(v._id); }}>
                          Approve
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
      {playing && <YouTubePlayer video={playing} onClose={() => setPlaying(null)} />}
    </div>
  );
}
