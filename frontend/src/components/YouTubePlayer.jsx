import { X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../api/client';

let apiPromise = null;
function loadYouTubeApi() {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (apiPromise) return apiPromise;
  apiPromise = new Promise((resolve) => {
    window.onYouTubeIframeAPIReady = () => resolve(window.YT);
    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(script);
  });
  return apiPromise;
}

// SPEC.md §5/§6: bind onStateChange, post progress every 15s and on pause; default
// to 480p since trainees are paying for their own data.
export default function YouTubePlayer({ video, onClose }) {
  const containerRef = useRef(null);
  const playerRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    function postProgress() {
      const p = playerRef.current;
      if (!p?.getCurrentTime) return;
      const seconds = Math.floor(p.getCurrentTime());
      api.post(`/videos/${video._id}/progress`, { seconds }).catch(() => {});
    }

    loadYouTubeApi().then((YT) => {
      if (cancelled || !containerRef.current) return;
      playerRef.current = new YT.Player(containerRef.current, {
        videoId: video.youtubeId,
        playerVars: { vq: 'small' },
        events: {
          onReady: (e) => { try { e.target.setPlaybackQuality('small'); } catch { /* not all clients honor this */ } },
          onStateChange: (e) => {
            if (e.data === YT.PlayerState.PLAYING) {
              intervalRef.current = setInterval(postProgress, 15000);
            } else {
              clearInterval(intervalRef.current);
              if (e.data === YT.PlayerState.PAUSED || e.data === YT.PlayerState.ENDED) postProgress();
            }
          },
        },
      });
    });

    return () => {
      cancelled = true;
      clearInterval(intervalRef.current);
      playerRef.current?.destroy?.();
    };
  }, [video._id, video.youtubeId]);

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm animate-fade-in" />
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-200 dark:border-gray-700">
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white truncate">{video.title ?? video.youtubeId}</h2>
            <div className="text-xs text-gray-400 mt-0.5">{video.channel}</div>
          </div>
          <button onClick={onClose} aria-label="Close"
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex-shrink-0 ml-3">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4">
          <div ref={containerRef} className="aspect-video w-full" />
        </div>
      </div>
    </div>,
    document.body,
  );
}
