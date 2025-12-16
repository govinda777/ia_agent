'use client';

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * AGENT BUILDER - Layout de 3 Colunas (Zaia-Style)
 * ─────────────────────────────────────────────────────────────────────────────
 * 
 * Estrutura:
 * - Sidebar (Esquerda): Navegação de módulos
 * - Builder Canvas (Centro): Configuração dinâmica
 * - Preview & Debug (Direita): Chat + Inspector
 */

import { useState } from 'react';
import Link from 'next/link';
import {
    ArrowLeft,
    Layers,
    Brain,
    Palette,
    Plug,
    Eye,
    Save,
    Play,
    RotateCcw,
    ChevronRight,
    Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui';
import { StageList } from '@/components/agent-builder/StageList';
import { StageConfigPanel } from '@/components/agent-builder/StageConfigPanel';
import { ChatPreview } from '@/components/agent-builder/ChatPreview';
import { VariableInspector } from '@/components/agent-builder/VariableInspector';
import { PersonalityEditor } from '@/components/agent-builder/PersonalityEditor';
import { WorkingHoursEditor } from '@/components/agent-builder/WorkingHoursEditor';
import { createDefaultWorkflow } from '@/lib/engine/state-machine';
import { type StageConfig } from '@/db/schema';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

type Module = 'stages' | 'brain' | 'visual' | 'integrations';

interface MockAgent {
    id: string;
    name: string;
    description: string;
    companyProfile: string;
    workflowConfig: StageConfig[];
}

// ─────────────────────────────────────────────────────────────────────────────
// MOCK DATA
// ─────────────────────────────────────────────────────────────────────────────

const mockAgent: MockAgent = {
    id: '1',
    name: 'Assistente Principal',
    description: 'Agente principal para atendimento de leads',
    companyProfile: `Somos a Casal do Tráfego, especialistas em marketing digital e tráfego pago.

Nossos serviços:
- Gestão de tráfego pago (Meta Ads, Google Ads)
- Consultoria de marketing digital
- Cursos e mentorias

Horário de atendimento: Seg-Sex, 9h-18h
Valores: A partir de R$ 997/mês`,
    workflowConfig: createDefaultWorkflow(),
};

// ─────────────────────────────────────────────────────────────────────────────
// NAVIGATION MODULES
// ─────────────────────────────────────────────────────────────────────────────

const modules: { id: Module; name: string; icon: typeof Layers; description: string }[] = [
    {
        id: 'stages',
        name: 'Estágios',
        icon: Layers,
        description: 'Configure o fluxo de atendimento'
    },
    {
        id: 'brain',
        name: 'Cérebro',
        icon: Brain,
        description: 'Perfil da empresa e conhecimento'
    },
    {
        id: 'visual',
        name: 'Visual',
        icon: Palette,
        description: 'Personalização de respostas'
    },
    {
        id: 'integrations',
        name: 'Integrações',
        icon: Plug,
        description: 'Conecte serviços externos'
    },
];

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function AgentBuilderPage() {
    const [activeModule, setActiveModule] = useState<Module>('stages');
    const [selectedStageId, setSelectedStageId] = useState<string | null>(null);
    const [stages, setStages] = useState<StageConfig[]>(mockAgent.workflowConfig);
    const [previewTab, setPreviewTab] = useState<'chat' | 'inspect'>('chat');

    // Estado do chat de preview
    const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
    const [sessionVariables, setSessionVariables] = useState<Record<string, unknown>>({});
    const [currentStageId, setCurrentStageId] = useState<string>('stage_identify');

    const selectedStage = stages.find(s => s.id === selectedStageId) || null;

    const handleStageSelect = (stageId: string) => {
        setSelectedStageId(stageId);
    };

    const handleStageUpdate = (updatedStage: StageConfig) => {
        setStages(prev => prev.map(s => s.id === updatedStage.id ? updatedStage : s));
    };

    const handleResetChat = () => {
        setChatMessages([]);
        setSessionVariables({});
        setCurrentStageId('stage_identify');
    };

    return (
        <div className="flex h-screen bg-slate-50">
            {/* ─────────────────────────────────────────────────────────────────── */}
            {/* SIDEBAR - Navegação de Módulos */}
            {/* ─────────────────────────────────────────────────────────────────── */}
            <aside className="w-64 flex-shrink-0 border-r border-slate-200 bg-white">
                {/* Header */}
                <div className="flex h-16 items-center justify-between border-b border-slate-100 px-4">
                    <Link
                        href="/dashboard/agents"
                        className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Voltar
                    </Link>
                    <Button variant="primary" size="sm">
                        <Save className="h-4 w-4" />
                        Salvar
                    </Button>
                </div>

                {/* Agent Info */}
                <div className="border-b border-slate-100 p-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-500">
                            <Sparkles className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h2 className="font-semibold text-slate-900">{mockAgent.name}</h2>
                            <p className="text-xs text-slate-500">{stages.length} estágios</p>
                        </div>
                    </div>
                </div>

                {/* Module Navigation */}
                <nav className="p-3 space-y-1">
                    {modules.map((module) => {
                        const isActive = activeModule === module.id;
                        return (
                            <button
                                key={module.id}
                                onClick={() => setActiveModule(module.id)}
                                className={`w-full flex items-center gap-3 rounded-xl px-3 py-3 text-left transition-all ${isActive
                                    ? 'bg-blue-50 text-blue-700'
                                    : 'text-slate-600 hover:bg-slate-50'
                                    }`}
                            >
                                <module.icon className={`h-5 w-5 ${isActive ? 'text-blue-500' : 'text-slate-400'}`} />
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium">{module.name}</p>
                                    <p className="text-xs text-slate-400 truncate">{module.description}</p>
                                </div>
                                {isActive && <ChevronRight className="h-4 w-4 text-blue-400" />}
                            </button>
                        );
                    })}
                </nav>
            </aside>

            {/* ─────────────────────────────────────────────────────────────────── */}
            {/* BUILDER CANVAS - Área Principal */}
            {/* ─────────────────────────────────────────────────────────────────── */}
            <main className="flex-1 flex flex-col overflow-hidden">
                {/* Canvas Header */}
                <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-6">
                    <h1 className="font-semibold text-slate-900">
                        {modules.find(m => m.id === activeModule)?.name}
                    </h1>
                </header>

                {/* Canvas Content */}
                <div className="flex-1 overflow-auto p-6">
                    {activeModule === 'stages' && (
                        <div className="grid grid-cols-2 gap-6 h-full">
                            {/* Stage List */}
                            <div className="rounded-2xl border border-slate-200 bg-white p-4 overflow-auto">
                                <StageList
                                    stages={stages}
                                    selectedStageId={selectedStageId}
                                    onStageSelect={handleStageSelect}
                                    onStagesChange={setStages}
                                />
                            </div>

                            {/* Stage Config */}
                            <div className="rounded-2xl border border-slate-200 bg-white p-4 overflow-auto">
                                <StageConfigPanel
                                    stage={selectedStage}
                                    onUpdate={handleStageUpdate}
                                />
                            </div>
                        </div>
                    )}

                    {activeModule === 'brain' && (
                        <div className="rounded-2xl border border-slate-200 bg-white p-6">
                            <h2 className="text-lg font-semibold text-slate-900 mb-4">Perfil da Empresa</h2>
                            <p className="text-sm text-slate-500 mb-4">
                                Contexto global que será injetado em todas as conversas.
                            </p>
                            <textarea
                                className="w-full h-64 rounded-xl border border-slate-200 p-4 text-sm resize-none focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                placeholder="Descreva sua empresa, produtos, serviços, horários..."
                                defaultValue={mockAgent.companyProfile}
                            />
                        </div>
                    )}

                    {activeModule === 'visual' && (
                        <div className="space-y-6">
                            <PersonalityEditor
                                agentId={mockAgent.id}
                                initialSettings={{
                                    displayName: mockAgent.name,
                                    personality: 'Sou um assistente amigável e prestativo.',
                                    tone: 'friendly',
                                    useEmojis: true,
                                    language: 'pt-BR',
                                }}
                            />
                            <WorkingHoursEditor
                                agentId={mockAgent.id}
                                initialConfig={{
                                    enabled: true,
                                    timezone: 'America/Sao_Paulo',
                                    days: [1, 2, 3, 4, 5],
                                    start: '09:00',
                                    end: '18:00',
                                    outsideMessage: 'Estamos fora do horário de atendimento. Retornaremos em breve!'
                                }}
                            />
                        </div>
                    )}

                    {activeModule === 'integrations' && (
                        <div className="rounded-2xl border border-slate-200 bg-white p-6">
                            <h2 className="text-lg font-semibold text-slate-900 mb-4">Integrações</h2>
                            <p className="text-sm text-slate-500">
                                Configure Google Calendar, Sheets e WhatsApp.
                            </p>
                        </div>
                    )}
                </div>
            </main>

            {/* ─────────────────────────────────────────────────────────────────── */}
            {/* PREVIEW & DEBUG - Painel Direito */}
            {/* ─────────────────────────────────────────────────────────────────── */}
            <aside className="w-96 flex-shrink-0 border-l border-slate-200 bg-white flex flex-col">
                {/* Preview Header */}
                <div className="flex h-14 items-center justify-between border-b border-slate-100 px-4">
                    <div className="flex gap-1">
                        <button
                            onClick={() => setPreviewTab('chat')}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${previewTab === 'chat'
                                ? 'bg-slate-100 text-slate-900'
                                : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            <Play className="h-4 w-4 inline mr-1" />
                            Testar
                        </button>
                        <button
                            onClick={() => setPreviewTab('inspect')}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${previewTab === 'inspect'
                                ? 'bg-slate-100 text-slate-900'
                                : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            <Eye className="h-4 w-4 inline mr-1" />
                            Inspecionar
                        </button>
                    </div>
                    <button

                        onClick={handleResetChat}
                        className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                        title="Resetar conversa"
                    >
                        <RotateCcw className="h-4 w-4" />
                    </button>
                </div>

                {/* Preview Content */}
                <div className="flex-1 overflow-hidden">
                    {previewTab === 'chat' ? (
                        <ChatPreview
                            agentName={mockAgent.name}
                            messages={chatMessages}
                            onMessagesChange={setChatMessages}
                            stages={stages}
                            currentStageId={currentStageId}
                            onStageChange={setCurrentStageId}
                            variables={sessionVariables}
                            onVariablesChange={setSessionVariables}
                        />
                    ) : (
                        <VariableInspector
                            stages={stages}
                            currentStageId={currentStageId}
                            variables={sessionVariables}
                        />
                    )}
                </div>
            </aside>
        </div>
    );
}
