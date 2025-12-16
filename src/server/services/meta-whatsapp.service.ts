/**
 * ─────────────────────────────────────────────────────────────────────────────
 * META WHATSAPP SERVICE - Integração com WhatsApp Business API
 * ─────────────────────────────────────────────────────────────────────────────
 */

import crypto from 'crypto';

const WHATSAPP_API_URL = 'https://graph.facebook.com/v18.0';

interface SendMessageParams {
    to: string;
    message: string;
}

interface WhatsAppWebhookPayload {
    object: string;
    entry: Array<{
        id: string;
        changes: Array<{
            value: {
                messaging_product: string;
                metadata: {
                    display_phone_number: string;
                    phone_number_id: string;
                };
                contacts?: Array<{
                    profile: { name: string };
                    wa_id: string;
                }>;
                messages?: Array<{
                    from: string;
                    id: string;
                    timestamp: string;
                    type: 'text' | 'image' | 'audio' | 'video' | 'document';
                    text?: { body: string };
                }>;
                statuses?: Array<{
                    id: string;
                    status: 'sent' | 'delivered' | 'read' | 'failed';
                    timestamp: string;
                    recipient_id: string;
                }>;
            };
            field: string;
        }>;
    }>;
}

/**
 * Verifica assinatura do webhook da Meta
 */
export function verifyWebhookSignature(
    payload: string,
    signature: string
): boolean {
    const secret = process.env.WHATSAPP_APP_SECRET;

    if (!secret) {
        console.error('[WhatsApp] WHATSAPP_APP_SECRET não configurado');
        return false;
    }

    const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');

    const providedSignature = signature.replace('sha256=', '');

    return crypto.timingSafeEqual(
        Buffer.from(expectedSignature),
        Buffer.from(providedSignature)
    );
}

/**
 * Extrai mensagens de texto do payload do webhook
 */
export function extractMessagesFromPayload(payload: WhatsAppWebhookPayload) {
    const messages: Array<{
        from: string;
        fromName: string;
        messageId: string;
        timestamp: Date;
        text: string;
    }> = [];

    for (const entry of payload.entry) {
        for (const change of entry.changes) {
            const value = change.value;

            if (!value.messages) continue;

            for (const message of value.messages) {
                if (message.type !== 'text' || !message.text) continue;

                const contact = value.contacts?.find(c => c.wa_id === message.from);

                messages.push({
                    from: message.from,
                    fromName: contact?.profile.name || 'Desconhecido',
                    messageId: message.id,
                    timestamp: new Date(parseInt(message.timestamp) * 1000),
                    text: message.text.body,
                });
            }
        }
    }

    return messages;
}

/**
 * Envia uma mensagem de texto via WhatsApp
 */
export async function sendWhatsAppMessage(params: SendMessageParams) {
    const { to, message } = params;

    const token = process.env.WHATSAPP_TOKEN;
    const phoneId = process.env.WHATSAPP_PHONE_ID;

    if (!token || !phoneId) {
        console.error('[WhatsApp] Credenciais não configuradas');
        return { success: false, error: 'Credenciais não configuradas' };
    }

    try {
        const response = await fetch(
            `${WHATSAPP_API_URL}/${phoneId}/messages`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    messaging_product: 'whatsapp',
                    recipient_type: 'individual',
                    to,
                    type: 'text',
                    text: { body: message },
                }),
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            console.error('[WhatsApp] Erro ao enviar:', errorData);
            return { success: false, error: errorData };
        }

        const data = await response.json();

        return {
            success: true,
            messageId: data.messages?.[0]?.id,
        };
    } catch (error) {
        console.error('[WhatsApp] Exceção ao enviar:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Erro desconhecido',
        };
    }
}

/**
 * Marca mensagem como lida
 */
export async function markMessageAsRead(messageId: string) {
    const token = process.env.WHATSAPP_TOKEN;
    const phoneId = process.env.WHATSAPP_PHONE_ID;

    if (!token || !phoneId) return;

    try {
        await fetch(`${WHATSAPP_API_URL}/${phoneId}/messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messaging_product: 'whatsapp',
                status: 'read',
                message_id: messageId,
            }),
        });
    } catch (error) {
        console.error('[WhatsApp] Erro ao marcar como lida:', error);
    }
}

/**
 * Verifica se é uma verificação de webhook (challenge)
 */
export function isWebhookVerification(searchParams: URLSearchParams): boolean {
    return searchParams.has('hub.mode') && searchParams.has('hub.verify_token');
}

/**
 * Processa verificação de webhook
 */
export function handleWebhookVerification(searchParams: URLSearchParams) {
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
        return { verified: true, challenge };
    }

    return { verified: false };
}

export type { WhatsAppWebhookPayload };
