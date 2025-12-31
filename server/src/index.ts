import express from 'express';
import cors from 'cors';
import { createServer } from 'http';

const PORT = process.env.PORT || 3001;

const app = express();

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const server = createServer(app);

server.listen(PORT, () => {
    console.log(`🎮 Four in a Row Server running on http://localhost:${PORT}`);
});
