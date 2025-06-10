import { X } from 'lucide-react';
import { ReactNode, useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Label } from './label';

const PillInput = ({
  renderTooltip,
  tooltipContent,
  placeholder,
  id,
  label,
  onChange,
  initialValues,
  className,
}: {
  renderTooltip?: (content: ReactNode, className?: string) => ReactNode;
  tooltipContent?: ReactNode;
  placeholder?: string;
  id: string;
  label: string;
  onChange: (values: string[]) => void;
  initialValues?: string[];
  className?: string;
}) => {
  const [values, setValues] = useState<string[]>(initialValues ?? []);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === ',' || e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      const currValue = e.currentTarget.value.trim();
      if (!currValue) return;
      setValues([...values, currValue]);
      e.currentTarget.value = '';
    }
    if (e.key === 'Backspace' && e.currentTarget.value === '') {
      setValues(values.slice(0, -1));
    }
  };

  useEffect(() => {
    onChange(values);
  }, [values, onChange]);

  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor={id}>
        {label} {renderTooltip?.(tooltipContent, 'static')}
      </Label>
      <div
        className={cn(
          'file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex min-h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
          'flex flex-wrap items-center gap-2',
          'focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]',
          'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive'
        )}
      >
        {values.map((value, index) => (
          <span
            key={index}
            className="inline-flex items-center gap-1 rounded-sm bg-secondary px-2 py-0.5 text-sm text-secondary-foreground"
          >
            {value}
            <X
              onClick={() => {
                setValues(values.filter((_, i) => i !== index));
                inputRef.current?.focus();
              }}
              className="h-3 w-3 cursor-pointer opacity-70 hover:opacity-100"
            />
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          id={id}
          onKeyDown={handleKeyDown}
          placeholder={values.length === 0 ? placeholder : ''}
          className="flex-1 bg-transparent border-none p-0 m-0 text-base md:text-sm leading-normal outline-none focus:ring-0 focus:border-none min-w-[100px]"
        />
      </div>
    </div>
  );
};

export default PillInput;
