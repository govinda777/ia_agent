'use client';

import { Header, PageWrapper, PageSection } from '@/components/layout';

export default function PrivacidadePage() {
    return (
        <>
            <Header
                title="Política de Privacidade"
                description="Última atualização: Dezembro de 2024"
            />

            <PageWrapper>
                <PageSection>
                    <div className="max-w-3xl mx-auto prose prose-slate">
                        <h2>1. Introdução</h2>
                        <p>
                            A plataforma Casal do Tráfego IA (&quot;nós&quot;, &quot;nosso&quot; ou &quot;plataforma&quot;)
                            respeita sua privacidade e está comprometida em proteger seus dados pessoais.
                            Esta Política de Privacidade explica como coletamos, usamos, armazenamos e
                            protegemos suas informações.
                        </p>

                        <h2>2. Dados que Coletamos</h2>
                        <p>Podemos coletar os seguintes tipos de dados:</p>
                        <ul>
                            <li><strong>Dados de conta:</strong> Nome, email e informações de perfil ao criar uma conta</li>
                            <li><strong>Dados de uso:</strong> Informações sobre como você usa a plataforma</li>
                            <li><strong>Dados de integrações:</strong> Quando você conecta serviços como Google Calendar,
                                acessamos apenas os dados necessários para o funcionamento das funcionalidades</li>
                            <li><strong>Dados de conversas:</strong> Mensagens trocadas com os agentes de IA para
                                melhorar o atendimento</li>
                        </ul>

                        <h2>3. Como Usamos seus Dados</h2>
                        <p>Utilizamos seus dados para:</p>
                        <ul>
                            <li>Fornecer e melhorar nossos serviços</li>
                            <li>Personalizar sua experiência</li>
                            <li>Processar agendamentos via Google Calendar</li>
                            <li>Enviar comunicações relevantes sobre o serviço</li>
                            <li>Garantir a segurança da plataforma</li>
                        </ul>

                        <h2>4. Integrações com Google</h2>
                        <p>
                            Quando você conecta sua conta Google, solicitamos acesso ao Google Calendar
                            para permitir que os agentes de IA agendem compromissos em seu nome.
                            Nós <strong>não</strong> armazenamos suas credenciais do Google - utilizamos
                            tokens OAuth seguros que podem ser revogados a qualquer momento.
                        </p>

                        <h2>5. Compartilhamento de Dados</h2>
                        <p>
                            Não vendemos, alugamos ou compartilhamos seus dados pessoais com terceiros
                            para fins de marketing. Podemos compartilhar dados apenas:
                        </p>
                        <ul>
                            <li>Com provedores de serviços essenciais (hospedagem, análise)</li>
                            <li>Quando exigido por lei</li>
                            <li>Com seu consentimento explícito</li>
                        </ul>

                        <h2>6. Segurança</h2>
                        <p>
                            Implementamos medidas de segurança técnicas e organizacionais para proteger
                            seus dados, incluindo criptografia, controle de acesso e monitoramento contínuo.
                        </p>

                        <h2>7. Seus Direitos</h2>
                        <p>Você tem o direito de:</p>
                        <ul>
                            <li>Acessar seus dados pessoais</li>
                            <li>Corrigir dados incorretos</li>
                            <li>Solicitar a exclusão de seus dados</li>
                            <li>Revogar consentimentos a qualquer momento</li>
                            <li>Exportar seus dados</li>
                        </ul>

                        <h2>8. Contato</h2>
                        <p>
                            Para questões sobre privacidade, entre em contato conosco em:{' '}
                            <a href="mailto:dr.trafego@gmail.com" className="text-blue-600 hover:underline">
                                dr.trafego@gmail.com
                            </a>
                        </p>

                        <h2>9. Alterações</h2>
                        <p>
                            Podemos atualizar esta política periodicamente. Notificaremos sobre
                            mudanças significativas por email ou através da plataforma.
                        </p>
                    </div>
                </PageSection>
            </PageWrapper>
        </>
    );
}
