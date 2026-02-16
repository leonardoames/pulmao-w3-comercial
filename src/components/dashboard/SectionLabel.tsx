interface SectionLabelProps {
  title: string;
}

export function SectionLabel({ title }: SectionLabelProps) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h2>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}
