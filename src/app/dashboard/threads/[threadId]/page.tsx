'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Header, PageWrapper } from '@/components/layout';
import { Button, Card, CardContent, CardHeader, CardTitle, Badge, Avatar, AvatarFallback } from '@/components/ui';
import { TakeoverControl, TakeoverBadge } from '@/components/takeover';
import {
    ArrowLeft,
    Send,
    Phone,
    Mail,
    Calendar,
    User,
    MessageSquare,
    CheckCircle,
} from 'lucide-react';

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * THREAD DETAIL PAGE - Conversa individual com controle Takeover
 * ─────────────────────────────────────────────────────────────────────────────
 */

// Mock data
const mockThread = {
    id: '1',
    contactName: 'João Silva',
    contactPhone: '+55 11 99999-1234',
    contactEmail: 'joao.silva@email.com',
    status: 'active' as const,
    isHumanTakeover: false,
    takeoverReason: null,
    messageCount: 12,
    currentStage: 'Qualificação',
    firstInteractionAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
    lastInteractionAt: new Date(Date.now() - 1000 * 60 * 5),
    variables: {
        'data.nome': 'João Silva',
        'data.interesse': 'Curso de Tráfego Pago',
        'data.orcamento': 'R$ 1.500',
    },
};

const mockMessages = [
    { id: '1', role: 'user' as const, content: 'Olá, gostaria de saber mais sobre os cursos de vocês', createdAt: new Date(Date.now() - 1000 * 60 * 60) },
    { id: '2', role: 'assistant' as const, content: 'Olá João! 👋 Que bom ter você aqui! Temos vários cursos de marketing digital e tráfego pago. Qual área te interessa mais?', createdAt: new Date(Date.now() - 1000 * 60 * 55) },
    { id: '3', role: 'user' as const, content: 'Estou interessado no curso de tráfego pago pra e-commerce', createdAt: new Date(Date.now() - 1000 * 60 * 50) },
    { id: '4', role: 'assistant' as const, content: 'Ótima escolha! Nosso curso de Tráfego para E-commerce é um dos mais procurados. Ele cobre Meta Ads, Google Ads e estratégias específicas para lojas virtuais. Qual seria seu orçamento aproximado para investir no curso?', createdAt: new Date(Date.now() - 1000 * 60 * 45) },
    { id: '5', role: 'user' as const, content: 'Posso investir até R$ 1.500', createdAt: new Date(Date.now() - 1000 * 60 * 40) },
    { id: '6', role: 'assistant' as const, content: 'Perfeito! Com esse orçamento, você pode acessar nosso pacote completo que inclui mentoria. Gostaria de agendar uma call para conhecer melhor o programa?', createdAt: new Date(Date.now() - 1000 * 60 * 35) },
];

const statusConfig: Record<string, { label: string; variant: 'active' | 'pending' | 'qualified' | 'booked' | 'archived' }> = {
    active: { label: 'Ativo', variant: 'active' },
    pending: { label: 'Aguardando', variant: 'pending' },
    qualified: { label: 'Qualificado', variant: 'qualified' },
    booked: { label: 'Agendado', variant: 'booked' },
    archived: { label: 'Arquivado', variant: 'archived' },
};

export default function ThreadDetailPage() {
    const params = useParams();
    const threadId = params.threadId as string;

    const [isHumanTakeover, setIsHumanTakeover] = useState(mockThread.isHumanTakeover);
    const [newMessage, setNewMessage] = useState('');
    const [messages, setMessages] = useState(mockMessages);

    const handleSendMessage = () => {
        if (!newMessage.trim()) return;

        setMessages(prev => [...prev, {
            id: String(prev.length + 1),
            role: isHumanTakeover ? 'assistant' : 'user',
            content: newMessage,
            createdAt: new Date(),
        }]);
        setNewMessage('');
    };

    return (
        <>
            <Header title="Conversa" description={mockThread.contactName}>
                <div className="flex items-center gap-2">
                    <Link href="/dashboard/threads">
                        <Button variant="ghost" size="sm">
                            <ArrowLeft className="h-4 w-4" />
                            Voltar
                        </Button>
                    </Link>
                    <Badge variant={statusConfig[mockThread.status]?.variant || 'default'}>
                        {statusConfig[mockThread.status]?.label || mockThread.status}
                    </Badge>
                    <TakeoverBadge isHumanTakeover={isHumanTakeover} />
                </div>
            </Header>

            <PageWrapper>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
                    {/* Coluna 1: Chat */}
                    <div className="lg:col-span-2 flex flex-col rounded-2xl border border-slate-200 bg-white overflow-hidden">
                        {/* Messages */}
                        <div className="flex-1 overflow-auto p-4 space-y-4">
                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[80%] rounded-2xl px-4 py-2 ${msg.role === 'user'
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-slate-100 text-slate-900'
                                            }`}
                                    >
                                        <p className="text-sm">{msg.content}</p>
                                        <p className={`text-xs mt-1 ${msg.role === 'user' ? 'text-blue-100' : 'text-slate-400'}`}>
                                            {msg.createdAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Input */}
                        <div className="border-t border-slate-200 p-4">
                            {isHumanTakeover ? (
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                        placeholder="Digite sua mensagem (você está no controle)..."
                                        className="flex-1 rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                    />
                                    <Button variant="primary" onClick={handleSendMessage}>
                                        <Send className="h-4 w-4" />
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center py-2 text-sm text-slate-500 bg-slate-50 rounded-xl">
                                    <MessageSquare className="h-4 w-4 mr-2" />
                                    O agente está respondendo automaticamente
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Coluna 2: Info do Lead + Takeover */}
                    <div className="space-y-4">
                        {/* Takeover Control */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Controle da Conversa</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <TakeoverControl
                                    threadId={threadId}
                                    userId="default-user"
                                    isHumanTakeover={isHumanTakeover}
                                    onStatusChange={setIsHumanTakeover}
                                />
                            </CardContent>
                        </Card>

                        {/* Lead Info */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Informações do Lead</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-12 w-12">
                                        <AvatarFallback>
                                            {mockThread.contactName.split(' ').map(n => n[0]).join('')}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-medium text-slate-900">{mockThread.contactName}</p>
                                        <p className="text-sm text-slate-500">{mockThread.currentStage}</p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-sm text-slate-600">
                                        <Phone className="h-4 w-4 text-slate-400" />
                                        {mockThread.contactPhone}
                                    </div>
                                    {mockThread.contactEmail && (
                                        <div className="flex items-center gap-2 text-sm text-slate-600">
                                            <Mail className="h-4 w-4 text-slate-400" />
                                            {mockThread.contactEmail}
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2 text-sm text-slate-600">
                                        <MessageSquare className="h-4 w-4 text-slate-400" />
                                        {mockThread.messageCount} mensagens
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Variables */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Variáveis Coletadas</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {Object.entries(mockThread.variables).map(([key, value]) => (
                                        <div key={key} className="flex items-center justify-between text-sm">
                                            <span className="text-slate-500">{key}</span>
                                            <span className="font-medium text-slate-900 flex items-center gap-1">
                                                <CheckCircle className="h-3 w-3 text-green-500" />
                                                {value}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Quick Actions */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Ações Rápidas</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <Button variant="outline" size="sm" className="w-full justify-start">
                                    <Calendar className="h-4 w-4" />
                                    Agendar Reunião
                                </Button>
                                <Button variant="outline" size="sm" className="w-full justify-start">
                                    <User className="h-4 w-4" />
                                    Criar Lead no CRM
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </PageWrapper>
        </>
    );
}
