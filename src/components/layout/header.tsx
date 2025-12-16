'use client';

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * HEADER - Cabeçalho do Dashboard
 * ─────────────────────────────────────────────────────────────────────────────
 * 
 * Features: Título da página, breadcrumbs, ações, busca
 */

import { Bell, Search, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HeaderProps {
    title: string;
    description?: string;
    children?: React.ReactNode;
}

export function Header({ title, description, children }: HeaderProps) {
    return (
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-100 bg-white/80 px-6 backdrop-blur-sm">
            {/* Left: Title */}
            <div>
                <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
                {description && (
                    <p className="text-sm text-slate-500">{description}</p>
                )}
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
                {/* Search */}
                <button
                    className={cn(
                        'flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3',
                        'text-sm text-slate-500 transition-all duration-200',
                        'hover:border-slate-300 hover:bg-white focus:border-blue-300 focus:ring-2 focus:ring-blue-100'
                    )}
                >
                    <Search className="h-4 w-4" />
                    <span className="hidden sm:inline">Buscar...</span>
                    <kbd className="hidden rounded bg-slate-200 px-1.5 py-0.5 text-xs font-medium text-slate-500 sm:inline">
                        ⌘K
                    </kbd>
                </button>

                {/* Help */}
                <button
                    className={cn(
                        'flex h-9 w-9 items-center justify-center rounded-xl',
                        'text-slate-400 transition-colors',
                        'hover:bg-slate-100 hover:text-slate-600'
                    )}
                    title="Ajuda"
                >
                    <HelpCircle className="h-5 w-5" />
                </button>

                {/* Notifications */}
                <button
                    className={cn(
                        'relative flex h-9 w-9 items-center justify-center rounded-xl',
                        'text-slate-400 transition-colors',
                        'hover:bg-slate-100 hover:text-slate-600'
                    )}
                    title="Notificações"
                >
                    <Bell className="h-5 w-5" />
                    {/* Notification badge */}
                    <span className="absolute right-1.5 top-1.5 flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500" />
                    </span>
                </button>

                {/* Custom actions from parent */}
                {children}
            </div>
        </header>
    );
}
