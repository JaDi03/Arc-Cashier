import { Router, Request, Response } from 'express';
import { sessionService } from '../services/session';
import type { OwncastWebhookPayload, WebhookUserJoinedEventData, WebhookUserPartEventData } from '../types/owncast';

const router = Router();

router.post('/owncast', async (req: Request, res: Response) => {
    const payload = req.body as OwncastWebhookPayload;

    if (!payload || !payload.eventData || !payload.eventData.user) {
        return res.status(400).json({ error: "Invalid Owncast Webhook format" });
    }

    const userId = payload.eventData.user.id;

    if (payload.type === 'USER_JOINED') {
        const eventData = payload.eventData as WebhookUserJoinedEventData;
        sessionService.recordJoin(eventData.user.id);
        return res.json({ status: "recorded" });
    } 
    else if (payload.type === 'USER_PARTED') {
        const eventData = payload.eventData as WebhookUserPartEventData;
        // Lanzamos la promesa pero no bloqueamos la respuesta al Webhook
        // Owncast necesita saber que recibimos el webhook rápido (fire & forget)
        sessionService.recordPartAndSettle(eventData.user.id).catch(console.error);
        return res.json({ status: "processing_settlement" });
    }

    return res.json({ status: "ignored_event_type" });
});

export default router;
