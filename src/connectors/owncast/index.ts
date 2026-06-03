import express from 'express';
import path from 'path';
import owncastRouter from './webhooks';
import { setupOwncastProxy } from './proxy';

export function registerConnector(app: express.Express) {
    // 1. Serve static files specific to Owncast paywall
    app.use('/owncast-assets', express.static(path.join(__dirname, 'public')));

    // 2. Register Owncast webhooks
    app.use('/api/connectors/owncast', owncastRouter);

    // 3. Setup the reverse proxy for Owncast stream interface
    setupOwncastProxy(app);
    
    console.log('[Connectors] 🔌 Owncast Connector registered successfully');
}
