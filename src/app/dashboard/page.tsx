'use client';

import { useState, useEffect } from 'react';
import { Header, PageWrapper, PageSection } from '@/components/layout';
import {
    MessageSquare,
    Users,
    Calendar,
    Bot,
    Zap,
    TrendingUp,
} from 'lucide-react';
import Link from 'next/link';

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * DASHBOARD PAGE - Visão geral (estado vazio por padrão)
 * ─────────────────────────────────────────────────────────────────────────────
 */

interface Stats {
    agentsCount: number;
    threadsCount: number;
    messagesCount: number;
    scheduledCount: number;
}

export default function DashboardPage() {
    const [stats, setStats] = useState<Stats>({
        agentsCount: 0,
        threadsCount: 0,
        messagesCount: 0,
        scheduledCount: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadStats() {
            try {
                const res = await fetch('/api/dashboard/stats');
                if (res.ok) {
                    const data = await res.json();
                    setStats(data);
                }
            } catch (error) {
                console.error('Erro ao carregar stats:', error);
            } finally {
                setLoading(false);
            }
        }
        loadStats();
    }, []);

    const statCards = [
        {
            name: 'Agentes Ativos',
            value: stats.agentsCount,
            icon: Bot,
            color: 'from-blue-500 to-blue-600',
            href: '/dashboard/agents',
        },
        {
            name: 'Conversas',
            value: stats.threadsCount,
            icon: MessageSquare,
            color: 'from-emerald-500 to-emerald-600',
            href: '/dashboard/threads',
        },
        {
            name: 'Mensagens',
            value: stats.messagesCount,
            icon: Users,
            color: 'from-violet-500 to-violet-600',
            href: '/dashboard/threads',
        },
        {
            name: 'Agendamentos',
            value: stats.scheduledCount,
            icon: Calendar,
            color: 'from-amber-500 to-amber-600',
            href: '/dashboard/integrations',
        },
    ];

    return (
        <>
            <Header
                title="Dashboard"
                description="Visão geral do seu Agente"
            />

            <PageWrapper>
                {/* Stats Grid */}
                <PageSection className="mb-8">
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        {statCards.map((stat) => (
                            <Link
                                key={stat.name}
                                href={stat.href}
                                className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-6 transition-all hover:border-slate-200 hover:shadow-lg hover:shadow-slate-100"
                            >
                                {/* Icon */}
                                <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${stat.color}`}>
                                    <stat.icon className="h-6 w-6 text-white" />
                                </div>

                                {/* Value */}
                                <div className="mb-1 text-3xl font-bold text-slate-900">
                                    {loading ? '—' : stat.value}
                                </div>

                                {/* Name */}
                                <span className="text-sm text-slate-500">{stat.name}</span>

                                {/* Decorative gradient */}
                                <div className={`absolute -right-4 -top-4 h-24 w-24 rounded-full bg-gradient-to-br ${stat.color} opacity-10 blur-2xl transition-opacity group-hover:opacity-20`} />
                            </Link>
                        ))}
                    </div>
                </PageSection>

                {/* Quick Actions */}
                <PageSection title="Primeiros Passos">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <Link
                            href="/dashboard/agents/new"
                            className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 transition-all hover:border-blue-200 hover:shadow-md"
                        >
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
                                <Zap className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <div className="font-medium text-slate-900">Criar Agente</div>
                                <div className="text-sm text-slate-500">Configure uma nova IA</div>
                            </div>
                        </Link>

                        <Link
                            href="/dashboard/integrations"
                            className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 transition-all hover:border-emerald-200 hover:shadow-md"
                        >
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
                                <Calendar className="h-5 w-5 text-emerald-600" />
                            </div>
                            <div>
                                <div className="font-medium text-slate-900">Conectar Integrações</div>
                                <div className="text-sm text-slate-500">Google Calendar, Sheets</div>
                            </div>
                        </Link>

                        <Link
                            href="/dashboard/threads"
                            className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 transition-all hover:border-violet-200 hover:shadow-md"
                        >
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100">
                                <TrendingUp className="h-5 w-5 text-violet-600" />
                            </div>
                            <div>
                                <div className="font-medium text-slate-900">Ver Conversas</div>
                                <div className="text-sm text-slate-500">Histórico de atendimento</div>
                            </div>
                        </Link>
                    </div>
                </PageSection>
            </PageWrapper>
        </>
    );
}
