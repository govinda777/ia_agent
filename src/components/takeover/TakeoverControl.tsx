'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui';
import { UserCheck, Bot, AlertCircle } from 'lucide-react';
import { takeoverThread, releaseThread } from '@/app/actions/takeover';

interface TakeoverControlProps {
    threadId: string;
    userId: string;
    isHumanTakeover: boolean;
    takeoverReason?: string;
    onStatusChange?: (isHumanTakeover: boolean) => void;
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * TAKEOVER CONTROL - Botão para assumir/devolver conversa
 * ─────────────────────────────────────────────────────────────────────────────
 */
export function TakeoverControl({
    threadId,
    userId,
    isHumanTakeover: initialStatus,
    takeoverReason,
    onStatusChange,
}: TakeoverControlProps) {
    const [isHumanTakeover, setIsHumanTakeover] = useState(initialStatus);
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    const handleToggle = () => {
        setError(null);

        startTransition(async () => {
            try {
                const result = isHumanTakeover
                    ? await releaseThread(threadId)
                    : await takeoverThread(threadId, userId);

                if (result.success) {
                    const newStatus = result.isHumanTakeover ?? !isHumanTakeover;
                    setIsHumanTakeover(newStatus);
                    onStatusChange?.(newStatus);
                } else {
                    setError(result.error || 'Erro ao alterar status');
                }
            } catch (err) {
                setError('Erro inesperado');
            }
        });
    };

    return (
        <div className="space-y-2">
            {/* Status Banner */}
            {isHumanTakeover && (
                <div className="flex items-center gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
                    <UserCheck className="h-4 w-4" />
                    <div>
                        <span className="font-medium">Você está no controle</span>
                        {takeoverReason && (
                            <span className="ml-2 text-amber-600">({takeoverReason})</span>
                        )}
                    </div>
                </div>
            )}

            {/* Toggle Button */}
            <Button
                variant={isHumanTakeover ? 'primary' : 'outline'}
                size="sm"
                onClick={handleToggle}
                disabled={isPending}
                className="w-full"
            >
                {isPending ? (
                    <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Processando...
                    </>
                ) : isHumanTakeover ? (
                    <>
                        <Bot className="h-4 w-4" />
                        Devolver ao Agente
                    </>
                ) : (
                    <>
                        <UserCheck className="h-4 w-4" />
                        Assumir Conversa
                    </>
                )}
            </Button>

            {/* Error */}
            {error && (
                <div className="flex items-center gap-2 text-sm text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    {error}
                </div>
            )}
        </div>
    );
}

/**
 * Badge simples para indicar status de takeover
 */
export function TakeoverBadge({ isHumanTakeover }: { isHumanTakeover: boolean }) {
    if (!isHumanTakeover) return null;

    return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
            <UserCheck className="h-3 w-3" />
            Humano
        </span>
    );
}
