/**
 * ─────────────────────────────────────────────────────────────────────────────
 * PAGE WRAPPER - Container padrão de páginas
 * ─────────────────────────────────────────────────────────────────────────────
 * 
 * Provê padding e estrutura consistente para todas as páginas do dashboard.
 */

import { cn } from '@/lib/utils';

interface PageWrapperProps {
    children: React.ReactNode;
    className?: string;
}

export function PageWrapper({ children, className }: PageWrapperProps) {
    return (
        <main
            className={cn(
                'flex-1 overflow-y-auto p-6',
                'animate-fade-in',
                className
            )}
        >
            {children}
        </main>
    );
}

/**
 * Container para cards em grid
 */
export function PageGrid({ children, className }: PageWrapperProps) {
    return (
        <div
            className={cn(
                'grid gap-6',
                'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
                className
            )}
        >
            {children}
        </div>
    );
}

/**
 * Seção de página com título opcional
 */
interface PageSectionProps extends PageWrapperProps {
    title?: string;
    description?: string;
    action?: React.ReactNode;
}

export function PageSection({
    title,
    description,
    action,
    children,
    className,
}: PageSectionProps) {
    return (
        <section className={cn('space-y-4', className)}>
            {(title || action) && (
                <div className="flex items-center justify-between">
                    <div>
                        {title && (
                            <h2 className="text-base font-semibold text-slate-900">{title}</h2>
                        )}
                        {description && (
                            <p className="text-sm text-slate-500">{description}</p>
                        )}
                    </div>
                    {action}
                </div>
            )}
            {children}
        </section>
    );
}
