import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import YouTubePlayer from '../../components/YouTubePlayer';

const DEPT_NAME = { SUP: 'Supervision', QC: 'Quality', MEA: 'Measurement', STR: 'Store' };

export default function Today() {
  const [modules, setModules] = useState(null);
  const [error, setError] = useState(null);
  const [playing, setPlaying] = useState(null);
  const [openModule, setOpenModule] = useState(null);

  useEffect(() => {
    api.get('/modules?with=videos').then(setModules).catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="alert crit"><span className="ai">!</span><div>{error}</div></div>;
  if (!modules) return <div className="sub">Loading…</div>;

  return (
    <div>
      <div className="sub" style={{ marginBottom: 12 }}>
        Videos are pre-reading, not a substitute for the module. They need a connection —
        prefer site wifi in the training room over your own data.
      </div>
      {modules.map((m) => (
        <div key={m._id} className="mod" style={{ marginBottom: 8 }}>
          <button className="modh" onClick={() => setOpenModule(openModule === m._id ? null : m._id)}
            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 15px', width: '100%', background: 'none', border: 0, textAlign: 'left', cursor: 'pointer' }}>
            <span className="mono" style={{ color: 'var(--ochre)', fontSize: '.8rem', fontWeight: 600 }}>{m.code}</span>
            <span style={{ flex: 1, fontWeight: 600, color: 'var(--ink)' }}>{m.title}</span>
            <span className={`dt d${m.department}`}>{DEPT_NAME[m.department]}</span>
          </button>
          {openModule === m._id && (
            <div style={{ padding: '0 15px 16px' }}>
              {m.videos.length === 0
                ? <div className="sub">No videos linked yet.</div>
                : (
                  <div className="vids">
                    {m.videos.filter((v) => v.status === 'linked').map((v) => (
                      <div key={v._id} className="vid" onClick={() => setPlaying(v)}>
                        <div className="thumb"><div className="play" /></div>
                        <div className="vmeta">
                          <b>{v.title ?? v.youtubeId}</b>
                          <small>{v.channel}</small>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
            </div>
          )}
        </div>
      ))}
      {playing && <YouTubePlayer video={playing} onClose={() => setPlaying(null)} />}
    </div>
  );
}
