import React from 'react';
import { cn } from '../../lib/utils';

const Select = React.forwardRef(({ className, label, error, options = [], children, ...props }, ref) => {
    return (
        <div className="w-full">
            {label && <label className="block text-sm font-medium mb-1 text-gray-700">{label}</label>}
            <div className="relative">
                <select
                    className={cn(
                        "flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:cursor-not-allowed disabled:opacity-50 appearance-none",
                        error && "border-red-500 focus:ring-red-400",
                        className
                    )}
                    ref={ref}
                    {...props}
                >
                    {children}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                </div>
            </div>
            {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        </div>
    );
});
Select.displayName = "Select";
export { Select };
