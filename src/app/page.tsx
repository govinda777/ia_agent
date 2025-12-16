import Link from 'next/link';
import { ArrowRight, Bot, Calendar, FileSpreadsheet, MessageSquare, Sparkles, Zap } from 'lucide-react';

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * LANDING PAGE - Página inicial pública
 * ─────────────────────────────────────────────────────────────────────────────
 */

export default function HomePage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
            {/* Header */}
            <header className="fixed top-0 z-50 w-full border-b border-slate-100 bg-white/80 backdrop-blur-md">
                <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-500">
                            <Sparkles className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-lg font-semibold text-slate-900">IA Agent</span>
                    </div>

                    <nav className="hidden items-center gap-8 md:flex">
                        <a href="#features" className="text-sm font-medium text-slate-600 hover:text-slate-900">
                            Recursos
                        </a>
                        <a href="#how-it-works" className="text-sm font-medium text-slate-600 hover:text-slate-900">
                            Como Funciona
                        </a>
                    </nav>

                    <Link
                        href="/dashboard"
                        className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800"
                    >
                        Acessar Dashboard
                        <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>
            </header>

            {/* Hero */}
            <section className="relative pt-32 pb-20">
                <div className="mx-auto max-w-6xl px-6">
                    <div className="mx-auto max-w-3xl text-center">
                        <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-1.5 text-sm font-medium text-blue-600">
                            <Zap className="h-4 w-4" />
                            Automação Inteligente
                        </div>

                        <h1 className="mb-6 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
                            Agentes de IA para{' '}
                            <span className="gradient-text">WhatsApp Business</span>
                        </h1>

                        <p className="mb-10 text-lg text-slate-600 sm:text-xl">
                            Automatize o atendimento dos seus leads com agentes inteligentes que agendam reuniões,
                            salvam contatos e respondem perguntas — 24 horas por dia.
                        </p>

                        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                            <Link
                                href="/dashboard"
                                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-violet-500 px-8 py-3.5 text-base font-medium text-white shadow-lg shadow-blue-500/25 transition-all hover:shadow-xl hover:shadow-blue-500/30 sm:w-auto"
                            >
                                Começar Agora
                                <ArrowRight className="h-5 w-5" />
                            </Link>
                            <a
                                href="#how-it-works"
                                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-8 py-3.5 text-base font-medium text-slate-700 transition-colors hover:bg-slate-50 sm:w-auto"
                            >
                                Ver Demonstração
                            </a>
                        </div>
                    </div>
                </div>

                {/* Decorative gradient */}
                <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl">
                    <div
                        className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-blue-200 to-violet-200 opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
                    />
                </div>
            </section>

            {/* Features */}
            <section id="features" className="py-20">
                <div className="mx-auto max-w-6xl px-6">
                    <div className="mb-16 text-center">
                        <h2 className="mb-4 text-3xl font-bold text-slate-900">
                            Tudo que você precisa para automatizar
                        </h2>
                        <p className="text-lg text-slate-600">
                            Configure em minutos, funcione em segundos.
                        </p>
                    </div>

                    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
                        {[
                            {
                                icon: Bot,
                                title: 'Agentes Customizáveis',
                                description: 'Crie personas únicas com prompts personalizados para cada contexto.',
                                color: 'from-blue-500 to-blue-600',
                            },
                            {
                                icon: MessageSquare,
                                title: 'Histórico Completo',
                                description: 'Acompanhe todas as conversas e entenda o comportamento dos leads.',
                                color: 'from-emerald-500 to-emerald-600',
                            },
                            {
                                icon: Calendar,
                                title: 'Agendamento Automático',
                                description: 'Integre com Google Calendar e deixe a IA agendar reuniões.',
                                color: 'from-violet-500 to-violet-600',
                            },
                            {
                                icon: FileSpreadsheet,
                                title: 'Captura de Leads',
                                description: 'Salve automaticamente os dados dos leads em Google Sheets.',
                                color: 'from-amber-500 to-amber-600',
                            },
                        ].map((feature) => (
                            <div
                                key={feature.title}
                                className="group rounded-2xl border border-slate-100 bg-white p-6 transition-all hover:border-slate-200 hover:shadow-lg hover:shadow-slate-100"
                            >
                                <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${feature.color}`}>
                                    <feature.icon className="h-6 w-6 text-white" />
                                </div>
                                <h3 className="mb-2 text-lg font-semibold text-slate-900">
                                    {feature.title}
                                </h3>
                                <p className="text-sm text-slate-600">
                                    {feature.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How it Works */}
            <section id="how-it-works" className="bg-slate-50 py-20">
                <div className="mx-auto max-w-6xl px-6">
                    <div className="mb-16 text-center">
                        <h2 className="mb-4 text-3xl font-bold text-slate-900">
                            Como Funciona
                        </h2>
                        <p className="text-lg text-slate-600">
                            Três passos simples para começar a automatizar.
                        </p>
                    </div>

                    <div className="grid gap-8 md:grid-cols-3">
                        {[
                            {
                                step: '01',
                                title: 'Configure seu Agente',
                                description: 'Defina a persona, o tom de voz e as informações que o agente deve usar.',
                            },
                            {
                                step: '02',
                                title: 'Conecte as Integrações',
                                description: 'Vincule seu WhatsApp Business, Google Calendar e Sheets.',
                            },
                            {
                                step: '03',
                                title: 'Ative e Monitore',
                                description: 'Deixe a IA trabalhar e acompanhe as métricas em tempo real.',
                            },
                        ].map((item) => (
                            <div key={item.step} className="relative">
                                <div className="mb-4 text-5xl font-bold text-slate-100">
                                    {item.step}
                                </div>
                                <h3 className="mb-2 text-lg font-semibold text-slate-900">
                                    {item.title}
                                </h3>
                                <p className="text-sm text-slate-600">
                                    {item.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-20">
                <div className="mx-auto max-w-6xl px-6">
                    <div className="rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 p-12 text-center">
                        <h2 className="mb-4 text-3xl font-bold text-white">
                            Pronto para automatizar seu atendimento?
                        </h2>
                        <p className="mb-8 text-lg text-slate-300">
                            Comece gratuitamente e veja os resultados em minutos.
                        </p>
                        <Link
                            href="/dashboard"
                            className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 text-base font-medium text-slate-900 transition-colors hover:bg-slate-100"
                        >
                            Acessar Dashboard
                            <ArrowRight className="h-5 w-5" />
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-slate-100 py-8">
                <div className="mx-auto max-w-6xl px-6 text-center text-sm text-slate-500">
                    © {new Date().getFullYear()} Casal do Tráfego. Todos os direitos reservados.
                </div>
            </footer>
        </div>
    );
}
