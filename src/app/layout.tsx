import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * ROOT LAYOUT - Layout principal da aplicação
 * ─────────────────────────────────────────────────────────────────────────────
 */

const inter = Inter({
    subsets: ['latin'],
    display: 'swap',
    variable: '--font-inter',
});

export const metadata: Metadata = {
    title: {
        template: '%s | IA Agent',
        default: 'IA Agent',
    },
    description: 'Plataforma de automação de atendimento via WhatsApp com agentes de IA configuráveis.',
    keywords: ['WhatsApp', 'Automação', 'IA', 'Agentes', 'Atendimento'],
    authors: [{ name: 'Casal do Tráfego' }],
    robots: {
        index: false,
        follow: false,
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="pt-BR" className={inter.variable}>
            <body className="min-h-screen bg-slate-50 font-sans antialiased">
                {children}
            </body>
        </html>
    );
}
