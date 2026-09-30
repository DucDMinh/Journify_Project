import type { ReactNode } from "react";

interface ChartCardProps {
    title: string;
    subtitle?: string;
    action?: ReactNode;
    children: ReactNode;
    className?: string;
}

export function ChartCard({ title, subtitle, action, children, className = "" }: ChartCardProps) {
    return (
        <section className={`rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] ${className}`}>
            <header className="mb-4 flex items-start justify-between gap-4">
                <div>
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h3>
                    {subtitle && <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>}
                </div>
                {action}
            </header>
            {children}
        </section>
    );
}
