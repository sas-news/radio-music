import OpenAI from 'openai';
const openai = new OpenAI({
    baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
    apiKey: process.env.OPENAI_API_KEY || '',
});
const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
export async function analyzeSong(videoTitle, videoAuthor) {
    const response = await openai.chat.completions.create({
        model: MODEL,
        messages: [
            {
                role: 'system',
                content: `You are a music expert. Given a YouTube video title and channel name, identify the actual song information. Many YouTube titles contain extra text - extract the real song title and artist.

Return ONLY a JSON object with these fields:
{
  "songTitle": "actual song title",
  "artist": "actual artist name", 
  "genre": ["primary genre", "sub genre"],
  "tempo": "very slow" | "slow" | "medium" | "fast" | "very fast",
  "mood": ["mood1", "mood2"],
  "theme": ["theme1", "theme2"],
  "era": "year or decade",
  "language": "language of lyrics",
  "notableFeatures": "one line about what makes this track distinctive"
}

Mood options: upbeat, melancholic, calm, energetic, romantic, dark, dreamy, aggressive, playful, nostalgic, epic, intimate
Theme options: love, party, workout, study, driving, rain, night, morning, nature, urban, gaming, anime, chill, dance
Genre examples: J-Pop, J-Rock, Anison, Vocaloid, K-Pop, Pop, Rock, Hip-Hop, R&B, Jazz, Classical, Electronic, Lo-fi, City Pop, etc.`,
            },
            {
                role: 'user',
                content: `Title: "${videoTitle}"\nChannel: "${videoAuthor}"\n\nIdentify this song and provide complete music analysis.`,
            },
        ],
        temperature: 0.3,
        max_tokens: 500,
    });
    const content = response.choices[0]?.message?.content || '{}';
    const cleaned = content.replace(/```json\n?|\n?```/g, '').trim();
    return JSON.parse(cleaned);
}
export async function analyzeBatch(songs, batchSize = 10) {
    const results = [];
    for (let i = 0; i < songs.length; i += batchSize) {
        const batch = songs.slice(i, i + batchSize);
        const batchResults = await Promise.all(batch.map((s) => analyzeSong(s.title, s.author)));
        results.push(...batchResults);
    }
    return results;
}
export async function generatePlaylistSummary(analyses) {
    const response = await openai.chat.completions.create({
        model: MODEL,
        messages: [
            {
                role: 'system',
                content: `Analyze a collection of songs and provide a playlist summary in JSON:
{
  "dominantGenres": ["top 2-3 genres"],
  "moodRange": ["prevalent moods"],
  "tempoProfile": "description of tempo distribution",
  "eraRange": "time range",
  "artistDiversity": "how diverse are the artists",
  "recommendedUse": ["best scenarios to listen"]
}`,
            },
            {
                role: 'user',
                content: JSON.stringify(analyses.map((a) => ({
                    song: a.songTitle,
                    artist: a.artist,
                    genre: a.genre,
                    mood: a.mood,
                    tempo: a.tempo,
                }))),
            },
        ],
        temperature: 0.3,
        max_tokens: 400,
    });
    const content = response.choices[0]?.message?.content || '{}';
    const cleaned = content.replace(/```json\n?|\n?```/g, '').trim();
    return JSON.parse(cleaned);
}
export async function selectSongs(userInstruction, allSongs, listeningHistory, count = 10) {
    const songList = allSongs.map((s) => ({
        videoId: s.videoId,
        title: s.title,
        author: s.author,
        genre: s.analysis?.genre || [],
        tempo: s.analysis?.tempo || 'unknown',
        mood: s.analysis?.mood || [],
        theme: s.analysis?.theme || [],
        era: s.analysis?.era || '',
    }));
    const historySummary = listeningHistory
        .filter((h) => h.count >= 3)
        .map((h) => {
        const song = allSongs.find((s) => s.videoId === h.videoId);
        return `${song?.title || h.videoId} (played ${h.count}x, ${h.liked ? 'liked' : 'disliked'})`;
    })
        .join('\n');
    const response = await openai.chat.completions.create({
        model: MODEL,
        messages: [
            {
                role: 'system',
                content: `You are a DJ AI. Select songs from a playlist that match the user's request. Consider their listening history and ratings.

Return JSON:
{
  "videoIds": ["id1", "id2", ...],
  "reasoning": "brief explanation in Japanese of why these songs were selected"
}

Prioritize songs the user liked, avoid overplayed ones unless requested. Consider tempo flow between songs.`,
            },
            {
                role: 'user',
                content: `User request: "${userInstruction}"

Available songs (${allSongs.length} total):
${JSON.stringify(songList, null, 2)}

User listening history:
${historySummary || 'No history yet'}

Select ${count} songs that best match the request. Respond in Japanese for the reasoning.`,
            },
        ],
        temperature: 0.7,
        max_tokens: 1000,
    });
    const content = response.choices[0]?.message?.content || '{}';
    const cleaned = content.replace(/```json\n?|\n?```/g, '').trim();
    const result = JSON.parse(cleaned);
    return result;
}
export async function generateMcScript(currentSong, nextSong, characterName, characterPersonality) {
    const currentInfo = currentSong.analysis
        ? `${currentSong.analysis.songTitle} by ${currentSong.analysis.artist} - ${currentSong.analysis.genre.join('/')} - ${currentSong.analysis.mood.join('、')}な曲`
        : `${currentSong.title} by ${currentSong.author}`;
    const nextInfo = nextSong.analysis
        ? `${nextSong.analysis.songTitle} by ${nextSong.analysis.artist} - ${nextSong.analysis.genre.join('/')} - ${nextSong.analysis.mood.join('、')}な曲`
        : `${nextSong.title} by ${nextSong.author}`;
    const response = await openai.chat.completions.create({
        model: MODEL,
        messages: [
            {
                role: 'system',
                content: `あなたは「${characterName}」というキャラクターです。
性格・口調：${characterPersonality}

ラジオDJとして、曲と曲の間のMCトークを生成してください。
以下のルールを守ってください：
- キャラクターの性格や口調を完全に反映すること
- 自然な会話調で、書き言葉ではなく話し言葉
- 前の曲を軽く振り返りつつ、次の曲を自然に紹介する
- 一文は短めに（音声合成しやすいように）
- 全体で3〜5文程度
- タメ口やキャラ語尾など、口調の特徴を必ず入れる

JSON形式で：
{
  "intro": "曲前のMC（これから流れる曲の紹介）",
  "outro": "曲後のMC（今流れた曲の感想＋次の曲へのつなぎ）"
}`,
            },
            {
                role: 'user',
                content: `今流れた曲：${currentInfo}
次に流す曲：${nextInfo}

上記の2曲をつなぐMCトークを生成してください。`,
            },
        ],
        temperature: 0.8,
        max_tokens: 500,
    });
    const content = response.choices[0]?.message?.content || '{}';
    const cleaned = content.replace(/```json\n?|\n?```/g, '').trim();
    return JSON.parse(cleaned);
}
//# sourceMappingURL=ai.js.map