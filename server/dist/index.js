/**
 * AI Word Connect Game - Server Entry Point
 * Requirements: 8.1
 */
import express from 'express';
import cors from 'cors';
import wordsRouter from './routes/words.js';
const app = express();
const PORT = process.env.PORT || 3000;
// Middleware
app.use(cors());
app.use(express.json());
// Routes
app.use('/api/words', wordsRouter);
// Health check
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// Error handling middleware
app.use((err, _req, res, _next) => {
    console.error('Server error:', err);
    const errorResponse = {
        success: false,
        error: {
            code: 'INTERNAL_ERROR',
            message: err.message || 'Internal server error'
        }
    };
    res.status(500).json(errorResponse);
});
// 404 handler
app.use((_req, res) => {
    const errorResponse = {
        success: false,
        error: {
            code: 'NOT_FOUND',
            message: 'Endpoint not found'
        }
    };
    res.status(404).json(errorResponse);
});
app.listen(PORT, () => {
    console.log(`AI Word Connect Game Server running on port ${PORT}`);
});
export default app;
