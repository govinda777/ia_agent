'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface RadioGroupProps {
    value?: string;
    onValueChange?: (value: string) => void;
    className?: string;
    children: React.ReactNode;
}

interface RadioGroupItemProps {
    value: string;
    id?: string;
    className?: string;
    disabled?: boolean;
}

const RadioGroupContext = React.createContext<{
    value?: string;
    onValueChange?: (value: string) => void;
}>({});

const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
    ({ value, onValueChange, className, children, ...props }, ref) => {
        return (
            <RadioGroupContext.Provider value={{ value, onValueChange }}>
                <div
                    ref={ref}
                    role="radiogroup"
                    className={cn('grid gap-2', className)}
                    {...props}
                >
                    {children}
                </div>
            </RadioGroupContext.Provider>
        );
    }
);
RadioGroup.displayName = 'RadioGroup';

const RadioGroupItem = React.forwardRef<HTMLButtonElement, RadioGroupItemProps>(
    ({ value, id, className, disabled, ...props }, ref) => {
        const context = React.useContext(RadioGroupContext);
        const isChecked = context.value === value;

        return (
            <button
                ref={ref}
                type="button"
                role="radio"
                id={id}
                aria-checked={isChecked}
                disabled={disabled}
                onClick={() => context.onValueChange?.(value)}
                className={cn(
                    'aspect-square h-4 w-4 rounded-full border border-slate-300 text-blue-600',
                    'ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
                    'disabled:cursor-not-allowed disabled:opacity-50',
                    isChecked && 'border-blue-600',
                    className
                )}
                {...props}
            >
                {isChecked && (
                    <span className="flex items-center justify-center">
                        <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
                    </span>
                )}
            </button>
        );
    }
);
RadioGroupItem.displayName = 'RadioGroupItem';

export { RadioGroup, RadioGroupItem };
