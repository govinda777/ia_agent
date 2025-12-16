'use client';

import { useState, useEffect } from 'react';
import { Header, PageWrapper, PageSection } from '@/components/layout';
import { Badge, Avatar, AvatarFallback } from '@/components/ui';
import { Search, Filter, Archive, MessageSquare } from 'lucide-react';
import Link from 'next/link';

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * THREADS PAGE - Lista de conversas (estado vazio por padrão)
 * ─────────────────────────────────────────────────────────────────────────────
 */

interface Thread {
    id: string;
    contactName: string | null;
    contactPhone: string | null;
    lastMessage: string | null;
    status: 'active' | 'pending' | 'qualified' | 'booked' | 'archived';
    messageCount: number;
    lastInteractionAt: string;
}

const statusConfig = {
    active: { label: 'Ativo', variant: 'active' as const },
    pending: { label: 'Aguardando', variant: 'pending' as const },
    qualified: { label: 'Qualificado', variant: 'qualified' as const },
    booked: { label: 'Agendado', variant: 'booked' as const },
    archived: { label: 'Arquivado', variant: 'archived' as const },
};

function formatRelativeTime(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `${diffMins} min`;
    if (diffHours < 24) return `${diffHours}h`;
    return `${diffDays}d`;
}

export default function ThreadsPage() {
    const [threads, setThreads] = useState<Thread[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadThreads() {
            try {
                const res = await fetch('/api/threads');
                if (res.ok) {
                    const data = await res.json();
                    setThreads(data.threads || []);
                }
            } catch (error) {
                console.error('Erro ao carregar conversas:', error);
            } finally {
                setLoading(false);
            }
        }
        loadThreads();
    }, []);

    return (
        <>
            <Header
                title="Conversas"
                description="Histórico de atendimentos via WhatsApp"
            >
                <div className="flex items-center gap-2">
                    <button className="flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-600 hover:bg-slate-50">
                        <Filter className="h-4 w-4" />
                        Filtrar
                    </button>
                    <button className="flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-600 hover:bg-slate-50">
                        <Archive className="h-4 w-4" />
                        Arquivadas
                    </button>
                </div>
            </Header>

            <PageWrapper>
                <PageSection>
                    {/* Search */}
                    <div className="relative mb-6">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar por nome, telefone ou mensagem..."
                            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm placeholder:text-slate-400 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                        />
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                        </div>
                    ) : threads.length === 0 ? (
                        /* Estado vazio */
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                                <MessageSquare className="h-8 w-8 text-slate-400" />
                            </div>
                            <h3 className="mb-2 text-lg font-medium text-slate-900">
                                Nenhuma conversa ainda
                            </h3>
                            <p className="max-w-sm text-sm text-slate-500">
                                As conversas com seus leads aparecerão aqui quando iniciarem um atendimento.
                            </p>
                        </div>
                    ) : (
                        /* Thread List */
                        <div className="rounded-2xl border border-slate-100 bg-white">
                            <div className="divide-y divide-slate-100">
                                {threads.map((thread) => (
                                    <Link
                                        key={thread.id}
                                        href={`/dashboard/threads/${thread.id}`}
                                        className="group flex items-center gap-4 p-4 transition-colors hover:bg-slate-50"
                                    >
                                        {/* Avatar */}
                                        <Avatar className="h-12 w-12">
                                            <AvatarFallback>
                                                {(thread.contactName || '?').split(' ').map(n => n[0]).join('')}
                                            </AvatarFallback>
                                        </Avatar>

                                        {/* Content */}
                                        <div className="min-w-0 flex-1">
                                            <div className="mb-1 flex items-center gap-2">
                                                <span className="font-medium text-slate-900">
                                                    {thread.contactName || 'Sem nome'}
                                                </span>
                                                <span className="text-xs text-slate-400">
                                                    {thread.contactPhone || ''}
                                                </span>
                                            </div>
                                            <p className="truncate text-sm text-slate-500">
                                                {thread.lastMessage || 'Sem mensagens'}
                                            </p>
                                        </div>

                                        {/* Meta */}
                                        <div className="flex flex-col items-end gap-1">
                                            <span className="text-xs text-slate-400">
                                                {formatRelativeTime(thread.lastInteractionAt)}
                                            </span>
                                            <Badge variant={statusConfig[thread.status]?.variant || 'pending'}>
                                                {statusConfig[thread.status]?.label || thread.status}
                                            </Badge>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}
                </PageSection>
            </PageWrapper>
        </>
    );
}
