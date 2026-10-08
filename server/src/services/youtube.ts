import { Innertube, UniversalCache } from 'youtubei.js';

export interface ExtractedVideo {
  videoId: string;
  title: string;
  author: string;
  durationSec: number;
  thumbnail: string;
  position: number;
}

export interface PlaylistMeta {
  id: string;
  title: string;
  author: string;
  thumbnail: string;
  videoCount: number;
}

function extractPlaylistId(urlOrId: string): string {
  const match = urlOrId.match(/[?&]list=([^&]+)/);
  if (match) return match[1];
  if (/^[A-Za-z0-9_-]+$/.test(urlOrId)) return urlOrId;
  throw new Error('プレイリストURLまたはIDを認識できませんでした');
}

const RATE_LIMIT_MS = 300;

// 'm:ss' / 'h:mm:ss' 形式のテキストを秒に変換
function parseDurationText(text: unknown): number {
  if (typeof text !== 'string') return 0;
  const parts = text.trim().split(':').map(Number);
  if (parts.length === 0 || parts.some(Number.isNaN)) return 0;
  return parts.reduce((acc, p) => acc * 60 + p, 0);
}

export async function fetchPlaylist(
  urlOrId: string
): Promise<{ meta: PlaylistMeta; videos: ExtractedVideo[] }> {
  const playlistId = extractPlaylistId(urlOrId);

  const yt = await Innertube.create({
    cache: new UniversalCache(true),
    generate_session_locally: true,
  });

  const playlist = await yt.getPlaylist(playlistId);

  const playlistMeta = playlist as unknown as {
    id: string;
    info: {
      title: string;
      author?: { name: string };
      thumbnails?: { url: string }[];
      thumbnail?: string;
      total_items?: number | string;
    };
    items: unknown[];
    has_continuation: boolean;
    getContinuation: () => Promise<typeof playlist>;
  };

  const meta: PlaylistMeta = {
    id: playlistId,
    title: playlistMeta.info.title || 'Untitled Playlist',
    author: playlistMeta.info.author?.name || 'Unknown',
    thumbnail:
      playlistMeta.info.thumbnails?.[0]?.url || playlistMeta.info.thumbnail || '',
    videoCount:
      parseInt(String(playlistMeta.info.total_items ?? '').replace(/[^\d]/g, ''), 10) || 0,
  };

  const videos: ExtractedVideo[] = [];

  const collectVideos = (page: typeof playlist) => {
    const pageData = page as unknown as { items?: unknown[] };
    for (const item of pageData.items ?? []) {
      const v = item as Record<string, unknown>;
      if (v.type === 'PlaylistVideo') {
        videos.push({
          videoId: String(v.video_id || v.id || ''),
          title: typeof v.title === 'object' ? String((v.title as { text: string }).text) : String(v.title || ''),
          author: typeof v.author === 'object'
            ? String(((v.author as { name?: string })?.name) || '')
            : String(v.author || ''),
          durationSec: Number(v.length_seconds) || Number((v.duration as { seconds?: number })?.seconds) || 0,
          thumbnail: Array.isArray(v.thumbnails) && v.thumbnails.length > 0
            ? String((v.thumbnails as { url: string }[])[v.thumbnails.length - 1].url)
            : '',
          position: Number((v as { index?: { text?: string } }).index?.text) || 0,
        });
      } else if (v.type === 'LockupView' && v.content_type === 'VIDEO') {
        // youtubei.js v18以降、プレイリストの項目はLockupViewとして返る
        const lockupMeta = v.metadata as {
          title?: { text?: string };
          metadata?: { metadata_rows?: { metadata_parts?: { text?: { text?: string } }[] }[] };
        } | undefined;
        const contentImage = v.content_image as {
          image?: { url: string }[];
          overlays?: { badges?: { text?: string }[] }[];
        } | undefined;

        let durationSec = 0;
        for (const overlay of contentImage?.overlays ?? []) {
          for (const badge of overlay.badges ?? []) {
            const parsed = parseDurationText(badge.text);
            if (parsed > 0) durationSec = durationSec || parsed;
          }
        }

        videos.push({
          videoId: String(v.content_id || ''),
          title: String(lockupMeta?.title?.text || ''),
          author: String(
            lockupMeta?.metadata?.metadata_rows?.[0]?.metadata_parts?.[0]?.text?.text || ''
          ),
          durationSec,
          thumbnail: contentImage?.image?.[0]?.url ? String(contentImage.image[0].url) : '',
          position: videos.length,
        });
      }
    }
  };

  collectVideos(playlist);

  let page = playlist;
  while (page.has_continuation) {
    await new Promise((r) => setTimeout(r, RATE_LIMIT_MS));
    page = await page.getContinuation();
    collectVideos(page);
  }

  if (!meta.videoCount) meta.videoCount = videos.length;

  return { meta, videos };
}

export interface SyncDiff {
  added: ExtractedVideo[];
  removed: { videoId: string; title: string }[];
  unchanged: number;
}

export function computeDiff(
  current: ExtractedVideo[],
  previous: { videoId: string; title: string }[]
): SyncDiff {
  const currentIds = new Set(current.map((v) => v.videoId));
  const prevIds = new Set(previous.map((v) => v.videoId));

  const added = current.filter((v) => !prevIds.has(v.videoId));
  const removed = previous.filter((v) => !currentIds.has(v.videoId));
  const unchanged = current.length - added.length;

  return { added, removed, unchanged };
}

export function extractPlaylistTitle(videos: ExtractedVideo[]): string {
  const authorCounts = new Map<string, number>();
  let totalDuration = 0;

  for (const v of videos) {
    if (v.author) {
      authorCounts.set(v.author, (authorCounts.get(v.author) || 0) + 1);
    }
    totalDuration += v.durationSec;
  }

  const topAuthor = [...authorCounts.entries()].sort((a, b) => b[1] - a[1])[0];
  const estimatedGenre = totalDuration > 0 ? 'Mixed' : 'Unknown';

  return JSON.stringify({
    totalTracks: videos.length,
    dominantArtist: topAuthor?.[0] || 'Various',
    totalDurationMin: Math.round(totalDuration / 60),
    estimatedGenre,
  });
}
