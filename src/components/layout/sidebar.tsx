'use client';

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * SIDEBAR - Navegação lateral do Dashboard
 * ─────────────────────────────────────────────────────────────────────────────
 * 
 * Design: Business Clean com tons de Slate
 * Features: Navegação, logo, indicador de página ativa
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Bot,
    BookOpen,
    MessageSquare,
    BarChart3,
    Plug,
    Settings,
    LogOut,
    Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
    {
        name: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
    },
    {
        name: 'Agentes',
        href: '/dashboard/agents',
        icon: Bot,
    },
    {
        name: 'Conhecimento',
        href: '/dashboard/knowledge',
        icon: BookOpen,
    },
    {
        name: 'Conversas',
        href: '/dashboard/threads',
        icon: MessageSquare,
    },
    {
        name: 'Analytics',
        href: '/dashboard/analytics',
        icon: BarChart3,
    },
    {
        name: 'Integrações',
        href: '/dashboard/integrations',
        icon: Plug,
    },
];

const bottomNavigation = [
    {
        name: 'Configurações',
        href: '/dashboard/settings',
        icon: Settings,
    },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-slate-200 bg-white">
            {/* Logo */}
            <div className="flex h-16 items-center gap-3 border-b border-slate-100 px-6">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-500">
                    <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div>
                    <h1 className="text-sm font-semibold text-slate-900">IA Agent</h1>
                    <p className="text-xs text-slate-500">Casal do Tráfego</p>
                </div>
            </div>

            {/* Main Navigation */}
            <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
                <p className="mb-2 px-3 text-xs font-medium uppercase tracking-wider text-slate-400">
                    Menu
                </p>

                {navigation.map((item) => {
                    const isActive = pathname === item.href ||
                        (item.href !== '/dashboard' && pathname.startsWith(item.href));

                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                                isActive
                                    ? 'bg-blue-50 text-blue-600'
                                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                            )}
                        >
                            <item.icon
                                className={cn(
                                    'h-5 w-5 transition-colors',
                                    isActive
                                        ? 'text-blue-500'
                                        : 'text-slate-400 group-hover:text-slate-600'
                                )}
                            />
                            {item.name}

                            {/* Active indicator */}
                            {isActive && (
                                <div className="ml-auto h-1.5 w-1.5 rounded-full bg-blue-500" />
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Bottom Navigation */}
            <div className="border-t border-slate-100 px-3 py-4">
                {bottomNavigation.map((item) => {
                    const isActive = pathname === item.href;

                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                                isActive
                                    ? 'bg-slate-100 text-slate-900'
                                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                            )}
                        >
                            <item.icon className="h-5 w-5 text-slate-400 group-hover:text-slate-600" />
                            {item.name}
                        </Link>
                    );
                })}

                {/* User Section */}
                <div className="mt-4 flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-slate-200 to-slate-300">
                        <span className="text-xs font-semibold text-slate-600">CT</span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-medium text-slate-900">
                            Casal do Tráfego
                        </p>
                        <p className="truncate text-xs text-slate-500">
                            admin@casaldotrafego.com
                        </p>
                    </div>
                    <button
                        className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                        title="Sair"
                    >
                        <LogOut className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </aside>
    );
}
