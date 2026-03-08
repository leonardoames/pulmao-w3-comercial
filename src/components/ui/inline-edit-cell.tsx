import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InlineEditCellProps {
  value: string;
  onSave: (value: string) => void;
  type?: 'text' | 'number' | 'date' | 'currency';
  className?: string;
  displayValue?: string;
}

export function InlineEditCell({ value, onSave, type = 'text', className, displayValue }: InlineEditCellProps) {
  const [editing, setEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const handleStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setTempValue(value);
    setEditing(true);
  };

  const handleSave = () => {
    if (tempValue !== value) {
      onSave(tempValue);
    }
    setEditing(false);
  };

  const handleCancel = () => {
    setTempValue(value);
    setEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') handleCancel();
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
        <Input
          ref={inputRef}
          type={type === 'currency' ? 'text' : type}
          value={tempValue}
          onChange={e => setTempValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          className="h-7 text-sm px-2 py-0"
          style={{
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(249,115,22,0.5)',
            minWidth: type === 'date' ? '140px' : '80px',
            maxWidth: '160px',
          }}
        />
      </div>
    );
  }

  return (
    <span
      className={cn('cursor-pointer hover:bg-white/5 rounded px-1.5 py-0.5 -mx-1.5 transition-colors', className)}
      onClick={handleStart}
      title="Clique para editar"
    >
      {displayValue || value || '—'}
    </span>
  );
}
