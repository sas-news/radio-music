import express from 'express';
import cors from 'cors';
import playlistRoutes from './routes/playlist.js';
import analyzeRoutes from './routes/analyze.js';
import selectRoutes from './routes/select.js';
import ttsRoutes from './routes/tts.js';

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

app.use(cors());
app.use(express.json({ limit: '50mb' }));

app.use('/api/playlist', playlistRoutes);
app.use('/api/analyze', analyzeRoutes);
app.use('/api/select', selectRoutes);
app.use('/api/tts', ttsRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🎵 Radio Music server running on http://localhost:${PORT}`);
});
