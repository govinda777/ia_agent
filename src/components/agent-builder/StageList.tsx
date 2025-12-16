'use client';

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * STAGE LIST - Lista de estágios do workflow
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { Plus, GripVertical, Trash2, Target, Stethoscope, Calendar, PhoneForwarded, Puzzle } from 'lucide-react';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';
import { type StageConfig, type StageType } from '@/db/schema';
import { generateStageId } from '@/lib/engine/state-machine';

interface StageListProps {
    stages: StageConfig[];
    selectedStageId: string | null;
    onStageSelect: (stageId: string) => void;
    onStagesChange: (stages: StageConfig[]) => void;
}

const stageTypeConfig: Record<StageType, { icon: typeof Target; color: string; label: string }> = {
    identify: { icon: Target, color: 'from-blue-500 to-blue-600', label: 'Identificação' },
    diagnosis: { icon: Stethoscope, color: 'from-emerald-500 to-emerald-600', label: 'Diagnóstico' },
    schedule: { icon: Calendar, color: 'from-violet-500 to-violet-600', label: 'Agendamento' },
    handoff: { icon: PhoneForwarded, color: 'from-amber-500 to-amber-600', label: 'Transbordo' },
    custom: { icon: Puzzle, color: 'from-slate-500 to-slate-600', label: 'Personalizado' },
};

export function StageList({ stages, selectedStageId, onStageSelect, onStagesChange }: StageListProps) {
    const sortedStages = [...stages].sort((a, b) => a.order - b.order);

    const handleAddStage = () => {
        const newStage: StageConfig = {
            id: generateStageId(),
            type: 'custom',
            name: `Novo Estágio`,
            description: '',
            conditions: '',
            requiredVariables: [],
            prompt: '',
            order: stages.length,
            nextStageId: null,
        };

        // Atualizar o nextStageId do último estágio atual
        const updatedStages = stages.map((s, i) => {
            if (i === stages.length - 1 && s.nextStageId === null) {
                return { ...s, nextStageId: newStage.id };
            }
            return s;
        });

        onStagesChange([...updatedStages, newStage]);
        onStageSelect(newStage.id);
    };

    const handleDeleteStage = (stageId: string) => {
        if (stages.length <= 1) return;

        const stageToDelete = stages.find(s => s.id === stageId);
        if (!stageToDelete) return;

        // Atualizar referências de nextStageId
        const updatedStages = stages
            .filter(s => s.id !== stageId)
            .map(s => ({
                ...s,
                nextStageId: s.nextStageId === stageId ? stageToDelete.nextStageId : s.nextStageId,
            }))
            // Re-ordenar
            .map((s, i) => ({ ...s, order: i }));

        onStagesChange(updatedStages);

        if (selectedStageId === stageId) {
            onStageSelect(updatedStages[0]?.id || '');
        }
    };

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="font-semibold text-slate-900">Fluxo de Atendimento</h3>
                    <p className="text-xs text-slate-500">{stages.length} estágios configurados</p>
                </div>
                <Button variant="ghost" size="sm" onClick={handleAddStage}>
                    <Plus className="h-4 w-4" />
                    Adicionar
                </Button>
            </div>

            {/* Stage Cards */}
            <div className="flex-1 overflow-auto space-y-2">
                {sortedStages.map((stage, index) => {
                    const config = stageTypeConfig[stage.type];
                    const isSelected = stage.id === selectedStageId;
                    const isLast = index === sortedStages.length - 1;

                    return (
                        <div key={stage.id} className="relative">
                            {/* Connection Line */}
                            {!isLast && (
                                <div className="absolute left-6 top-full h-2 w-0.5 bg-slate-200 z-0" />
                            )}

                            {/* Stage Card */}
                            <div
                                onClick={() => onStageSelect(stage.id)}
                                className={cn(
                                    'group relative flex items-center gap-3 rounded-xl border p-3 cursor-pointer transition-all',
                                    isSelected
                                        ? 'border-blue-300 bg-blue-50 ring-2 ring-blue-100'
                                        : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                                )}
                            >
                                {/* Drag Handle */}
                                <button className="cursor-grab text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <GripVertical className="h-4 w-4" />
                                </button>

                                {/* Icon */}
                                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${config.color}`}>
                                    <config.icon className="h-5 w-5 text-white" />
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-slate-900 truncate">{stage.name}</p>
                                    <p className="text-xs text-slate-500">{config.label}</p>
                                </div>

                                {/* Variables Badge */}
                                {stage.requiredVariables.length > 0 && (
                                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                                        {stage.requiredVariables.length} vars
                                    </span>
                                )}

                                {/* Delete Button */}
                                {stages.length > 1 && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteStage(stage.id);
                                        }}
                                        className="p-1 rounded text-slate-400 opacity-0 group-hover:opacity-100 hover:text-red-500 hover:bg-red-50 transition-all"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Footer Info */}
            <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-xs text-slate-400 text-center">
                    Arraste para reordenar • Clique para editar
                </p>
            </div>
        </div>
    );
}
