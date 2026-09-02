import { Play, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import AlertBanner from '../components/AlertBanner';
import { DeptBadge, VIDEO_STATUS_BADGE } from '../components/StatusBadge';
import { useTheme } from '../context/ThemeContext';
import { btn, btnPrimaryBase, inputClass, primaryStyle } from '../ui/classes';
import YouTubePlayer from '../components/YouTubePlayer';

export default function Modules() {
  const { session } = useAuth();
  const { getThemeColor } = useTheme();
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

  if (error) return <AlertBanner level="crit">{error}</AlertBanner>;
  if (!modules) return <div className="text-sm text-gray-400">Loading…</div>;

  return (
    <div className="space-y-3">
      {modules.map((m) => (
        <div key={m._id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3.5">
          <div className="flex items-center gap-3 mb-2.5">
            <span className="font-mono text-xs font-semibold text-orange-600 dark:text-orange-400">{m.code}</span>
            <span className="flex-1 font-semibold text-gray-900 dark:text-white">{m.title}</span>
            <DeptBadge department={m.department} />
            {canAdd && (
              <button onClick={() => { setAddingFor(addingFor === m._id ? null : m._id); setUrl(''); }}
                className={`${btn.secondary} flex items-center gap-1 !px-2.5 !py-1 text-xs`}>
                <Plus className="w-3 h-3" /> Video
              </button>
            )}
          </div>

          {addingFor === m._id && (
            <div className="flex gap-2 mb-3">
              <input className={inputClass()} placeholder="Paste a YouTube URL"
                value={url} onChange={(e) => setUrl(e.target.value)} />
              <button onClick={() => addVideo(m._id)} disabled={saving} className={btnPrimaryBase} style={primaryStyle(getThemeColor())}>
                {saving ? 'Adding…' : 'Add'}
              </button>
            </div>
          )}

          {m.videos.length > 0 && (
            <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
              {m.videos.map((v) => (
                <div key={v._id} onClick={() => setPlaying(v)}
                  className="bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden cursor-pointer hover:border-orange-300 dark:hover:border-orange-700 transition-colors">
                  <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center">
                    <div className="w-9 h-9 rounded-full bg-red-600 flex items-center justify-center">
                      <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                    </div>
                  </div>
                  <div className="p-2.5">
                    <div className="text-sm font-semibold text-gray-900 dark:text-white leading-tight line-clamp-2">{v.title ?? v.youtubeId}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{v.channel}</div>
                    <div className="mt-1.5 flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${VIDEO_STATUS_BADGE[v.status]}`}>
                        {v.status}
                      </span>
                      {canApprove && v.status === 'suggested' && (
                        <button onClick={(e) => { e.stopPropagation(); approve(v._id); }}
                          className={`${btn.secondary} !px-2 !py-0.5 text-[11px]`}>
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
