'use client';

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * STAGE CONFIG PANEL - Formulário de configuração do estágio
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useState, useEffect } from 'react';
import { Settings, X, Plus } from 'lucide-react';
import { Input, Label, Textarea, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Switch } from '@/components/ui';
import { type StageConfig, type StageType } from '@/db/schema';

interface StageConfigPanelProps {
    stage: StageConfig | null;
    onUpdate: (stage: StageConfig) => void;
}

const stageTypes: { value: StageType; label: string; description: string }[] = [
    { value: 'identify', label: 'Identificação', description: 'Coletar dados básicos do lead' },
    { value: 'diagnosis', label: 'Diagnóstico', description: 'Entender necessidades' },
    { value: 'schedule', label: 'Agendamento', description: 'Agendar reunião/call' },
    { value: 'handoff', label: 'Transbordo', description: 'Transferir para humano' },
    { value: 'custom', label: 'Personalizado', description: 'Estágio customizado' },
];

export function StageConfigPanel({ stage, onUpdate }: StageConfigPanelProps) {
    const [localStage, setLocalStage] = useState<StageConfig | null>(stage);
    const [newVariable, setNewVariable] = useState('');

    useEffect(() => {
        setLocalStage(stage);
    }, [stage]);

    if (!localStage) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="text-center">
                    <Settings className="h-12 w-12 mx-auto text-slate-200 mb-4" />
                    <p className="text-slate-500">Selecione um estágio para configurar</p>
                </div>
            </div>
        );
    }

    const handleChange = (field: keyof StageConfig, value: unknown) => {
        const updated = { ...localStage, [field]: value };
        setLocalStage(updated);
        onUpdate(updated);
    };

    const handleAddVariable = () => {
        if (!newVariable.trim()) return;

        const varName = newVariable.startsWith('data.') ? newVariable : `data.${newVariable}`;

        if (!localStage.requiredVariables.includes(varName)) {
            handleChange('requiredVariables', [...localStage.requiredVariables, varName]);
        }
        setNewVariable('');
    };

    const handleRemoveVariable = (varToRemove: string) => {
        handleChange('requiredVariables', localStage.requiredVariables.filter(v => v !== varToRemove));
    };

    const hasCalendarAction = localStage.actionConfig?.provider === 'google_calendar';

    return (
        <div className="h-full flex flex-col overflow-auto">
            <h3 className="font-semibold text-slate-900 mb-4">Configurar Estágio</h3>

            <div className="space-y-5">
                {/* Nome */}
                <div className="space-y-2">
                    <Label htmlFor="name">Nome do Estágio</Label>
                    <Input
                        id="name"
                        value={localStage.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        placeholder="Ex: Qualificação do Lead"
                    />
                </div>

                {/* Tipo */}
                <div className="space-y-2">
                    <Label>Tipo do Estágio</Label>
                    <Select
                        value={localStage.type}
                        onValueChange={(v) => handleChange('type', v as StageType)}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {stageTypes.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                    <div>
                                        <span className="font-medium">{type.label}</span>
                                        <span className="ml-2 text-slate-400">- {type.description}</span>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Descrição */}
                <div className="space-y-2">
                    <Label htmlFor="description">Descrição (opcional)</Label>
                    <Input
                        id="description"
                        value={localStage.description || ''}
                        onChange={(e) => handleChange('description', e.target.value)}
                        placeholder="Breve descrição do objetivo"
                    />
                </div>

                {/* Condições */}
                <div className="space-y-2">
                    <Label htmlFor="conditions">Condições de Entrada</Label>
                    <Textarea
                        id="conditions"
                        value={localStage.conditions}
                        onChange={(e) => handleChange('conditions', e.target.value)}
                        placeholder="Quando o agente deve entrar neste estágio?"
                        className="min-h-[80px]"
                    />
                </div>

                {/* Variáveis Obrigatórias */}
                <div className="space-y-2">
                    <Label>Variáveis Obrigatórias</Label>
                    <p className="text-xs text-slate-500">
                        O agente não avançará sem coletar estas informações.
                    </p>

                    {/* Variable Tags */}
                    <div className="flex flex-wrap gap-2 mb-2">
                        {localStage.requiredVariables.map((variable) => (
                            <span
                                key={variable}
                                className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-1 rounded-lg text-sm"
                            >
                                {variable}
                                <button
                                    onClick={() => handleRemoveVariable(variable)}
                                    className="hover:text-blue-900"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </span>
                        ))}
                    </div>

                    {/* Add Variable */}
                    <div className="flex gap-2">
                        <Input
                            value={newVariable}
                            onChange={(e) => setNewVariable(e.target.value)}
                            placeholder="Ex: nome, email, telefone"
                            onKeyDown={(e) => e.key === 'Enter' && handleAddVariable()}
                        />
                        <button
                            onClick={handleAddVariable}
                            className="px-3 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200"
                        >
                            <Plus className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {/* Prompt do Estágio */}
                <div className="space-y-2">
                    <Label htmlFor="prompt">Instruções do Estágio</Label>
                    <Textarea
                        id="prompt"
                        value={localStage.prompt}
                        onChange={(e) => handleChange('prompt', e.target.value)}
                        placeholder="Instruções específicas para este estágio..."
                        className="min-h-[120px] font-mono text-sm"
                    />
                </div>

                {/* Ação de Agendamento (se tipo = schedule) */}
                {localStage.type === 'schedule' && (
                    <div className="space-y-4 p-4 rounded-xl bg-violet-50 border border-violet-100">
                        <div className="flex items-center justify-between">
                            <Label>Configuração do Agendamento</Label>
                            <Switch
                                checked={hasCalendarAction}
                                onCheckedChange={(checked) => {
                                    if (checked) {
                                        handleChange('actionConfig', {
                                            provider: 'google_calendar',
                                            action: 'list_slots',
                                            settings: {
                                                duration: 30,
                                                searchWindowDays: 5,
                                                timeRangeStart: '09:00',
                                                timeRangeEnd: '18:00',
                                                excludeWeekends: true,
                                            },
                                        });
                                    } else {
                                        handleChange('actionConfig', undefined);
                                    }
                                }}
                            />
                        </div>

                        {hasCalendarAction && (
                            <>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <Label className="text-xs">Duração (min)</Label>
                                        <Input
                                            type="number"
                                            value={localStage.actionConfig?.settings.duration || 30}
                                            onChange={(e) => handleChange('actionConfig', {
                                                ...localStage.actionConfig,
                                                settings: {
                                                    ...localStage.actionConfig?.settings,
                                                    duration: parseInt(e.target.value),
                                                },
                                            })}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs">Janela (dias)</Label>
                                        <Input
                                            type="number"
                                            value={localStage.actionConfig?.settings.searchWindowDays || 5}
                                            onChange={(e) => handleChange('actionConfig', {
                                                ...localStage.actionConfig,
                                                settings: {
                                                    ...localStage.actionConfig?.settings,
                                                    searchWindowDays: parseInt(e.target.value),
                                                },
                                            })}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <Label className="text-xs">Início</Label>
                                        <Input
                                            type="time"
                                            value={localStage.actionConfig?.settings.timeRangeStart || '09:00'}
                                            onChange={(e) => handleChange('actionConfig', {
                                                ...localStage.actionConfig,
                                                settings: {
                                                    ...localStage.actionConfig?.settings,
                                                    timeRangeStart: e.target.value,
                                                },
                                            })}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs">Fim</Label>
                                        <Input
                                            type="time"
                                            value={localStage.actionConfig?.settings.timeRangeEnd || '18:00'}
                                            onChange={(e) => handleChange('actionConfig', {
                                                ...localStage.actionConfig,
                                                settings: {
                                                    ...localStage.actionConfig?.settings,
                                                    timeRangeEnd: e.target.value,
                                                },
                                            })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-xs">Ajuste de Preferência</Label>
                                    <Input
                                        value={localStage.actionConfig?.settings.promptAdjustment || ''}
                                        onChange={(e) => handleChange('actionConfig', {
                                            ...localStage.actionConfig,
                                            settings: {
                                                ...localStage.actionConfig?.settings,
                                                promptAdjustment: e.target.value,
                                            },
                                        })}
                                        placeholder="Ex: Priorize manhãs"
                                    />
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
