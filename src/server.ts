import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import webhooksRouter from './routes/webhooks';

export function createServer() {
    const app = express();

    // Base middlewares
    app.use(cors());
    app.use(bodyParser.json());

    // Logging middleware
    app.use((req, res, next) => {
        console.log(`[API] ${req.method} ${req.url}`);
        next();
    });

    // Routes
    app.use('/v1/webhooks', webhooksRouter);

    // Healthcheck
    app.get('/health', (req, res) => {
        res.json({ status: 'healthy', version: '1.0.0' });
    });

    return app;
}
