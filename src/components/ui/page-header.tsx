import { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: ReactNode;
}

export function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <div className="mb-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1
            className="tracking-tight text-foreground"
            style={{ fontSize: '22px', fontWeight: 700 }}
          >
            {title}
          </h1>
          {description && (
            <p className="mt-1" style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>
              {description}
            </p>
          )}
        </div>
        {children && <div className="flex items-center gap-3">{children}</div>}
      </div>
      <div className="mt-4" style={{ height: '1px', background: 'rgba(255,255,255,0.06)' }} />
    </div>
  );
}
