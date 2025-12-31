'use client';

import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AgentStage, StageType } from '@/db/schema';
import { useState, useEffect } from 'react';
import { updateStageAction } from '@/server/actions/stages';
import { Loader2 } from 'lucide-react';
import { useBuilderStore } from '@/stores/builder-store';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    stage: AgentStage | null;
}

export function StageEditor({ isOpen, onClose, stage }: Props) {
    const { agent, updateStage } = useBuilderStore();
    const [formData, setFormData] = useState(stage);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        setFormData(stage);
    }, [stage]);

    async function handleSave() {
        if (!stage || !agent || !formData) return;
        setIsSaving(true);

        await updateStageAction(stage.id, agent.id, {
            name: formData.name,
            type: formData.type,
            instructions: formData.instructions,
            entryCondition: formData.entryCondition
        });

        // Optimistic update
        updateStage(stage.id, {
            name: formData.name,
            type: formData.type,
            instructions: formData.instructions,
            entryCondition: formData.entryCondition
        });

        setIsSaving(false);
        onClose();
    }

    if (!stage) return null;

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent className="sm:max-w-xl overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>Edit Stage</SheetTitle>
                    <SheetDescription>
                        Configure how this stage should behave.
                    </SheetDescription>
                </SheetHeader>

                <div className="space-y-6 py-6">
                    <div className="space-y-2">
                        <Label>Stage Name</Label>
                        <Input value={formData?.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                    </div>

                    <div className="space-y-2">
                        <Label>Type</Label>
                        <Select value={formData?.type} onValueChange={(v) => setFormData({ ...formData, type: v as StageType })}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="identify">Identification (Collect Data)</SelectItem>
                                <SelectItem value="diagnosis">Diagnosis (Understand Problem)</SelectItem>
                                <SelectItem value="schedule">Scheduling (Calendar)</SelectItem>
                                <SelectItem value="handoff">Human Handoff</SelectItem>
                                <SelectItem value="custom">Custom</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Entry Condition</Label>
                        <Input
                            value={formData?.entryCondition || ''}
                            onChange={e => setFormData({ ...formData, entryCondition: e.target.value })}
                            placeholder="e.g., User wants to schedule a meeting..."
                        />
                        <p className="text-xs text-muted-foreground">
                            The agent will only enter this stage if the conversation meets this condition.
                            Leave blank for a forced sequential flow.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label>Agent Instructions (Prompt)</Label>
                        <Textarea
                            className="min-h-[200px]"
                            value={formData?.instructions}
                            onChange={e => setFormData({ ...formData, instructions: e.target.value })}
                            placeholder="Instruct the agent on what to do and ask in this stage."
                        />
                    </div>
                </div>

                <SheetFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
