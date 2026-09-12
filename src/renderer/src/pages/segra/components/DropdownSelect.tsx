import React, { useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

export interface DropdownItem {
  value: string;
  label: React.ReactNode;
}

interface DropdownSelectProps {
  items: DropdownItem[];
  value: string | undefined;
  onChange: (value: string) => void;
  placeholder?: React.ReactNode;
  buttonClassName?: string;
  menuClassName?: string;
  itemClassName?: string;
  disabled?: boolean;
  align?: 'start' | 'end';
  size?: 'sm' | 'md' | 'lg';
}

export default function DropdownSelect({
  items, value, onChange, placeholder = 'Select', buttonClassName, menuClassName,
  itemClassName = 'justify-start text-sm font-medium hover:bg-chibangarx-border-secondary rounded-lg transition-all',
  disabled = false, align = 'end', size = 'md',
}: DropdownSelectProps) {
  const selected = items.find((i) => i.value === value);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [openDirection, setOpenDirection] = useState<'down' | 'up'>('down');

  const handleToggle = () => {
    if (disabled) return;
    if (!isOpen) {
      const btn = containerRef.current?.querySelector('button');
      if (btn) {
        const rect = btn.getBoundingClientRect();
        setOpenDirection(rect.bottom + 200 > window.innerHeight ? 'up' : 'down');
      }
    }
    setIsOpen(!isOpen);
  };

  const sizeBtn = size === 'sm' ? 'px-3 py-1.5 text-xs' : size === 'lg' ? 'px-5 py-3 text-base' : 'px-4 py-2 text-sm';

  return (
    <div ref={containerRef} className={`relative w-full ${align === 'end' ? 'text-right' : ''}`}>
      <button
        type="button"
        disabled={disabled}
        className={`${buttonClassName ?? `w-full flex items-center justify-between gap-2 bg-chibangarx-card border border-chibangarx-border rounded-lg ${sizeBtn} text-chibangarx-text`} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onClick={handleToggle}
      >
        <span className="flex-1 text-left truncate">{selected ? selected.label : placeholder}</span>
        <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div
          className={`absolute z-[999] w-full bg-chibangarx-card border border-chibangarx-border rounded-xl shadow-xl p-1 max-h-60 overflow-y-auto ${openDirection === 'up' ? 'bottom-full mb-1' : 'top-full mt-1'}`}
        >
          {items.map((item) => (
            <button
              key={item.value}
              type="button"
              className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                item.value === value ? 'text-chibangarx-primary bg-chibangarx-primary/10' : 'text-chibangarx-text hover:bg-chibangarx-border-secondary'
              } ${itemClassName}`}
              onClick={() => { onChange(item.value); setIsOpen(false); }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
