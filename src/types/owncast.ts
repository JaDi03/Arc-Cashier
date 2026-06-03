// Tipos de Owncast basados en services/webhooks/webhooks.go

export interface OwncastUser {
    id: string;
    displayName: string;
    displayColor?: number;
    createdAt?: string;
    previousNames?: string[];
}

export interface BaseWebhookData {
    // Campos comunes a todos los webhooks de Owncast
}

export interface WebhookUserJoinedEventData extends BaseWebhookData {
    id: string;
    timestamp: string; // ISO 8601
    user: OwncastUser;
}

export interface WebhookUserPartEventData extends BaseWebhookData {
    id: string;
    timestamp: string; // ISO 8601
    user: OwncastUser;
}

// Payload estándar que Owncast envía al servidor webhook
export interface OwncastWebhookPayload {
    type: string; // ej. 'USER_JOINED' | 'USER_PARTED' | 'CHAT'
    eventData: WebhookUserJoinedEventData | WebhookUserPartEventData | any;
}
