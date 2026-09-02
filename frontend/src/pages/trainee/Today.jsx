import { ChevronRight, Play } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import AlertBanner from '../../components/AlertBanner';
import { DeptBadge } from '../../components/StatusBadge';
import YouTubePlayer from '../../components/YouTubePlayer';

export default function Today() {
  const [modules, setModules] = useState(null);
  const [error, setError] = useState(null);
  const [playing, setPlaying] = useState(null);
  const [openModule, setOpenModule] = useState(null);

  useEffect(() => {
    api.get('/modules?with=videos').then(setModules).catch((e) => setError(e.message));
  }, []);

  if (error) return <AlertBanner level="crit">{error}</AlertBanner>;
  if (!modules) return <div className="text-sm text-gray-400">Loading…</div>;

  return (
    <div>
      <div className="mb-3">
        <AlertBanner level="info">
          Videos are pre-reading, not a substitute for the module. They need a connection —
          prefer site wifi in the training room over your own data.
        </AlertBanner>
      </div>
      <div className="space-y-2">
        {modules.map((m) => {
          const open = openModule === m._id;
          return (
            <div key={m._id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <button onClick={() => setOpenModule(open ? null : m._id)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <ChevronRight className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${open ? 'rotate-90' : ''}`} />
                <span className="font-mono text-xs font-semibold text-orange-600 dark:text-orange-400">{m.code}</span>
                <span className="flex-1 font-semibold text-gray-900 dark:text-white">{m.title}</span>
                <DeptBadge department={m.department} />
              </button>
              {open && (
                <div className="px-4 pb-4">
                  {m.videos.filter((v) => v.status === 'linked').length === 0
                    ? <div className="text-sm text-gray-400">No videos linked yet.</div>
                    : (
                      <div className="grid grid-cols-2 gap-3">
                        {m.videos.filter((v) => v.status === 'linked').map((v) => (
                          <div key={v._id} onClick={() => setPlaying(v)}
                            className="bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden cursor-pointer">
                            <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center">
                              <div className="w-9 h-9 rounded-full bg-red-600 flex items-center justify-center">
                                <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                              </div>
                            </div>
                            <div className="p-2">
                              <div className="text-xs font-semibold text-gray-900 dark:text-white line-clamp-2">{v.title ?? v.youtubeId}</div>
                              <div className="text-[11px] text-gray-400">{v.channel}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {playing && <YouTubePlayer video={playing} onClose={() => setPlaying(null)} />}
    </div>
  );
}
