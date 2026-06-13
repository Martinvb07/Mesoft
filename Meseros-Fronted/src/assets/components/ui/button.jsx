import React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../../lib/utils';
import '../../css/landing-tailwind.css';

export const buttonVariants = cva(
    'group inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-xl border-0 font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97]',
    {
        variants: {
            variant: {
                default:
                    'bg-gradient-to-b from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-orange-500/40',
                outline:
                    'border border-slate-200 bg-white text-slate-800 shadow-sm hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md',
                dark:
                    'bg-slate-900 text-white shadow-lg shadow-slate-900/20 hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-xl',
                ghost: 'text-slate-700 hover:bg-slate-100',
            },
            size: {
                default: 'h-10 px-5 text-sm',
                lg: 'h-12 px-7 text-base',
                xl: 'h-14 px-8 text-base',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
        },
    }
);

const Button = React.forwardRef(({ className, variant, size, ...props }, ref) => (
    <button ref={ref} type="button" className={cn(buttonVariants({ variant, size }), className)} {...props} />
));
Button.displayName = 'Button';

export default Button;
