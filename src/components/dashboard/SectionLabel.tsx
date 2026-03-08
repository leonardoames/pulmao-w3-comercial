interface SectionLabelProps {
  title: string;
}

export function SectionLabel({ title }: SectionLabelProps) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-1 h-4 bg-primary rounded-full" />
      <h2
        className="section-label-text"
        style={{ color: 'rgba(255,255,255,0.4)' }}
      >
        {title}
      </h2>
      <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
    </div>
  );
}
