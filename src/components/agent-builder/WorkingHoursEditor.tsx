'use client';

import { useState, useTransition } from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from '@/components/ui';
import { Clock, Save, CheckCircle } from 'lucide-react';
import { saveWorkingHours } from '@/app/actions/agent';
import type { WorkingHoursConfig } from '@/db/schema';

interface WorkingHoursEditorProps {
    agentId: string;
    initialConfig: WorkingHoursConfig;
}

const DAYS_OF_WEEK = [
    { value: 0, label: 'Dom', fullLabel: 'Domingo' },
    { value: 1, label: 'Seg', fullLabel: 'Segunda' },
    { value: 2, label: 'Ter', fullLabel: 'Terça' },
    { value: 3, label: 'Qua', fullLabel: 'Quarta' },
    { value: 4, label: 'Qui', fullLabel: 'Quinta' },
    { value: 5, label: 'Sex', fullLabel: 'Sexta' },
    { value: 6, label: 'Sáb', fullLabel: 'Sábado' },
];

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * WORKING HOURS EDITOR - Configurar horário de funcionamento
 * ─────────────────────────────────────────────────────────────────────────────
 */
export function WorkingHoursEditor({ agentId, initialConfig }: WorkingHoursEditorProps) {
    const [config, setConfig] = useState<WorkingHoursConfig>(initialConfig);
    const [isPending, startTransition] = useTransition();
    const [saved, setSaved] = useState(false);

    const toggleDay = (day: number) => {
        setConfig(prev => ({
            ...prev,
            days: prev.days.includes(day)
                ? prev.days.filter(d => d !== day)
                : [...prev.days, day].sort(),
        }));
        setSaved(false);
    };

    const handleSave = () => {
        startTransition(async () => {
            const result = await saveWorkingHours(agentId, config);
            if (result.success) {
                setSaved(true);
                setTimeout(() => setSaved(false), 3000);
            }
        });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-indigo-500" />
                    Horário de Funcionamento
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Enable Toggle */}
                <div className="flex items-center justify-between">
                    <div>
                        <p className="font-medium">Ativar horário de funcionamento</p>
                        <p className="text-sm text-slate-500">
                            O agente só responderá dentro do horário configurado
                        </p>
                    </div>
                    <button
                        type="button"
                        role="switch"
                        aria-checked={config.enabled}
                        onClick={() => {
                            setConfig(prev => ({ ...prev, enabled: !prev.enabled }));
                            setSaved(false);
                        }}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${config.enabled ? 'bg-indigo-600' : 'bg-slate-200'
                            }`}
                    >
                        <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${config.enabled ? 'translate-x-6' : 'translate-x-1'
                                }`}
                        />
                    </button>
                </div>

                {config.enabled && (
                    <>
                        {/* Days Selector */}
                        <div className="space-y-2">
                            <Label>Dias de funcionamento</Label>
                            <div className="flex gap-2">
                                {DAYS_OF_WEEK.map((day) => (
                                    <button
                                        key={day.value}
                                        type="button"
                                        onClick={() => toggleDay(day.value)}
                                        title={day.fullLabel}
                                        className={`flex h-10 w-10 items-center justify-center rounded-lg border text-sm font-medium transition-colors ${config.days.includes(day.value)
                                                ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                                : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                                            }`}
                                    >
                                        {day.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Time Range */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="start-time">Horário de início</Label>
                                <Input
                                    id="start-time"
                                    type="time"
                                    value={config.start}
                                    onChange={(e) => {
                                        setConfig(prev => ({ ...prev, start: e.target.value }));
                                        setSaved(false);
                                    }}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="end-time">Horário de término</Label>
                                <Input
                                    id="end-time"
                                    type="time"
                                    value={config.end}
                                    onChange={(e) => {
                                        setConfig(prev => ({ ...prev, end: e.target.value }));
                                        setSaved(false);
                                    }}
                                />
                            </div>
                        </div>

                        {/* Outside Message */}
                        <div className="space-y-2">
                            <Label htmlFor="outside-message">Mensagem fora do horário</Label>
                            <textarea
                                id="outside-message"
                                value={config.outsideMessage}
                                onChange={(e) => {
                                    setConfig(prev => ({ ...prev, outsideMessage: e.target.value }));
                                    setSaved(false);
                                }}
                                placeholder="Estamos fora do horário de atendimento..."
                                className="w-full rounded-lg border border-slate-200 p-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                rows={3}
                            />
                        </div>
                    </>
                )}

                {/* Save Button */}
                <div className="flex justify-end">
                    <Button
                        variant="primary"
                        size="sm"
                        onClick={handleSave}
                        disabled={isPending}
                    >
                        {isPending ? (
                            <>
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                Salvando...
                            </>
                        ) : saved ? (
                            <>
                                <CheckCircle className="h-4 w-4" />
                                Salvo!
                            </>
                        ) : (
                            <>
                                <Save className="h-4 w-4" />
                                Salvar Horário
                            </>
                        )}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
