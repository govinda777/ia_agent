'use client';

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * VARIABLE INSPECTOR - Debug panel para visualizar estado
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { Check, X, Circle, ChevronRight } from 'lucide-react';
import { type StageConfig } from '@/db/schema';
import { cn } from '@/lib/utils';

interface VariableInspectorProps {
    stages: StageConfig[];
    currentStageId: string;
    variables: Record<string, unknown>;
}

export function VariableInspector({ stages, currentStageId, variables }: VariableInspectorProps) {
    const sortedStages = [...stages].sort((a, b) => a.order - b.order);
    const currentStageIndex = sortedStages.findIndex(s => s.id === currentStageId);
    const currentStage = sortedStages.find(s => s.id === currentStageId);

    const hasValue = (key: string) => {
        const value = variables[key];
        return value !== undefined && value !== null && value !== '';
    };

    return (
        <div className="h-full overflow-auto p-4">
            {/* Estágio Atual */}
            <div className="mb-6">
                <h4 className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-3">
                    Estágio Atual
                </h4>
                <div className="bg-gradient-to-r from-blue-500 to-violet-500 rounded-xl p-4 text-white">
                    <p className="font-semibold">{currentStage?.name || 'N/A'}</p>
                    <p className="text-sm text-blue-100 opacity-80">{currentStage?.type}</p>
                </div>
            </div>

            {/* Fluxo dos Estágios */}
            <div className="mb-6">
                <h4 className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-3">
                    Progresso do Fluxo
                </h4>
                <div className="space-y-1">
                    {sortedStages.map((stage, index) => {
                        const isCurrent = stage.id === currentStageId;
                        const isPast = index < currentStageIndex;
                        const isFuture = index > currentStageIndex;

                        return (
                            <div
                                key={stage.id}
                                className={cn(
                                    'flex items-center gap-3 rounded-lg px-3 py-2',
                                    isCurrent && 'bg-blue-50',
                                    isPast && 'opacity-60'
                                )}
                            >
                                <div
                                    className={cn(
                                        'flex h-6 w-6 shrink-0 items-center justify-center rounded-full',
                                        isPast && 'bg-emerald-500',
                                        isCurrent && 'bg-blue-500',
                                        isFuture && 'bg-slate-200'
                                    )}
                                >
                                    {isPast ? (
                                        <Check className="h-3 w-3 text-white" />
                                    ) : isCurrent ? (
                                        <Circle className="h-2 w-2 fill-current text-white" />
                                    ) : (
                                        <span className="text-xs text-slate-500">{index + 1}</span>
                                    )}
                                </div>
                                <span
                                    className={cn(
                                        'text-sm',
                                        isCurrent ? 'font-medium text-blue-700' : 'text-slate-600'
                                    )}
                                >
                                    {stage.name}
                                </span>
                                {isCurrent && <ChevronRight className="h-4 w-4 text-blue-400 ml-auto" />}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Variáveis Coletadas */}
            <div className="mb-6">
                <h4 className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-3">
                    Variáveis Coletadas
                </h4>

                {Object.keys(variables).length === 0 ? (
                    <p className="text-sm text-slate-400 italic">Nenhuma variável coletada</p>
                ) : (
                    <div className="space-y-2">
                        {Object.entries(variables).map(([key, value]) => (
                            <div key={key} className="rounded-lg border border-slate-200 p-3">
                                <p className="text-xs font-mono text-slate-500">{key}</p>
                                <p className="text-sm font-medium text-slate-800">{String(value)}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Variáveis Pendentes */}
            {currentStage && currentStage.requiredVariables.length > 0 && (
                <div>
                    <h4 className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-3">
                        Requisitos do Estágio
                    </h4>
                    <div className="space-y-2">
                        {currentStage.requiredVariables.map((varName) => {
                            const collected = hasValue(varName);
                            return (
                                <div
                                    key={varName}
                                    className={cn(
                                        'flex items-center gap-2 rounded-lg px-3 py-2 text-sm',
                                        collected ? 'bg-emerald-50' : 'bg-amber-50'
                                    )}
                                >
                                    {collected ? (
                                        <Check className="h-4 w-4 text-emerald-500" />
                                    ) : (
                                        <X className="h-4 w-4 text-amber-500" />
                                    )}
                                    <span className="font-mono text-xs">{varName}</span>
                                    {collected ? (
                                        <span className="ml-auto text-emerald-600">✓ Capturado</span>
                                    ) : (
                                        <span className="ml-auto text-amber-600">Pendente</span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* JSON Debug (colapsável) */}
            <div className="mt-6 pt-6 border-t border-slate-100">
                <details className="group">
                    <summary className="text-xs font-medium uppercase tracking-wider text-slate-400 cursor-pointer hover:text-slate-600">
                        Debug JSON
                    </summary>
                    <pre className="mt-2 text-xs bg-slate-800 text-slate-100 rounded-lg p-3 overflow-auto max-h-48">
                        {JSON.stringify({ currentStageId, variables }, null, 2)}
                    </pre>
                </details>
            </div>
        </div>
    );
}
