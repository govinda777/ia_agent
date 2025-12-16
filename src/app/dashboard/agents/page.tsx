'use client';

import { useState, useEffect } from 'react';
import { Header, PageWrapper, PageSection } from '@/components/layout';
import { Button } from '@/components/ui';
import { Plus, Bot, Edit, Power } from 'lucide-react';
import Link from 'next/link';

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * AGENTS PAGE - Lista de agentes (Zaia-Style)
 * ─────────────────────────────────────────────────────────────────────────────
 */

interface Agent {
    id: string;
    name: string;
    description: string | null;
    isActive: boolean;
    isDefault: boolean;
    modelConfig: { model: string } | null;
    messagesCount: number;
    threadsCount: number;
}

export default function AgentsPage() {
    const [agents, setAgents] = useState<Agent[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Carregar agentes do banco
        async function loadAgents() {
            try {
                const res = await fetch('/api/agents');
                if (res.ok) {
                    const data = await res.json();
                    setAgents(data.agents || []);
                }
            } catch (error) {
                console.error('Erro ao carregar agentes:', error);
            } finally {
                setLoading(false);
            }
        }
        loadAgents();
    }, []);

    const toggleAgentStatus = async (agentId: string, currentStatus: boolean) => {
        // Toggle status via API
        try {
            await fetch(`/api/agents/${agentId}/toggle`, {
                method: 'POST',
                body: JSON.stringify({ isActive: !currentStatus }),
            });
            setAgents(prev => prev.map(a =>
                a.id === agentId ? { ...a, isActive: !currentStatus } : a
            ));
        } catch (error) {
            console.error('Erro ao alterar status:', error);
        }
    };

    return (
        <>
            <Header
                title="Agentes"
                description="Gerencie seus agentes de IA"
            >
                <Link href="/dashboard/agents/new">
                    <Button variant="primary" size="sm">
                        <Plus className="h-4 w-4" />
                        Novo Agente
                    </Button>
                </Link>
            </Header>

            <PageWrapper>
                <PageSection>
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                        </div>
                    ) : agents.length === 0 ? (
                        /* Estado vazio - Sem agentes */
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            <Link
                                href="/dashboard/agents/new"
                                className="flex min-h-[200px] items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 transition-all hover:border-blue-300 hover:bg-blue-50/30"
                            >
                                <div className="text-center">
                                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
                                        <Plus className="h-6 w-6 text-slate-400" />
                                    </div>
                                    <p className="font-medium text-slate-600">Criar Agente</p>
                                    <p className="text-sm text-slate-400">Adicione um novo agente de IA</p>
                                </div>
                            </Link>
                        </div>
                    ) : (
                        /* Lista de Agentes */
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {agents.map((agent) => (
                                <div
                                    key={agent.id}
                                    className="group relative rounded-2xl border border-slate-100 bg-white p-6 transition-all hover:border-slate-200 hover:shadow-lg hover:shadow-slate-100"
                                >
                                    {/* Header */}
                                    <div className="mb-4 flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className={`flex h-12 w-12 items-center justify-center rounded-xl ${agent.isActive
                                                    ? 'bg-gradient-to-br from-emerald-500 to-teal-500'
                                                    : 'bg-slate-200'
                                                    }`}
                                            >
                                                <Bot className="h-6 w-6 text-white" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-semibold text-slate-900">
                                                        {agent.name}
                                                    </h3>
                                                    {agent.isDefault && (
                                                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                                                            Padrão
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-slate-500">
                                                    {agent.modelConfig?.model || 'gpt-4o-mini'}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Status indicator */}
                                        <div
                                            className={`h-2.5 w-2.5 rounded-full ${agent.isActive
                                                ? 'bg-emerald-500'
                                                : 'bg-slate-300'
                                                }`}
                                        />
                                    </div>

                                    {/* Description */}
                                    <p className="mb-4 text-sm text-slate-600 line-clamp-2">
                                        {agent.description || 'Sem descrição'}
                                    </p>

                                    {/* Stats */}
                                    <div className="mb-4 flex gap-4 text-sm">
                                        <div>
                                            <span className="font-medium text-blue-600">
                                                {agent.messagesCount.toLocaleString()}
                                            </span>
                                            <span className="text-slate-500 ml-1">mensagens</span>
                                        </div>
                                        <div>
                                            <span className="font-medium text-blue-600">
                                                {agent.threadsCount}
                                            </span>
                                            <span className="text-slate-500 ml-1">conversas</span>
                                        </div>
                                    </div>

                                    {/* Actions - Igual Zaia */}
                                    <div className="flex items-center gap-2">
                                        <Link href={`/dashboard/agents/${agent.id}/builder`} className="flex-1">
                                            <Button variant="outline" size="sm" className="w-full">
                                                <Edit className="h-4 w-4" />
                                                Editar
                                            </Button>
                                        </Link>

                                        <button
                                            onClick={() => toggleAgentStatus(agent.id, agent.isActive)}
                                            className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${agent.isActive
                                                    ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                                                    : 'bg-slate-200 text-slate-500 hover:bg-slate-300'
                                                }`}
                                        >
                                            <Power className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}

                            {/* Add New Card */}
                            <Link
                                href="/dashboard/agents/new"
                                className="flex min-h-[200px] items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 transition-all hover:border-blue-300 hover:bg-blue-50/30"
                            >
                                <div className="text-center">
                                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
                                        <Plus className="h-6 w-6 text-slate-400" />
                                    </div>
                                    <p className="font-medium text-slate-600">Criar Agente</p>
                                    <p className="text-sm text-slate-400">Adicione um novo agente de IA</p>
                                </div>
                            </Link>
                        </div>
                    )}
                </PageSection>
            </PageWrapper>
        </>
    );
}

