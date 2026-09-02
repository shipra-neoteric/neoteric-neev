import { FileText, Play, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import AlertBanner from '../components/AlertBanner';
import { DeptBadge, VIDEO_STATUS_BADGE } from '../components/StatusBadge';
import YouTubePlayer from '../components/YouTubePlayer';
import { useTheme } from '../context/ThemeContext';
import { btn, btnPrimaryBase, inputClass, insetPanel, primaryStyle } from '../ui/classes';
import { confirmDelete } from '../ui/confirm';

export default function Modules() {
  const { can } = useAuth();
  const { getThemeColor } = useTheme();
  const [modules, setModules] = useState(null);
  const [error, setError] = useState(null);
  const [playing, setPlaying] = useState(null);
  const [addingVideoFor, setAddingVideoFor] = useState(null);
  const [addingNoteFor, setAddingNoteFor] = useState(null);
  const [url, setUrl] = useState('');
  const [noteForm, setNoteForm] = useState({ title: '', body: '' });
  const [saving, setSaving] = useState(false);

  const canAddContent = can('content', 'create');
  const canApprove = can('content', 'approve');
  const canDelete = can('content', 'delete');
  const canEdit = can('content', 'edit');

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
      setAddingVideoFor(null);
      reload();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function addNote(moduleId) {
    if (!noteForm.title || !noteForm.body) return;
    setSaving(true);
    setError(null);
    try {
      await api.post(`/modules/${moduleId}/notes`, noteForm);
      setNoteForm({ title: '', body: '' });
      setAddingNoteFor(null);
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

  async function deleteVideo(v) {
    if (!(await confirmDelete(v.title ?? v.youtubeId))) return;
    try {
      await api.delete(`/videos/${v._id}`);
      reload();
    } catch (e) {
      setError(e.message);
    }
  }

  async function deleteNote(n) {
    if (!(await confirmDelete(n.title))) return;
    try {
      await api.delete(`/modules/notes/${n._id}`);
      reload();
    } catch (e) {
      setError(e.message);
    }
  }

  async function setReleaseDate(moduleId, value) {
    try {
      await api.put(`/modules/${moduleId}`, { releaseDate: value || null });
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
          <div className="flex items-center gap-3 mb-2.5 flex-wrap">
            <span className="font-mono text-xs font-semibold text-orange-600 dark:text-orange-400">{m.code}</span>
            <span className="flex-1 font-semibold text-gray-900 dark:text-white min-w-[140px]">{m.title}</span>
            <DeptBadge department={m.department} />
            {canEdit && (
              <input type="date" title="Release date — trainees can't see this module before this date"
                className={`${inputClass()} !w-auto text-xs !py-1`}
                value={m.releaseDate ? m.releaseDate.slice(0, 10) : ''}
                onChange={(e) => setReleaseDate(m._id, e.target.value)} />
            )}
            {canAddContent && (
              <button onClick={() => { setAddingVideoFor(addingVideoFor === m._id ? null : m._id); setUrl(''); }}
                className={`${btn.secondary} flex items-center gap-1 !px-2.5 !py-1 text-xs`}>
                <Plus className="w-3 h-3" /> Video
              </button>
            )}
            {canAddContent && (
              <button onClick={() => { setAddingNoteFor(addingNoteFor === m._id ? null : m._id); setNoteForm({ title: '', body: '' }); }}
                className={`${btn.secondary} flex items-center gap-1 !px-2.5 !py-1 text-xs`}>
                <Plus className="w-3 h-3" /> Note
              </button>
            )}
          </div>

          {addingVideoFor === m._id && (
            <div className="flex gap-2 mb-3">
              <input className={inputClass()} placeholder="Paste a YouTube URL"
                value={url} onChange={(e) => setUrl(e.target.value)} />
              <button onClick={() => addVideo(m._id)} disabled={saving} className={btnPrimaryBase} style={primaryStyle(getThemeColor())}>
                {saving ? 'Adding…' : 'Add'}
              </button>
            </div>
          )}

          {addingNoteFor === m._id && (
            <div className={`${insetPanel} mb-3 space-y-2`}>
              <input className={inputClass()} placeholder="Note title"
                value={noteForm.title} onChange={(e) => setNoteForm((f) => ({ ...f, title: e.target.value }))} />
              <textarea rows={3} className={inputClass() + ' resize-y'} placeholder="Note content"
                value={noteForm.body} onChange={(e) => setNoteForm((f) => ({ ...f, body: e.target.value }))} />
              <button onClick={() => addNote(m._id)} disabled={saving} className={btnPrimaryBase} style={primaryStyle(getThemeColor())}>
                {saving ? 'Adding…' : 'Add note'}
              </button>
            </div>
          )}

          {m.notes?.length > 0 && (
            <div className="space-y-2 mb-3">
              {m.notes.map((n) => (
                <div key={n._id} className={`${insetPanel} flex items-start gap-2.5`}>
                  <FileText className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">{n.title}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 whitespace-pre-wrap">{n.body}</div>
                  </div>
                  {canDelete && (
                    <button onClick={() => deleteNote(n)} className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex-shrink-0">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {m.videos.length > 0 && (
            <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
              {m.videos.map((v) => (
                <div key={v._id} className="bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:border-orange-300 dark:hover:border-orange-700 transition-colors">
                  <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center cursor-pointer" onClick={() => setPlaying(v)}>
                    <div className="w-9 h-9 rounded-full bg-red-600 flex items-center justify-center">
                      <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                    </div>
                  </div>
                  <div className="p-2.5">
                    <div className="text-sm font-semibold text-gray-900 dark:text-white leading-tight line-clamp-2">{v.title ?? v.youtubeId}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{v.channel}</div>
                    <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${VIDEO_STATUS_BADGE[v.status]}`}>
                        {v.status}
                      </span>
                      {canApprove && v.status === 'suggested' && (
                        <button onClick={() => approve(v._id)} className={`${btn.secondary} !px-2 !py-0.5 text-[11px]`}>
                          Approve
                        </button>
                      )}
                      {canDelete && (
                        <button onClick={() => deleteVideo(v)} className="ml-auto w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                          <Trash2 className="w-3.5 h-3.5" />
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
