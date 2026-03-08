import { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: ReactNode;
}

export function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <div className="mb-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Left: title + subtitle */}
        <div className="shrink-0">
          <h1
            className="tracking-tight text-foreground leading-tight"
            style={{ fontSize: '20px', fontWeight: 700 }}
          >
            {title}
          </h1>
          {description && (
            <p className="mt-0.5" style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>
              {description}
            </p>
          )}
        </div>
        {/* Filters and actions */}
        {children && (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:flex-wrap sm:gap-3">
            {children}
          </div>
        )}
      </div>
      <div className="mt-4" style={{ height: '1px', background: 'rgba(255,255,255,0.06)' }} />
    </div>
  );
}
