import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * TEXTAREA - Componente de textarea
 * ─────────────────────────────────────────────────────────────────────────────
 */

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    error?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ className, error, ...props }, ref) => {
        return (
            <textarea
                className={cn(
                    'flex min-h-[120px] w-full rounded-xl border bg-white px-3 py-2 text-sm transition-colors',
                    'placeholder:text-slate-400',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                    'disabled:cursor-not-allowed disabled:opacity-50',
                    'resize-none',
                    error
                        ? 'border-red-300 focus-visible:ring-red-400'
                        : 'border-slate-200 focus-visible:ring-blue-400',
                    className
                )}
                ref={ref}
                {...props}
            />
        );
    }
);
Textarea.displayName = 'Textarea';

export { Textarea };
