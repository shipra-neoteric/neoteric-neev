import { useEffect, useRef } from 'react';
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

  return (
    <div className="scrim on" onClick={onClose}>
      <div className="modal on" onClick={(e) => e.stopPropagation()}>
        <div className="dhead">
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: '1rem' }}>{video.title ?? video.youtubeId}</h2>
            <div className="sub" style={{ margin: '2px 0 0' }}>{video.channel}</div>
          </div>
          <button className="x" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div style={{ padding: 15 }}>
          <div ref={containerRef} style={{ aspectRatio: '16/9', width: '100%' }} />
        </div>
      </div>
    </div>
  );
}
