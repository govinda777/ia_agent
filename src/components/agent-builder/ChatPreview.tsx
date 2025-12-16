'use client';

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * CHAT PREVIEW - Chat de teste do agente
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Bot, User } from 'lucide-react';
import { type StageConfig } from '@/db/schema';

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

interface ChatPreviewProps {
    agentName: string;
    messages: ChatMessage[];
    onMessagesChange: (messages: ChatMessage[]) => void;
    stages: StageConfig[];
    currentStageId: string;
    onStageChange: (stageId: string) => void;
    variables: Record<string, unknown>;
    onVariablesChange: (variables: Record<string, unknown>) => void;
}

export function ChatPreview({
    agentName,
    messages,
    onMessagesChange,
    stages,
    currentStageId,
    onStageChange,
    variables,
    onVariablesChange,
}: ChatPreviewProps) {
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const currentStage = stages.find(s => s.id === currentStageId);

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: ChatMessage = { role: 'user', content: input.trim() };
        onMessagesChange([...messages, userMessage]);
        setInput('');
        setIsLoading(true);

        // Simular resposta do agente (em produção, chamaria a API real)
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));

        // Simular extração de variáveis
        const extractedVars = simulateVariableExtraction(input, currentStage?.requiredVariables || []);
        const newVariables = { ...variables, ...extractedVars };
        onVariablesChange(newVariables);

        // Simular resposta baseada no estágio
        const assistantMessage: ChatMessage = {
            role: 'assistant',
            content: generateMockResponse(currentStage, newVariables, messages.length),
        };

        onMessagesChange([...messages, userMessage, assistantMessage]);

        // Verificar transição de estágio
        if (currentStage && shouldTransition(currentStage, newVariables)) {
            if (currentStage.nextStageId) {
                onStageChange(currentStage.nextStageId);
            }
        }

        setIsLoading(false);
    };

    return (
        <div className="h-full flex flex-col">
            {/* Stage Indicator */}
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Bot className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium text-slate-700">{agentName}</span>
                </div>
                <p className="text-xs text-slate-500">
                    Estágio: <span className="font-medium text-slate-900">{currentStage?.name || 'N/A'}</span>
                </p>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-auto p-4 space-y-4">
                {messages.length === 0 && (
                    <div className="h-full flex items-center justify-center">
                        <div className="text-center text-slate-400">
                            <Bot className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">Envie uma mensagem para testar o agente</p>
                        </div>
                    </div>
                )}

                {messages.map((message, index) => (
                    <div
                        key={index}
                        className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                    >
                        <div
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${message.role === 'user'
                                ? 'bg-blue-500'
                                : 'bg-gradient-to-br from-blue-500 to-violet-500'
                                }`}
                        >
                            {message.role === 'user' ? (
                                <User className="h-4 w-4 text-white" />
                            ) : (
                                <Bot className="h-4 w-4 text-white" />
                            )}
                        </div>
                        <div
                            className={`max-w-[80%] rounded-2xl px-4 py-2 ${message.role === 'user'
                                ? 'bg-blue-500 text-white'
                                : 'bg-slate-100 text-slate-800'
                                }`}
                        >
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        </div>
                    </div>
                ))}

                {isLoading && (
                    <div className="flex gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-500">
                            <Bot className="h-4 w-4 text-white" />
                        </div>
                        <div className="bg-slate-100 rounded-2xl px-4 py-2">
                            <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-slate-100">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Digite uma mensagem..."
                        className="flex-1 rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                        disabled={isLoading}
                    />
                    <button
                        onClick={handleSendMessage}
                        disabled={!input.trim() || isLoading}
                        className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500 text-white disabled:opacity-50 hover:bg-blue-600 transition-colors"
                    >
                        <Send className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER FUNCTIONS (Simulação para preview)
// ─────────────────────────────────────────────────────────────────────────────

function simulateVariableExtraction(
    message: string,
    requiredVars: string[]
): Record<string, unknown> {
    const extracted: Record<string, unknown> = {};

    // Simular extração de nome
    const nameMatch = message.match(/(?:sou|chamo|nome é)\s+([A-ZÀ-Ú][a-zà-ú]+(?:\s+[A-ZÀ-Ú][a-zà-ú]+)*)/i);
    if (nameMatch && requiredVars.includes('data.nome')) {
        extracted['data.nome'] = nameMatch[1];
    }

    // Simular extração de email
    const emailMatch = message.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    if (emailMatch && requiredVars.includes('data.email')) {
        extracted['data.email'] = emailMatch[1];
    }

    // Simular extração de interesse
    if (message.toLowerCase().includes('curso') || message.toLowerCase().includes('mentoria')) {
        if (requiredVars.includes('data.interesse')) {
            extracted['data.interesse'] = message.toLowerCase().includes('curso') ? 'Curso' : 'Mentoria';
        }
    }

    return extracted;
}

function shouldTransition(stage: StageConfig, variables: Record<string, unknown>): boolean {
    return stage.requiredVariables.every(v => variables[v] !== undefined && variables[v] !== '');
}

function generateMockResponse(
    stage: StageConfig | undefined,
    variables: Record<string, unknown>,
    _messageCount: number
): string {
    if (!stage) {
        return 'Olá! Como posso ajudá-lo hoje?';
    }

    const name = variables['data.nome'] as string || '';

    switch (stage.type) {
        case 'identify':
            if (!name) {
                return 'Olá! Seja bem-vindo! 👋\n\nPara começarmos, qual é o seu nome?';
            }
            return `Prazer, ${name}! Para entender melhor como posso ajudá-lo, qual é o seu interesse principal?`;

        case 'diagnosis':
            if (!variables['data.email']) {
                return `Entendi, ${name}! Parece muito interessante.\n\nPara eu te enviar mais informações, qual é o seu e-mail?`;
            }
            return `Perfeito, ${name}! Já tenho suas informações.\n\nQue tal agendarmos uma call para conversarmos melhor sobre suas necessidades?`;

        case 'schedule':
            return `Ótimo, ${name}! Tenho os seguintes horários disponíveis:\n\n📅 Amanhã às 10h\n📅 Amanhã às 14h\n📅 Quarta às 9h\n\nQual prefere?`;

        default:
            return 'Como posso ajudá-lo?';
    }
}
