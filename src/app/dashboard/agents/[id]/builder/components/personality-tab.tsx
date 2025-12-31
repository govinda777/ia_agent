'use client';

import { useBuilderStore } from '@/stores/builder-store';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { updateAgentAction } from '@/server/actions/agents';
import { useState } from 'react';
import { Loader2, Save, CheckCircle2, Cpu, AlertTriangle } from 'lucide-react';
import { AGENT_TYPES, getAgentPromptTemplate, type AgentType } from '@/lib/agent-prompts';

// LLM Provider and Model configurations
const LLM_PROVIDERS = {
    openai: {
        name: 'OpenAI',
        icon: '🤖',
        models: [
            { id: 'gpt-4o', name: 'GPT-4o (Smarter)' },
            { id: 'gpt-4o-mini', name: 'GPT-4o Mini (Fast and economical)' },
            { id: 'gpt-4-turbo', name: 'GPT-4 Turbo (Long context)' },
        ],
        envVar: 'OPENAI_API_KEY'
    },
    google: {
        name: 'Google Gemini',
        icon: '✨',
        models: [
            { id: 'gemini-2.5-pro-preview-06-05', name: 'Gemini 2.5 Pro (Latest)' },
            { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash (Fast)' },
            { id: 'gemini-exp-1206', name: 'Gemini 3.0 Experimental' },
        ],
        envVar: 'GOOGLE_GENERATIVE_AI_API_KEY'
    },
    anthropic: {
        name: 'Anthropic Claude',
        icon: '🧠',
        models: [
            { id: 'claude-sonnet-4-20250514', name: 'Claude 4.5 Sonnet (Latest)' },
            { id: 'claude-opus-4-20250514', name: 'Claude 4.5 Opus (Most powerful)' },
            { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet (Stable)' },
            { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku (Fastest)' },
        ],
        envVar: 'ANTHROPIC_API_KEY'
    }
};

export function PersonalityTab() {
    const { agent, updateAgent } = useBuilderStore();
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    // State for agent type change confirmation
    const [showTypeChangeDialog, setShowTypeChangeDialog] = useState(false);
    const [pendingTypeChange, setPendingTypeChange] = useState<AgentType | null>(null);

    if (!agent) return null;

    const hasInitialType = agent?.personality && agent.personality !== 'custom';

    // Extract provider and model from modelConfig
    const currentProvider = (agent.modelConfig as { provider: string })?.provider || 'openai';
    const currentModel = (agent.modelConfig as { model: string })?.model || 'gpt-4o-mini';

    function handleProviderChange(provider: string) {
        const providerConfig = LLM_PROVIDERS[provider as keyof typeof LLM_PROVIDERS];
        const defaultModel = providerConfig.models[0].id;
        updateAgent({
            modelConfig: {
                ...agent.modelConfig,
                provider,
                model: defaultModel,
            }
        });
    }

    function handleModelChange(model: string) {
        updateAgent({
            modelConfig: {
                ...agent.modelConfig,
                model,
            }
        });
    }

    // Handle agent type change with confirmation
    function handleAgentTypeChange(newType: string) {
        const agentType = newType as AgentType;

        // If already has a type and trying to change, show confirmation
        if (hasInitialType && agent.personality !== 'custom' && newType !== agent.personality) {
            setPendingTypeChange(agentType);
            setShowTypeChangeDialog(true);
            return;
        }

        applyAgentTypeChange(agentType);
    }

    function applyAgentTypeChange(agentType: AgentType) {
        const promptTemplate = getAgentPromptTemplate(agentType);

        updateAgent({
            personality: agentType,
            // Only update prompt if template exists and prompt is empty or user confirms
            ...(promptTemplate && (!agent.systemPrompt || agent.systemPrompt.length < 100) ? {
                systemPrompt: promptTemplate
            } : {})
        });

        setShowTypeChangeDialog(false);
        setPendingTypeChange(null);
    }

    function confirmTypeChangeWithPrompt() {
        if (pendingTypeChange) {
            const promptTemplate = getAgentPromptTemplate(pendingTypeChange);
            updateAgent({
                personality: pendingTypeChange,
                systemPrompt: promptTemplate
            });
            setShowTypeChangeDialog(false);
            setPendingTypeChange(null);
        }
    }

    async function handleSave() {
        setIsSaving(true);
        setSaveSuccess(false);
        const result = await updateAgentAction(agent!.id, {
            name: agent!.name,
            description: agent!.description,
            systemPrompt: agent!.systemPrompt,
            tone: agent!.tone,
            personality: agent!.personality,
            companyProfile: agent!.companyProfile,
            displayName: agent!.displayName,
            useEmojis: agent!.useEmojis,
            language: agent!.language,
            modelConfig: agent!.modelConfig,
            isActive: agent!.isActive
        });
        setIsSaving(false);
        if (result.success) {
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        }
    }

    const selectedProvider = LLM_PROVIDERS[currentProvider as keyof typeof LLM_PROVIDERS] || LLM_PROVIDERS.openai;

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            {/* Success Banner */}
            {saveSuccess && (
                <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5" />
                    <span>Changes saved successfully!</span>
                </div>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Agent Identity</CardTitle>
                    <CardDescription>Define how your agent introduces itself to users.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Internal Name</Label>
                            <Input
                                value={agent.name}
                                onChange={(e) => updateAgent({ name: e.target.value })}
                                placeholder="Name for internal identification"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Display Name (Chat)</Label>
                            <Input
                                value={agent.displayName || ''}
                                onChange={(e) => updateAgent({ displayName: e.target.value })}
                                placeholder="How the agent introduces itself in the chat"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Service Type</Label>
                        <Select
                            value={agent.personality || 'custom'}
                            onValueChange={handleAgentTypeChange}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Choose the agent type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="vendas">
                                    <div className="flex flex-col">
                                        <span>💼 Sales Agent (Closer)</span>
                                        <span className="text-xs text-muted-foreground">High-performance consultative seller</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="sdr">
                                    <div className="flex flex-col">
                                        <span>🎯 SDR Lead Qualifier</span>
                                        <span className="text-xs text-muted-foreground">Strategic qualification for high-ticket sales</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="low_ticket">
                                    <div className="flex flex-col">
                                        <span>⚡ Low Ticket Sales</span>
                                        <span className="text-xs text-muted-foreground">Fast and direct sales</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="secretaria">
                                    <div className="flex flex-col">
                                        <span>📅 Secretary + Scheduling</span>
                                        <span className="text-xs text-muted-foreground">SDR + Secretary with demonstration</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="custom">
                                    <div className="flex flex-col">
                                        <span>⚙️ Custom</span>
                                        <span className="text-xs text-muted-foreground">Create your own prompt</span>
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                        {agent.personality && agent.personality !== 'custom' && (
                            <p className="text-xs text-muted-foreground">
                                💡 The pre-configured prompt has been loaded. Customize the fields marked with [FILL].
                            </p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Tone of Voice</Label>
                            <Select
                                value={agent.tone || 'friendly'}
                                onValueChange={(v) => updateAgent({ tone: v })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="friendly">Friendly 😊</SelectItem>
                                    <SelectItem value="professional">Professional 👔</SelectItem>
                                    <SelectItem value="enthusiastic">Enthusiastic 🤩</SelectItem>
                                    <SelectItem value="serious">Serious 😐</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Language</Label>
                            <Select
                                value={agent.language || 'pt-BR'}
                                onValueChange={(v) => updateAgent({ language: v })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="pt-BR">🇧🇷 Portuguese (Brazil)</SelectItem>
                                    <SelectItem value="en-US">🇺🇸 English (US)</SelectItem>
                                    <SelectItem value="es-ES">🇪🇸 Spanish</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="flex items-center justify-between border p-4 rounded-lg">
                        <div className="space-y-0.5">
                            <Label>Use Emojis</Label>
                            <p className="text-sm text-muted-foreground">Allow the use of emojis in responses.</p>
                        </div>
                        <Switch
                            checked={agent.useEmojis ?? true}
                            onCheckedChange={(c) => updateAgent({ useEmojis: c })}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Internal Description</Label>
                        <Textarea
                            value={agent.description || ''}
                            onChange={(e) => updateAgent({ description: e.target.value })}
                            placeholder="What is this agent for? (does not appear in chat)"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* LLM Selection Card */}
            <Card className="border-2 border-primary/20">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Cpu className="h-5 w-5" />
                        AI Model (LLM)
                    </CardTitle>
                    <CardDescription>
                        Choose the AI provider and model that the agent will use to generate responses.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Provider</Label>
                            <Select value={currentProvider} onValueChange={handleProviderChange}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="openai">🤖 OpenAI</SelectItem>
                                    <SelectItem value="google">✨ Google Gemini</SelectItem>
                                    <SelectItem value="anthropic">🧠 Anthropic Claude</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Model</Label>
                            <Select value={currentModel} onValueChange={handleModelChange}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {selectedProvider.models.map((model) => (
                                        <SelectItem key={model.id} value={model.id}>
                                            {model.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg text-sm">
                        <p className="text-muted-foreground">
                            <strong>Environment variable:</strong>{' '}
                            <code className="bg-slate-200 dark:bg-slate-700 px-1 rounded">
                                {selectedProvider.envVar}
                            </code>
                        </p>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Company Context</CardTitle>
                    <CardDescription>Information about your company that the agent will use.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Company Profile</Label>
                        <Textarea
                            className="min-h-[120px]"
                            value={agent.companyProfile || ''}
                            onChange={(e) => updateAgent({ companyProfile: e.target.value })}
                            placeholder="Describe your company, products/services, differentiators, etc."
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Behavior (Prompt)</CardTitle>
                    <CardDescription>Global instructions that the agent must always follow.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Global System Prompt</Label>
                        <Textarea
                            className="min-h-[200px] font-mono text-sm"
                            value={agent.systemPrompt}
                            onChange={(e) => updateAgent({ systemPrompt: e.target.value })}
                        />
                        <p className="text-xs text-muted-foreground">
                            This prompt will be combined with the specific instructions of each stage.
                        </p>
                    </div>

                    <div className="flex items-center justify-between border p-4 rounded-lg bg-slate-50 dark:bg-slate-900">
                        <div className="space-y-0.5">
                            <Label>Active Agent</Label>
                            <p className="text-sm text-muted-foreground">Disable to prevent new interactions.</p>
                        </div>
                        <Switch
                            checked={agent.isActive}
                            onCheckedChange={(c) => updateAgent({ isActive: c })}
                        />
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button onClick={handleSave} disabled={isSaving} size="lg">
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save Changes
                </Button>
            </div>

            {/* Dialog de confirmação para mudança de tipo */}
            <Dialog open={showTypeChangeDialog} onOpenChange={setShowTypeChangeDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-amber-500" />
                            Confirm Type Change
                        </DialogTitle>
                        <DialogDescription>
                            You already have an agent type configured. By changing to
                            <strong> {pendingTypeChange && AGENT_TYPES[pendingTypeChange]?.label}</strong>,
                            the current System Prompt will be replaced with the pre-configured template.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg text-sm text-amber-800">
                        <p><strong>⚠️ Attention:</strong> This action will overwrite your current prompt.</p>
                        <p className="mt-1">You can choose to keep your prompt and just change the type.</p>
                    </div>
                    <DialogFooter className="flex gap-2 sm:gap-0">
                        <Button
                            variant="outline"
                            onClick={() => {
                                if (pendingTypeChange) {
                                    updateAgent({ personality: pendingTypeChange });
                                }
                                setShowTypeChangeDialog(false);
                                setPendingTypeChange(null);
                            }}
                        >
                            Keep My Prompt
                        </Button>
                        <Button onClick={confirmTypeChangeWithPrompt}>
                            Use New Template
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
