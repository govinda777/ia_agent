import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * BUTTON - Componente de botão com variantes
 * ─────────────────────────────────────────────────────────────────────────────
 */

const buttonVariants = cva(
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
    {
        variants: {
            variant: {
                default:
                    'bg-slate-900 text-white shadow hover:bg-slate-800',
                destructive:
                    'bg-red-500 text-white shadow-sm hover:bg-red-600',
                outline:
                    'border border-slate-200 bg-white shadow-sm hover:bg-slate-50 hover:text-slate-900',
                secondary:
                    'bg-slate-100 text-slate-900 shadow-sm hover:bg-slate-200',
                ghost:
                    'hover:bg-slate-100 hover:text-slate-900',
                link:
                    'text-slate-900 underline-offset-4 hover:underline',
                primary:
                    'bg-gradient-to-r from-blue-500 to-violet-500 text-white shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30',
                success:
                    'bg-emerald-500 text-white shadow-sm hover:bg-emerald-600',
            },
            size: {
                default: 'h-10 px-4 py-2',
                sm: 'h-9 rounded-lg px-3 text-xs',
                lg: 'h-12 rounded-xl px-8 text-base',
                xl: 'h-14 rounded-2xl px-10 text-lg',
                icon: 'h-10 w-10',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
        },
    }
);

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
    asChild?: boolean;
    isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, asChild = false, isLoading, children, disabled, ...props }, ref) => {
        const Comp = asChild ? Slot : 'button';
        return (
            <Comp
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                disabled={disabled || isLoading}
                {...props}
            >
                {isLoading ? (
                    <>
                        <svg
                            className="h-4 w-4 animate-spin"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                        >
                            <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                            />
                            <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                        </svg>
                        <span>Carregando...</span>
                    </>
                ) : (
                    children
                )}
            </Comp>
        );
    }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
