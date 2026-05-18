import { Innertube, UniversalCache } from 'youtubei.js';
function extractPlaylistId(urlOrId) {
    if (/^[A-Za-z0-9_-]{34}$/.test(urlOrId))
        return urlOrId;
    const match = urlOrId.match(/[?&]list=([^&]+)/);
    if (match)
        return match[1];
    throw new Error('プレイリストURLまたはIDを認識できませんでした');
}
const RATE_LIMIT_MS = 300;
export async function fetchPlaylist(urlOrId) {
    const playlistId = extractPlaylistId(urlOrId);
    const yt = await Innertube.create({
        cache: new UniversalCache(true),
        generate_session_locally: true,
    });
    const playlist = await yt.getPlaylist(playlistId);
    const playlistMeta = playlist;
    const meta = {
        id: playlistId,
        title: playlistMeta.info.title || 'Untitled Playlist',
        author: playlistMeta.info.author?.name || 'Unknown',
        thumbnail: playlistMeta.info.thumbnail || '',
        videoCount: playlistMeta.info.total_items || 0,
    };
    const videos = [];
    const collectVideos = (page) => {
        const pageData = page;
        for (const item of pageData.items) {
            const v = item;
            if (v.type === 'PlaylistVideo') {
                videos.push({
                    videoId: String(v.video_id || v.id || ''),
                    title: typeof v.title === 'object' ? String(v.title.text) : String(v.title || ''),
                    author: typeof v.author === 'object'
                        ? String((v.author?.name) || '')
                        : String(v.author || ''),
                    durationSec: Number(v.length_seconds) || Number(v.duration?.seconds) || 0,
                    thumbnail: Array.isArray(v.thumbnails) && v.thumbnails.length > 0
                        ? String(v.thumbnails[v.thumbnails.length - 1].url)
                        : '',
                    position: Number(v.index?.text) || 0,
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
    return { meta, videos };
}
export function computeDiff(current, previous) {
    const currentIds = new Set(current.map((v) => v.videoId));
    const prevIds = new Set(previous.map((v) => v.videoId));
    const added = current.filter((v) => !prevIds.has(v.videoId));
    const removed = previous.filter((v) => !currentIds.has(v.videoId));
    const unchanged = current.length - added.length;
    return { added, removed, unchanged };
}
export function extractPlaylistTitle(videos) {
    const authorCounts = new Map();
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
//# sourceMappingURL=youtube.js.map