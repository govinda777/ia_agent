/**
 * ─────────────────────────────────────────────────────────────────────────────
 * UTILITIES - Funções auxiliares globais
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combina classes do Tailwind de forma inteligente.
 * Resolve conflitos entre classes (ex: 'p-2 p-4' → 'p-4').
 * 
 * @example
 * cn('px-2 py-1', 'p-4') // → 'p-4'
 * cn('bg-red-500', condition && 'bg-blue-500') // → 'bg-blue-500' se condition
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Formata uma data para exibição relativa (ex: "há 2 horas").
 */
export function formatRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'agora mesmo';
    if (diffMins < 60) return `há ${diffMins} min`;
    if (diffHours < 24) return `há ${diffHours}h`;
    if (diffDays < 7) return `há ${diffDays}d`;

    return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
    });
}

/**
 * Formata um número de telefone para exibição.
 * Ex: +5511999999999 → +55 (11) 99999-9999
 */
export function formatPhoneNumber(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');

    if (cleaned.length === 13 && cleaned.startsWith('55')) {
        const country = cleaned.slice(0, 2);
        const ddd = cleaned.slice(2, 4);
        const first = cleaned.slice(4, 9);
        const second = cleaned.slice(9);
        return `+${country} (${ddd}) ${first}-${second}`;
    }

    return phone;
}

/**
 * Trunca um texto mantendo palavras inteiras.
 */
export function truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;

    const truncated = text.slice(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');

    return truncated.slice(0, lastSpace) + '...';
}

/**
 * Gera um avatar placeholder com iniciais.
 */
export function getInitials(name: string): string {
    return name
        .split(' ')
        .map(word => word[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
}

/**
 * Delay para async/await.
 */
export function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Wrapper para try/catch em async functions.
 */
export async function tryCatch<T>(
    promise: Promise<T>
): Promise<[T, null] | [null, Error]> {
    try {
        const result = await promise;
        return [result, null];
    } catch (error) {
        return [null, error as Error];
    }
}
