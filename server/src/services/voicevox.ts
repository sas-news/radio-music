const VOICEVOX_URL = process.env.VOICEVOX_URL || 'http://localhost:50021';

export interface VoicevoxSpeaker {
  name: string;
  speaker_uuid: string;
  styles: { id: number; name: string; type: string }[];
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

export const CHARACTER_PRESETS: CharacterPreset[] = [
  {
    id: 'zundamon-normal',
    name: 'ずんだもん',
    speakerId: 3,
    personality: 'ずんだ餅の妖精。好奇心旺盛で明るく、少しドジ。語尾に「なのだ」「のだ」をつける。',
    catchphrase: 'ぼくずんだもんなのだ！',
    description: '元気いっぱいの東北ずん子ファミリー。親しみやすくて愛されるMC。',
    speedScale: 1.1,
    pitchScale: 0.0,
    emoji: '🫘',
  },
  {
    id: 'zundamon-ama',
    name: 'ずんだもん（あまあま）',
    speakerId: 4,
    personality: 'ずんだもんの甘えん坊モード。優しく親しみやすい語り口。',
    catchphrase: '今日もよろしくなのだ〜',
    description: 'いつもより甘えた雰囲気のずんだもん。リラックスした選曲にぴったり。',
    speedScale: 1.0,
    pitchScale: 0.05,
    emoji: '💚',
  },
  {
    id: 'zundamon-tsun',
    name: 'ずんだもん（ツンツン）',
    speakerId: 5,
    personality: 'ちょっとツンツンした態度のずんだもん。でも実は優しい。',
    catchphrase: 'べ、別にアンタのために曲かけてるわけじゃないんだからな！',
    description: 'ツンデレMC。ロックや激しい曲の紹介に意外なマッチ感。',
    speedScale: 1.0,
    pitchScale: -0.03,
    emoji: '😤',
  },
  {
    id: 'metan-normal',
    name: '四国めたん',
    speakerId: 1,
    personality: '関西弁を話す明るく話好きな女の子。ノリツッコミが得意。',
    catchphrase: 'ほな、いこかー！',
    description: '関西弁のフレンドリーMC。どんな曲も盛り上げ上手。',
    speedScale: 1.05,
    pitchScale: 0.0,
    emoji: '🐙',
  },
  {
    id: 'metan-ama',
    name: '四国めたん（あまあま）',
    speakerId: 2,
    personality: '優しく甘い声で語りかける関西弁のお姉さん。',
    catchphrase: 'ゆっくりしていってな〜',
    description: 'まったり深夜ラジオ風。しっとりした選曲に寄り添うMC。',
    speedScale: 0.95,
    pitchScale: 0.03,
    emoji: '🌙',
  },
  {
    id: 'tsumugi-normal',
    name: '春日部つむぎ',
    speakerId: 8,
    personality: '埼玉県春日部市のマスコット。のんびりほんわかした性格。優しい口調。',
    catchphrase: '今日もゆる〜くいきましょ〜',
    description: 'ゆるふわMC。カフェミュージックや癒し系選曲に最適。',
    speedScale: 0.9,
    pitchScale: 0.02,
    emoji: '🌸',
  },
  {
    id: 'hau-normal',
    name: '雨晴はう',
    speakerId: 10,
    personality: '雨の日に出会える落ち着いた雰囲気の女の子。しっとり文学的な表現。',
    catchphrase: '今日は素敵な音楽と一緒に…',
    description: 'しっとり大人なMC。ジャズやボサノバ、雨の日の選曲に。',
    speedScale: 0.9,
    pitchScale: 0.0,
    emoji: '☔',
  },
  {
    id: 'mochiko-normal',
    name: 'もち子（cv 明日葉よもぎ）',
    speakerId: 12,
    personality: 'もちもちした可愛い声の女の子。優しく癒し系。',
    catchphrase: '今日ももちもちいきましょ〜',
    description: 'もちもち癒しボイス。ポップで可愛い選曲に。',
    speedScale: 0.95,
    pitchScale: 0.02,
    emoji: '🍡',
  },
  {
    id: 'kiritan-normal',
    name: '東北きりたん',
    speakerId: 9,
    personality: '東北地方のしっかり者の女の子。落ち着いていて頼りになる。',
    catchphrase: 'それでは、次の曲どうぞ。',
    description: '落ち着いた進行役。幅広いジャンルに対応できる安定感。',
    speedScale: 0.95,
    pitchScale: 0.0,
    emoji: '🎤',
  },
  {
    id: 'kotaro-normal',
    name: '白上虎太郎',
    speakerId: 15,
    personality: '爽やかな青年声。親しみやすく明るい。',
    catchphrase: 'はい、それでは次の曲いってみよう！',
    description: '若々しい男性MC。ポップスやロックの紹介に。',
    speedScale: 1.0,
    pitchScale: 0.0,
    emoji: '🐯',
  },
  {
    id: 'takehiro-normal',
    name: '玄野武宏',
    speakerId: 14,
    personality: '渋く落ち着いた大人の男性声。',
    catchphrase: '……では、お聴きください。',
    description: '渋い大人の男性MC。ジャズやブルース、渋め選曲に。',
    speedScale: 0.9,
    pitchScale: -0.02,
    emoji: '🎷',
  },
  {
    id: 'himari-normal',
    name: '冥鳴ひまり',
    speakerId: 17,
    personality: 'クールでミステリアスな雰囲気の女の子。',
    catchphrase: '……聴いてくれる？',
    description: 'クール系MC。エレクトロニカやアンビエント系の選曲に。',
    speedScale: 0.9,
    pitchScale: -0.02,
    emoji: '🌑',
  },
];

export function getPresetById(id: string): CharacterPreset | undefined {
  return CHARACTER_PRESETS.find((p) => p.id === id);
}

export function getAllPresets(): CharacterPreset[] {
  return CHARACTER_PRESETS;
}

export async function fetchSpeakers(): Promise<VoicevoxSpeaker[]> {
  const res = await fetch(`${VOICEVOX_URL}/speakers`);
  if (!res.ok) throw new Error(`VOICEVOX unavailable: ${res.status}`);
  return res.json() as Promise<VoicevoxSpeaker[]>;
}

export async function generateAudioQuery(
  text: string,
  speakerId: number
): Promise<unknown> {
  const params = new URLSearchParams({ speaker: String(speakerId), text });
  const res = await fetch(`${VOICEVOX_URL}/audio_query?${params}`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error(`audio_query failed: ${res.status}`);
  return res.json();
}

export async function synthesizeSpeech(
  query: unknown,
  speakerId: number,
  speedScale = 1.0,
  pitchScale = 0.0
): Promise<ArrayBuffer> {
  const adjustedQuery = { ...(query as Record<string, unknown>), speedScale, pitchScale };
  const res = await fetch(`${VOICEVOX_URL}/synthesis?speaker=${speakerId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(adjustedQuery),
  });
  if (!res.ok) throw new Error(`synthesis failed: ${res.status}`);
  return res.arrayBuffer();
}
