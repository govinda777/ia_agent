'use client';

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * INTEGRATIONS TAB - Per-Agent Integration Management
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useBuilderStore } from '@/stores/builder-store';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, MessageCircle, FileSpreadsheet, Check, Link } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface IntegrationStatus {
    connected: boolean;
    email?: string;
    id?: string;
}

export function IntegrationsTab() {
    const { agent, updateAgent } = useBuilderStore();
    const [mainGoogleStatus, setMainGoogleStatus] = useState<IntegrationStatus | null>(null);
    const [loading, setLoading] = useState(true);

    // Buscar status da integração principal da conta
    useEffect(() => {
        async function fetchStatus() {
            try {
                const res = await fetch('/api/integrations/status');
                if (res.ok) {
                    const data = await res.json();
                    setMainGoogleStatus(data.google);
                } else {
                    setMainGoogleStatus({ connected: false });
                }
            } catch (error) {
                console.error('Erro ao buscar status:', error);
                setMainGoogleStatus({ connected: false });
            } finally {
                setLoading(false);
            }
        }
        fetchStatus();
    }, []);

    const useMainIntegration = agent?.useMainGoogleIntegration ?? true;

    // Handler para mudar tipo de integração
    function handleIntegrationTypeChange(value: string) {
        if (!agent) return;

        const useMain = value === 'main';
        updateAgent({
            useMainGoogleIntegration: useMain,
            // Se usar main, limpa o ID específico
            googleIntegrationId: useMain ? null : agent.googleIntegrationId,
        });
    }

    // Handler para conectar nova conta Google para este agente
    async function handleConnectAgentGoogle() {
        try {
            // Redireciona para OAuth com state indicando que é para agente específico
            const response = await fetch(`/api/auth/google?agentId=${agent?.id}`);
            const data = await response.json();

            if (data.authUrl) {
                window.location.href = data.authUrl;
            } else if (data.error) {
                console.error('Erro ao conectar Google:', data.error);
                alert('Erro ao conectar com Google. Verifique a configuração.');
            }
        } catch (error) {
            console.error('Erro ao conectar Google:', error);
            alert('Erro ao conectar com Google.');
        }
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            {/* Google Integration */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            Google Workspace
                        </CardTitle>
                        {useMainIntegration && mainGoogleStatus?.connected ? (
                            <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">
                                Usando Principal
                            </Badge>
                        ) : agent?.googleIntegrationId ? (
                            <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200">
                                Conta Específica
                            </Badge>
                        ) : (
                            <Badge variant="outline" className="bg-slate-100 text-slate-700">
                                Não Configurado
                            </Badge>
                        )}
                    </div>
                    <CardDescription>
                        Permite ao agente acessar Calendar (agendamento) e Sheets (salvar leads).
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                    {/* Funcionalidades disponíveis */}
                    <div className="flex gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                            <FileSpreadsheet className="h-4 w-4" />
                            <span>Google Sheets</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>Google Calendar</span>
                        </div>
                    </div>

                    {/* Opções de integração */}
                    <div className="border rounded-lg p-4 bg-slate-50">
                        <h4 className="font-medium mb-4">Configuração de Integração</h4>

                        <RadioGroup
                            value={useMainIntegration ? 'main' : 'specific'}
                            onValueChange={handleIntegrationTypeChange}
                            className="space-y-3"
                        >
                            {/* Opção 1: Usar integração principal */}
                            <div className="flex items-start space-x-3">
                                <RadioGroupItem value="main" id="main" className="mt-1" />
                                <div className="flex-1">
                                    <Label htmlFor="main" className="font-medium cursor-pointer">
                                        Usar integração principal da conta
                                    </Label>
                                    <p className="text-sm text-muted-foreground mt-0.5">
                                        Usa a mesma conta Google conectada em Integrações.
                                    </p>
                                    {mainGoogleStatus?.connected && (
                                        <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
                                            <Check className="h-4 w-4" />
                                            <span>Conectado: {mainGoogleStatus.email}</span>
                                        </div>
                                    )}
                                    {!mainGoogleStatus?.connected && !loading && (
                                        <div className="mt-2 text-sm text-amber-600">
                                            ⚠️ Nenhuma integração principal conectada.{' '}
                                            <a href="/dashboard/integrations" className="underline hover:no-underline">
                                                Conectar agora
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Opção 2: Conectar conta específica */}
                            <div className="flex items-start space-x-3">
                                <RadioGroupItem value="specific" id="specific" className="mt-1" />
                                <div className="flex-1">
                                    <Label htmlFor="specific" className="font-medium cursor-pointer">
                                        Conectar conta Google específica para este agente
                                    </Label>
                                    <p className="text-sm text-muted-foreground mt-0.5">
                                        Usa uma conta diferente apenas para este agente.
                                    </p>
                                    {!useMainIntegration && (
                                        <div className="mt-3">
                                            {agent?.googleIntegrationId ? (
                                                <div className="flex items-center gap-2 text-sm text-green-600">
                                                    <Check className="h-4 w-4" />
                                                    <span>Conta específica conectada</span>
                                                </div>
                                            ) : (
                                                <Button
                                                    size="sm"
                                                    onClick={handleConnectAgentGoogle}
                                                    className="mt-1"
                                                >
                                                    <Link className="h-4 w-4 mr-2" />
                                                    Conectar Conta Google
                                                </Button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </RadioGroup>
                    </div>
                </CardContent>
            </Card>

            {/* WhatsApp Integration (Future) */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <MessageCircle className="h-5 w-5" />
                            WhatsApp Business
                        </CardTitle>
                        <Badge variant="outline" className="bg-slate-100 text-slate-700">Em Breve</Badge>
                    </div>
                    <CardDescription>
                        Conecte via Meta Cloud API.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        A integração nativa com WhatsApp Business API estará disponível em breve.
                        Por enquanto, utilize a API de Teste ou Webhooks manuais.
                    </p>
                </CardContent>
                <CardFooter>
                    <Button disabled className="w-full">Configurar (Em Breve)</Button>
                </CardFooter>
            </Card>
        </div>
    );
}
