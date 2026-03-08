import { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: ReactNode;
}

export function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between gap-4 flex-nowrap overflow-x-auto">
        {/* Left: title + subtitle */}
        <div className="shrink-0">
          <h1
            className="tracking-tight text-foreground leading-tight whitespace-nowrap"
            style={{ fontSize: '20px', fontWeight: 700 }}
          >
            {title}
          </h1>
          {description && (
            <p className="mt-0.5 whitespace-nowrap" style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>
              {description}
            </p>
          )}
        </div>
        {/* Filters and actions — always single line */}
        {children && (
          <div className="flex items-center gap-3 shrink-0">
            {children}
          </div>
        )}
      </div>
      <div className="mt-4" style={{ height: '1px', background: '#1e1e1e' }} />
    </div>
  );
}
