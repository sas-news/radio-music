export interface SongAnalysis {
    songTitle: string;
    artist: string;
    genre: string[];
    tempo: 'very slow' | 'slow' | 'medium' | 'fast' | 'very fast';
    mood: string[];
    theme: string[];
    era: string;
    language: string;
    notableFeatures: string;
}
export interface AnalyzedSong {
    videoId: string;
    title: string;
    author: string;
    durationSec: number;
    thumbnail: string;
    analysis: SongAnalysis;
    analyzedAt: string;
}
export interface PlaylistSummary {
    dominantGenres: string[];
    moodRange: string[];
    tempoProfile: string;
    eraRange: string;
    artistDiversity: string;
    recommendedUse: string[];
}
export declare function analyzeSong(videoTitle: string, videoAuthor: string): Promise<SongAnalysis>;
export declare function analyzeBatch(songs: {
    title: string;
    author: string;
}[], batchSize?: number): Promise<SongAnalysis[]>;
export declare function generatePlaylistSummary(analyses: SongAnalysis[]): Promise<PlaylistSummary>;
export declare function selectSongs(userInstruction: string, allSongs: {
    videoId: string;
    title: string;
    author: string;
    analysis: SongAnalysis | null;
}[], listeningHistory: {
    videoId: string;
    count: number;
    liked: boolean;
}[], count?: number): Promise<{
    videoIds: string[];
    reasoning: string;
}>;
export interface McScript {
    intro: string;
    outro: string;
}
export declare function generateMcScript(currentSong: {
    title: string;
    author: string;
    analysis: SongAnalysis | null;
}, nextSong: {
    title: string;
    author: string;
    analysis: SongAnalysis | null;
}, characterName: string, characterPersonality: string): Promise<McScript>;
//# sourceMappingURL=ai.d.ts.map