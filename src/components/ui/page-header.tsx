import { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: ReactNode;
}

export function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between gap-4 flex-wrap">
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
        {/* Center/Right: filters and actions in a single row */}
        {children && <div className="flex items-center gap-3 flex-wrap">{children}</div>}
      </div>
      <div className="mt-4" style={{ height: '1px', background: 'rgba(255,255,255,0.06)' }} />
    </div>
  );
}
