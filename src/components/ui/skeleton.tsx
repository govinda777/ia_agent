import { cn } from '@/lib/utils';

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * SKELETON - Componente de loading skeleton
 * ─────────────────────────────────────────────────────────────────────────────
 */

function Skeleton({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn(
                'animate-pulse rounded-xl bg-slate-100',
                className
            )}
            {...props}
        />
    );
}

export { Skeleton };
