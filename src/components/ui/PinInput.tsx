import { useRef, KeyboardEvent } from 'react';

interface PinInputProps {
  value: string;
  onChange: (val: string) => void;
  length?: number;
  disabled?: boolean;
  error?: boolean;
}

export function PinInput({ value, onChange, length = 6, disabled, error }: PinInputProps) {
  const inputs = useRef<Array<HTMLInputElement | null>>([]);
  const digits  = value.padEnd(length, ' ').split('').slice(0, length);

  const update = (index: number, char: string) => {
    const next = digits.slice();
    next[index] = char;
    onChange(next.join('').trimEnd());
  };

  const handleChange = (i: number, raw: string) => {
    const d = raw.replace(/\D/g, '').slice(-1);
    update(i, d || ' ');
    if (d && i < length - 1) inputs.current[i + 1]?.focus();
  };

  const handleKey = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (digits[i]?.trim()) { update(i, ' '); }
      else if (i > 0) { inputs.current[i - 1]?.focus(); update(i - 1, ' '); }
    } else if (e.key === 'ArrowLeft' && i > 0) {
      inputs.current[i - 1]?.focus();
    } else if (e.key === 'ArrowRight' && i < length - 1) {
      inputs.current[i + 1]?.focus();
    }
  };

  return (
    <div className="flex gap-2 justify-center">
      {digits.map((d, i) => {
        const filled = d.trim() !== '';
        return (
          <input
            key={i}
            ref={el => { inputs.current[i] = el; }}
            type="password"
            inputMode="numeric"
            maxLength={1}
            value={d.trim()}
            disabled={disabled}
            onChange={e => handleChange(i, e.target.value)}
            onKeyDown={e => handleKey(i, e)}
            onFocus={e => e.target.select()}
            className="w-12 h-14 text-center text-xl font-bold rounded-xl border-2 outline-none transition-all"
            style={{
              borderColor: error ? '#FF4757' : filled ? '#00C27C' : '#CBD3E8',
              background: error ? 'rgba(255,71,87,0.05)' : filled ? '#D6F5EA' : '#F4F6FB',
              color: '#0D1B3E',
            }}
            aria-label={`PIN digit ${i + 1}`}
          />
        );
      })}
    </div>
  );
}
