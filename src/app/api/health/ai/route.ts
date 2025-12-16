/**
 * ─────────────────────────────────────────────────────────────────────────────
 * AI HEALTH CHECK API
 * ─────────────────────────────────────────────────────────────────────────────
 * 
 * Rota: /api/health/ai
 * 
 * Verifica se a API da OpenAI está configurada e funcionando.
 */

import { NextResponse } from 'next/server';
import { isAIConfigured } from '@/lib/ai';

export async function GET() {
    try {
        const configured = isAIConfigured();

        if (!configured) {
            return NextResponse.json(
                {
                    status: 'error',
                    message: 'OPENAI_API_KEY não configurada',
                },
                { status: 503 }
            );
        }

        return NextResponse.json({
            status: 'ok',
            message: 'AI configurada corretamente',
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        return NextResponse.json(
            {
                status: 'error',
                message: 'Erro ao verificar configuração de AI',
            },
            { status: 500 }
        );
    }
}
