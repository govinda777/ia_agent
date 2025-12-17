'use client';

import { Header, PageWrapper, PageSection } from '@/components/layout';

export default function TermosPage() {
    return (
        <>
            <Header
                title="Termos de Uso"
                description="Última atualização: Dezembro de 2024"
            />

            <PageWrapper>
                <PageSection>
                    <div className="max-w-3xl mx-auto prose prose-slate">
                        <h2>1. Aceitação dos Termos</h2>
                        <p>
                            Ao acessar e usar a plataforma Casal do Tráfego IA, você concorda com
                            estes Termos de Uso. Se não concordar com qualquer parte destes termos,
                            não utilize nossos serviços.
                        </p>

                        <h2>2. Descrição do Serviço</h2>
                        <p>
                            A plataforma oferece ferramentas para criação e gerenciamento de agentes
                            de IA para atendimento automatizado, incluindo:
                        </p>
                        <ul>
                            <li>Criação de agentes de IA personalizados</li>
                            <li>Integração com Google Calendar para agendamentos</li>
                            <li>Base de conhecimento para treinamento dos agentes</li>
                            <li>Análise de conversas e métricas</li>
                        </ul>

                        <h2>3. Conta de Usuário</h2>
                        <p>
                            Para usar nossos serviços, você deve criar uma conta. Você é responsável
                            por manter a confidencialidade de suas credenciais e por todas as
                            atividades realizadas em sua conta.
                        </p>

                        <h2>4. Uso Aceitável</h2>
                        <p>Você concorda em NÃO usar a plataforma para:</p>
                        <ul>
                            <li>Atividades ilegais ou fraudulentas</li>
                            <li>Spam ou comunicações não solicitadas</li>
                            <li>Violar direitos de terceiros</li>
                            <li>Distribuir malware ou conteúdo malicioso</li>
                            <li>Tentar acessar sistemas não autorizados</li>
                        </ul>

                        <h2>5. Propriedade Intelectual</h2>
                        <p>
                            Todo o conteúdo da plataforma, incluindo código, design e marca,
                            pertence à Casal do Tráfego IA. Os agentes criados por você
                            pertencem a você, mas a tecnologia subjacente permanece nossa.
                        </p>

                        <h2>6. Integrações de Terceiros</h2>
                        <p>
                            Ao conectar serviços de terceiros como Google, você também está
                            sujeito aos termos desses provedores. Não nos responsabilizamos
                            por ações de serviços externos.
                        </p>

                        <h2>7. Limitação de Responsabilidade</h2>
                        <p>
                            A plataforma é fornecida &quot;como está&quot;. Não garantimos que será
                            ininterrupta ou livre de erros. Em nenhuma circunstância seremos
                            responsáveis por danos indiretos, incidentais ou consequentes.
                        </p>

                        <h2>8. Cancelamento</h2>
                        <p>
                            Você pode cancelar sua conta a qualquer momento. Reservamo-nos o
                            direito de suspender ou encerrar contas que violem estes termos.
                        </p>

                        <h2>9. Alterações nos Termos</h2>
                        <p>
                            Podemos modificar estes termos periodicamente. Continuando a usar
                            a plataforma após as mudanças, você aceita os novos termos.
                        </p>

                        <h2>10. Contato</h2>
                        <p>
                            Para dúvidas sobre estes termos, entre em contato:{' '}
                            <a href="mailto:dr.trafego@gmail.com" className="text-blue-600 hover:underline">
                                dr.trafego@gmail.com
                            </a>
                        </p>

                        <h2>11. Lei Aplicável</h2>
                        <p>
                            Estes termos são regidos pelas leis do Brasil. Qualquer disputa
                            será resolvida nos tribunais brasileiros competentes.
                        </p>
                    </div>
                </PageSection>
            </PageWrapper>
        </>
    );
}
