import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * BADGE - Componente de badge/tag
 * ─────────────────────────────────────────────────────────────────────────────
 */

const badgeVariants = cva(
    'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2',
    {
        variants: {
            variant: {
                default:
                    'bg-slate-900 text-white',
                secondary:
                    'bg-slate-100 text-slate-700',
                destructive:
                    'bg-red-100 text-red-700',
                success:
                    'bg-emerald-100 text-emerald-700',
                warning:
                    'bg-amber-100 text-amber-700',
                info:
                    'bg-blue-100 text-blue-700',
                outline:
                    'border border-slate-200 text-slate-700',
                // Status específicos
                active:
                    'bg-emerald-100 text-emerald-700',
                pending:
                    'bg-amber-100 text-amber-700',
                qualified:
                    'bg-blue-100 text-blue-700',
                booked:
                    'bg-violet-100 text-violet-700',
                archived:
                    'bg-slate-100 text-slate-500',
            },
        },
        defaultVariants: {
            variant: 'default',
        },
    }
);

export interface BadgeProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> { }

function Badge({ className, variant, ...props }: BadgeProps) {
    return (
        <div className={cn(badgeVariants({ variant }), className)} {...props} />
    );
}

export { Badge, badgeVariants };
