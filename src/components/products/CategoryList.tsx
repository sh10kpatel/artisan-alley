import { CATEGORIES, ProductCategory } from '@/types/database';
import { cn } from '@/lib/utils';

interface CategoryListProps {
  selected?: ProductCategory | null;
  onSelect: (category: ProductCategory | null) => void;
}

export function CategoryList({ selected, onSelect }: CategoryListProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onSelect(null)}
        className={cn(
          "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
          !selected
            ? "bg-primary text-primary-foreground shadow-soft"
            : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
        )}
      >
        All
      </button>
      {CATEGORIES.map((category) => (
        <button
          key={category.value}
          onClick={() => onSelect(category.value)}
          className={cn(
            "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-1.5",
            selected === category.value
              ? "bg-primary text-primary-foreground shadow-soft"
              : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
          )}
        >
          <span>{category.icon}</span>
          <span>{category.label}</span>
        </button>
      ))}
    </div>
  );
}
