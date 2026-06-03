import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import coreRouter from './core/routes';
import { registerConnector as registerOwncastConnector } from './connectors/owncast';

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

    // 1. Register Core Engine routes (Agnostic to platforms)
    app.use('/api/core', coreRouter);

    // 2. Register Connectors
    registerOwncastConnector(app);

    // Healthcheck
    app.get('/health', (req, res) => {
        res.json({ status: 'healthy', version: '1.0.0' });
    });

    return app;
}
