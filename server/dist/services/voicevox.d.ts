export interface VoicevoxSpeaker {
    name: string;
    speaker_uuid: string;
    styles: {
        id: number;
        name: string;
        type: string;
    }[];
}
export interface CharacterPreset {
    id: string;
    name: string;
    speakerId: number;
    personality: string;
    catchphrase: string;
    description: string;
    speedScale: number;
    pitchScale: number;
    emoji: string;
}
export declare const CHARACTER_PRESETS: CharacterPreset[];
export declare function getPresetById(id: string): CharacterPreset | undefined;
export declare function getAllPresets(): CharacterPreset[];
export declare function fetchSpeakers(): Promise<VoicevoxSpeaker[]>;
export declare function generateAudioQuery(text: string, speakerId: number): Promise<unknown>;
export declare function synthesizeSpeech(query: unknown, speakerId: number, speedScale?: number, pitchScale?: number): Promise<ArrayBuffer>;
//# sourceMappingURL=voicevox.d.ts.map