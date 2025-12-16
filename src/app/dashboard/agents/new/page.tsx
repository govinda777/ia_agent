'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header, PageWrapper } from '@/components/layout';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label, Textarea, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui';
import { Save, ArrowLeft, Bot, Loader2 } from 'lucide-react';
import Link from 'next/link';

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * NEW AGENT PAGE - Criar novo agente (Zaia-Style)
 * ─────────────────────────────────────────────────────────────────────────────
 * 
 * Etapa inicial: Nome, descrição e modelo
 * Após salvar, redireciona para o Builder para configuração detalhada
 */

const AI_MODELS = [
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini', description: 'Rápido e econômico' },
    { id: 'gpt-4o', name: 'GPT-4o', description: 'Mais inteligente' },
    { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet', description: 'Excelente para textos' },
    { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', description: 'Google AI' },
];

export default function NewAgentPage() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        model: 'gpt-4o-mini',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            setError('Nome do agente é obrigatório');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const res = await fetch('/api/agents', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    description: formData.description || null,
                    modelConfig: { model: formData.model, temperature: 0.7 },
                    systemPrompt: `Você é ${formData.name}, um assistente virtual profissional. Seja cordial, objetivo e profissional.`,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Erro ao criar agente');
            }

            const { agent } = await res.json();

            // Redireciona para o Builder do agente criado
            router.push(`/dashboard/agents/${agent.id}/builder`);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao criar agente');
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <Header title="Criar Agente" description="Configure um novo agente de IA">
                <Link href="/dashboard/agents">
                    <Button variant="ghost" size="sm">
                        <ArrowLeft className="h-4 w-4" />
                        Voltar
                    </Button>
                </Link>
            </Header>

            <PageWrapper>
                <div className="mx-auto max-w-2xl">
                    <form onSubmit={handleSubmit}>
                        <Card>
                            <CardHeader>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500">
                                        <Bot className="h-6 w-6 text-white" />
                                    </div>
                                    <CardTitle>Informações Básicas</CardTitle>
                                </div>
                                <p className="text-sm text-slate-500">
                                    Defina o nome e modelo do seu novo agente. Após criar, você poderá configurar os detalhes no Builder.
                                </p>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {error && (
                                    <div className="rounded-xl bg-red-50 border border-red-100 p-4 text-sm text-red-600">
                                        {error}
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label htmlFor="name">Nome do Agente *</Label>
                                    <Input
                                        id="name"
                                        placeholder="Ex: Assistente de Vendas, Suporte Técnico..."
                                        value={formData.name}
                                        onChange={(e) =>
                                            setFormData(prev => ({ ...prev, name: e.target.value }))
                                        }
                                        className="text-base"
                                        autoFocus
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description">Descrição (opcional)</Label>
                                    <Textarea
                                        id="description"
                                        placeholder="Descreva brevemente o propósito deste agente..."
                                        value={formData.description}
                                        onChange={(e) =>
                                            setFormData(prev => ({ ...prev, description: e.target.value }))
                                        }
                                        rows={3}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Modelo de IA</Label>
                                    <Select
                                        value={formData.model}
                                        onValueChange={(value) =>
                                            setFormData(prev => ({ ...prev, model: value }))
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {AI_MODELS.map((model) => (
                                                <SelectItem key={model.id} value={model.id}>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium">{model.name}</span>
                                                        <span className="text-slate-400">—</span>
                                                        <span className="text-slate-500">{model.description}</span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-slate-500">
                                        Você pode alterar o modelo a qualquer momento no Builder
                                    </p>
                                </div>

                                <div className="pt-4 flex justify-end gap-3">
                                    <Link href="/dashboard/agents">
                                        <Button variant="outline" type="button">
                                            Cancelar
                                        </Button>
                                    </Link>
                                    <Button
                                        variant="primary"
                                        type="submit"
                                        disabled={isSubmitting || !formData.name.trim()}
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Criando...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="h-4 w-4" />
                                                Criar e Configurar
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </form>
                </div>
            </PageWrapper>
        </>
    );
}
