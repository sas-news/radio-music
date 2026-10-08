import Dexie, { type Table } from 'dexie';
import type { Song, Playlist, SongRating, PlayHistory } from '../types';

class MusicDB extends Dexie {
  songs!: Table<Song, number>;
  playlists!: Table<Playlist, number>;
  ratings!: Table<SongRating, number>;
  playHistory!: Table<PlayHistory, number>;

  constructor() {
    super('RadioMusicDB');
    this.version(1).stores({
      songs: '++id, videoId, playlistId, [playlistId+videoId]',
      playlists: '++id, playlistId',
      ratings: '++id, songVideoId, ratedAt',
      playHistory: '++id, songVideoId, playedAt',
    });
  }
}

export const db = new MusicDB();

export async function saveImportResult(
  playlistId: string,
  meta: { title: string; author: string; thumbnail: string; videoCount: number },
  videos: { videoId: string; title: string; author: string; durationSec: number; thumbnail: string; position: number }[]
): Promise<void> {
  await db.transaction('rw', db.playlists, db.songs, async () => {
    const existing = await db.playlists.where('playlistId').equals(playlistId).first();

    if (existing) {
      await db.playlists.update(existing.id!, {
        title: meta.title,
        author: meta.author,
        thumbnail: meta.thumbnail,
        videoCount: meta.videoCount,
        lastSyncedAt: new Date().toISOString(),
      });
    } else {
      await db.playlists.put({
        playlistId,
        title: meta.title,
        author: meta.author,
        thumbnail: meta.thumbnail,
        videoCount: meta.videoCount,
        importedAt: new Date().toISOString(),
        lastSyncedAt: new Date().toISOString(),
      });
    }

    // 既存レコードを引き継ぐ（再インポート/同期で重複や分析結果の消失を防ぐ）
    const existingSongs = await db.songs.where('playlistId').equals(playlistId).toArray();
    const existingByVideoId = new Map(existingSongs.map((s) => [s.videoId, s]));

    const songs: Song[] = videos.map((v) => {
      const prev = existingByVideoId.get(v.videoId);
      return {
        ...(prev?.id !== undefined ? { id: prev.id } : {}),
        videoId: v.videoId,
        title: v.title,
        author: v.author,
        durationSec: v.durationSec,
        thumbnail: v.thumbnail,
        position: v.position,
        analysis: prev?.analysis ?? null,
        analyzedAt: prev?.analyzedAt ?? null,
        playlistId,
      };
    });

    // インポート結果に含まれない既存行（YouTube側で削除済み・過去の重複行）を削除
    const keepIds = new Set(
      songs.map((s) => s.id).filter((id): id is number => id !== undefined)
    );
    await db.songs
      .where('playlistId')
      .equals(playlistId)
      .filter((s) => !keepIds.has(s.id!))
      .delete();

    await db.songs.bulkPut(songs);
  });
}

export async function updateSongAnalysis(
  videoId: string,
  analysis: NonNullable<Song['analysis']>
): Promise<void> {
  await db.songs.where('videoId').equals(videoId).modify({
    analysis,
    analyzedAt: new Date().toISOString(),
  });
}

export async function removeSongs(playlistId: string, videoIds: string[]): Promise<void> {
  await db.songs
    .where('[playlistId+videoId]')
    .anyOf(videoIds.map((vid) => [playlistId, vid]))
    .delete();
}

export function getAllSongs(playlistId?: string): Promise<Song[]> {
  if (playlistId) {
    return db.songs.where('playlistId').equals(playlistId).toArray();
  }
  return db.songs.toArray();
}

export function getAllPlaylists(): Promise<Playlist[]> {
  return db.playlists.toArray();
}

export async function recordPlay(
  songVideoId: string,
  completed: boolean,
  skipped: boolean
): Promise<void> {
  await db.playHistory.put({
    songVideoId,
    playedAt: new Date().toISOString(),
    completed,
    skipped,
  });
}

export async function rateSong(
  songVideoId: string,
  score: -1 | 0 | 1
): Promise<void> {
  const existing = await db.ratings.where('songVideoId').equals(songVideoId).last();
  if (existing && existing.score === score) return;

  await db.ratings.put({
    songVideoId,
    score,
    ratedAt: new Date().toISOString(),
  });
}

export async function getListeningStats(): Promise<{
  videoId: string;
  count: number;
  liked: boolean;
}[]> {
  const history = await db.playHistory.toArray();
  const ratings = await db.ratings.toArray();

  const counts = new Map<string, number>();
  for (const h of history) {
    counts.set(h.songVideoId, (counts.get(h.songVideoId) || 0) + 1);
  }

  const liked = new Set(
    ratings.filter((r) => r.score === 1).map((r) => r.songVideoId)
  );

  return [...counts.entries()].map(([videoId, count]) => ({
    videoId,
    count,
    liked: liked.has(videoId),
  }));
}

export async function getRecentRatings(days = 7): Promise<SongRating[]> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  return db.ratings.where('ratedAt').above(since).toArray();
}
