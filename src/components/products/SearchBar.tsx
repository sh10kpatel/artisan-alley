import { Search, X } from 'lucide-react';
import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SearchBar({ value, onChange, placeholder = "Search handcrafted items..." }: SearchBarProps) {
  const [localValue, setLocalValue] = useState(value);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    onChange(localValue);
  }, [localValue, onChange]);

  const handleClear = useCallback(() => {
    setLocalValue('');
    onChange('');
  }, [onChange]);

  return (
    <form onSubmit={handleSubmit} className="relative w-full max-w-xl">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <input
          type="text"
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          placeholder={placeholder}
          className="w-full h-12 pl-12 pr-24 bg-background border border-input rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-200"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {localValue && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleClear}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
          <Button type="submit" size="sm" variant="terracotta">
            Search
          </Button>
        </div>
      </div>
    </form>
  );
}
