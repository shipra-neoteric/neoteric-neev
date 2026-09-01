// SPEC.md §5: extract the video ID from a pasted URL, then use YouTube's public
// oEmbed endpoint for title/channel/thumbnail — no API key needed for that part.
// Duration needs the Data API v3, which does need a key (YOUTUBE_API_KEY) — optional;
// duration just stays null without one.

export function extractYoutubeId(url) {
  try {
    const u = new URL(url);
    if (u.hostname === 'youtu.be') return u.pathname.slice(1) || null;
    if (u.hostname.includes('youtube.com')) {
      if (u.pathname === '/watch') return u.searchParams.get('v');
      if (u.pathname.startsWith('/shorts/')) return u.pathname.split('/')[2] ?? null;
      if (u.pathname.startsWith('/embed/')) return u.pathname.split('/')[2] ?? null;
    }
  } catch {
    return null;
  }
  return null;
}

export async function fetchOEmbed(youtubeId) {
  try {
    const url = `https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${youtubeId}`)}&format=json`;
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function parseIsoDuration(iso) {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return null;
  const [, h, mi, s] = m;
  return Number(h || 0) * 3600 + Number(mi || 0) * 60 + Number(s || 0);
}

export async function fetchDuration(youtubeId) {
  if (!process.env.YOUTUBE_API_KEY) return null;
  try {
    const url = `https://www.googleapis.com/youtube/v3/videos?id=${youtubeId}&part=contentDetails&key=${process.env.YOUTUBE_API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const iso = data.items?.[0]?.contentDetails?.duration;
    return iso ? parseIsoDuration(iso) : null;
  } catch {
    return null;
  }
}
