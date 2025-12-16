'use client';

import { useState, useTransition } from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from '@/components/ui';
import { Sparkles, Save, CheckCircle } from 'lucide-react';
import { savePersonality, type PersonalitySettings } from '@/app/actions/agent';

interface PersonalityEditorProps {
    agentId: string;
    initialSettings: PersonalitySettings;
}

const TONE_OPTIONS = [
    { value: 'formal', label: 'Formal', description: 'Tom profissional e corporativo' },
    { value: 'friendly', label: 'Amigável', description: 'Acolhedor e acessível' },
    { value: 'professional', label: 'Profissional', description: 'Equilibrado e competente' },
    { value: 'casual', label: 'Casual', description: 'Descontraído e leve' },
];

const LANGUAGE_OPTIONS = [
    { value: 'pt-BR', label: '🇧🇷 Português (Brasil)' },
    { value: 'pt-PT', label: '🇵🇹 Português (Portugal)' },
    { value: 'en-US', label: '🇺🇸 English (US)' },
    { value: 'es', label: '🇪🇸 Español' },
];

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * PERSONALITY EDITOR - Configurar tom de voz e personalidade
 * ─────────────────────────────────────────────────────────────────────────────
 */
export function PersonalityEditor({ agentId, initialSettings }: PersonalityEditorProps) {
    const [settings, setSettings] = useState<PersonalitySettings>(initialSettings);
    const [isPending, startTransition] = useTransition();
    const [saved, setSaved] = useState(false);

    const handleSave = () => {
        startTransition(async () => {
            const result = await savePersonality(agentId, settings);
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
                    <Sparkles className="h-5 w-5 text-purple-500" />
                    Personalidade do Agente
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Display Name */}
                <div className="space-y-2">
                    <Label htmlFor="display-name">Nome exibido</Label>
                    <Input
                        id="display-name"
                        value={settings.displayName || ''}
                        onChange={(e) => {
                            setSettings(prev => ({ ...prev, displayName: e.target.value }));
                            setSaved(false);
                        }}
                        placeholder="Ex: Sofia, Assistente Virtual"
                    />
                    <p className="text-xs text-slate-500">
                        Nome que aparece para o usuário no chat
                    </p>
                </div>

                {/* Personality Description */}
                <div className="space-y-2">
                    <Label htmlFor="personality">Descrição da personalidade</Label>
                    <textarea
                        id="personality"
                        value={settings.personality || ''}
                        onChange={(e) => {
                            setSettings(prev => ({ ...prev, personality: e.target.value }));
                            setSaved(false);
                        }}
                        placeholder="Ex: Sou uma assistente simpática e prestativa, especialista em ajudar empreendedores..."
                        className="w-full rounded-lg border border-slate-200 p-3 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                        rows={3}
                    />
                </div>

                {/* Tone Selector */}
                <div className="space-y-2">
                    <Label>Tom de voz</Label>
                    <div className="grid grid-cols-2 gap-2">
                        {TONE_OPTIONS.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => {
                                    setSettings(prev => ({ ...prev, tone: option.value }));
                                    setSaved(false);
                                }}
                                className={`rounded-lg border p-3 text-left transition-colors ${settings.tone === option.value
                                        ? 'border-purple-500 bg-purple-50'
                                        : 'border-slate-200 hover:bg-slate-50'
                                    }`}
                            >
                                <p className="font-medium text-sm">{option.label}</p>
                                <p className="text-xs text-slate-500">{option.description}</p>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Language */}
                <div className="space-y-2">
                    <Label htmlFor="language">Idioma principal</Label>
                    <select
                        id="language"
                        value={settings.language || 'pt-BR'}
                        onChange={(e) => {
                            setSettings(prev => ({ ...prev, language: e.target.value }));
                            setSaved(false);
                        }}
                        className="w-full rounded-lg border border-slate-200 p-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                    >
                        {LANGUAGE_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Emojis Toggle */}
                <div className="flex items-center justify-between">
                    <div>
                        <p className="font-medium text-sm">Usar emojis</p>
                        <p className="text-xs text-slate-500">
                            Incluir emojis nas respostas para mais expressividade
                        </p>
                    </div>
                    <button
                        type="button"
                        role="switch"
                        aria-checked={settings.useEmojis}
                        onClick={() => {
                            setSettings(prev => ({ ...prev, useEmojis: !prev.useEmojis }));
                            setSaved(false);
                        }}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.useEmojis ? 'bg-purple-600' : 'bg-slate-200'
                            }`}
                    >
                        <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.useEmojis ? 'translate-x-6' : 'translate-x-1'
                                }`}
                        />
                    </button>
                </div>

                {/* Avatar URL */}
                <div className="space-y-2">
                    <Label htmlFor="avatar-url">URL do Avatar</Label>
                    <Input
                        id="avatar-url"
                        type="url"
                        value={settings.avatarUrl || ''}
                        onChange={(e) => {
                            setSettings(prev => ({ ...prev, avatarUrl: e.target.value }));
                            setSaved(false);
                        }}
                        placeholder="https://..."
                    />
                    {settings.avatarUrl && (
                        <div className="flex items-center gap-2 mt-2">
                            <img
                                src={settings.avatarUrl}
                                alt="Avatar preview"
                                className="h-12 w-12 rounded-full object-cover border border-slate-200"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                }}
                            />
                            <span className="text-sm text-slate-500">Preview do avatar</span>
                        </div>
                    )}
                </div>

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
                                Salvar Personalidade
                            </>
                        )}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
