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
export declare function fetchPlaylist(urlOrId: string): Promise<{
    meta: PlaylistMeta;
    videos: ExtractedVideo[];
}>;
export interface SyncDiff {
    added: ExtractedVideo[];
    removed: {
        videoId: string;
        title: string;
    }[];
    unchanged: number;
}
export declare function computeDiff(current: ExtractedVideo[], previous: {
    videoId: string;
    title: string;
}[]): SyncDiff;
export declare function extractPlaylistTitle(videos: ExtractedVideo[]): string;
//# sourceMappingURL=youtube.d.ts.map