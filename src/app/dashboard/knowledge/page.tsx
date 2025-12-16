'use client';

import { Header, PageWrapper, PageSection } from '@/components/layout';
import { Button, Badge } from '@/components/ui';
import { Plus, BookOpen, Edit, Trash2, GripVertical } from 'lucide-react';

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * KNOWLEDGE PAGE - Base de Conhecimento
 * ─────────────────────────────────────────────────────────────────────────────
 */

// Dados mockados
const mockKnowledge = [
    {
        id: '1',
        topic: 'Preços e Pacotes',
        content: 'Temos 3 pacotes disponíveis:\n- Básico: R$ 997/mês\n- Profissional: R$ 1.997/mês\n- Premium: R$ 3.997/mês\n\nTodos incluem suporte via WhatsApp.',
        agentName: 'Assistente Principal',
        priority: 10,
        isActive: true,
        updatedAt: new Date('2024-03-15'),
    },
    {
        id: '2',
        topic: 'Metodologia',
        content: 'Nossa metodologia é baseada em 4 pilares:\n1. Estratégia de Tráfego\n2. Copywriting Persuasivo\n3. Automação de Vendas\n4. Análise de Dados',
        agentName: 'Assistente Principal',
        priority: 8,
        isActive: true,
        updatedAt: new Date('2024-03-10'),
    },
    {
        id: '3',
        topic: 'FAQ - Garantia',
        content: 'Oferecemos garantia de 7 dias para todos os cursos. Se não ficar satisfeito, devolvemos 100% do valor.',
        agentName: 'Assistente Principal',
        priority: 5,
        isActive: true,
        updatedAt: new Date('2024-03-08'),
    },
    {
        id: '4',
        topic: 'Horário de Atendimento',
        content: 'O atendimento humano funciona de segunda a sexta, das 9h às 18h. Fora desse horário, nosso assistente virtual está disponível 24/7.',
        agentName: 'Assistente Principal',
        priority: 3,
        isActive: false,
        updatedAt: new Date('2024-02-28'),
    },
];

export default function KnowledgePage() {
    return (
        <>
            <Header
                title="Base de Conhecimento"
                description="Informações que os agentes usam para responder"
            >
                <Button variant="primary" size="sm">
                    <Plus className="h-4 w-4" />
                    Novo Tópico
                </Button>
            </Header>

            <PageWrapper>
                <PageSection>
                    {/* Lista de Tópicos */}
                    <div className="rounded-2xl border border-slate-100 bg-white">
                        <div className="border-b border-slate-100 px-6 py-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <span className="text-sm font-medium text-slate-900">
                                        {mockKnowledge.length} tópicos
                                    </span>
                                    <span className="text-sm text-slate-500">
                                        Arraste para ordenar por prioridade
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="divide-y divide-slate-100">
                            {mockKnowledge.map((item) => (
                                <div
                                    key={item.id}
                                    className="group flex items-start gap-4 p-6 transition-colors hover:bg-slate-50"
                                >
                                    {/* Drag Handle */}
                                    <button className="mt-1 cursor-grab text-slate-300 opacity-0 transition-opacity group-hover:opacity-100">
                                        <GripVertical className="h-5 w-5" />
                                    </button>

                                    {/* Icon */}
                                    <div
                                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${item.isActive
                                            ? 'bg-blue-100 text-blue-600'
                                            : 'bg-slate-100 text-slate-400'
                                            }`}
                                    >
                                        <BookOpen className="h-5 w-5" />
                                    </div>

                                    {/* Content */}
                                    <div className="min-w-0 flex-1">
                                        <div className="mb-1 flex items-center gap-2">
                                            <h3 className="font-medium text-slate-900">{item.topic}</h3>
                                            {!item.isActive && (
                                                <Badge variant="secondary">Inativo</Badge>
                                            )}
                                        </div>
                                        <p className="mb-2 text-sm text-slate-600 line-clamp-2">
                                            {item.content}
                                        </p>
                                        <div className="flex items-center gap-3 text-xs text-slate-400">
                                            <span>Prioridade: {item.priority}</span>
                                            <span>•</span>
                                            <span>{item.agentName}</span>
                                            <span>•</span>
                                            <span>
                                                Atualizado em{' '}
                                                {item.updatedAt.toLocaleDateString('pt-BR')}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                                        <Button variant="ghost" size="icon">
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon">
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </PageSection>
            </PageWrapper>
        </>
    );
}
