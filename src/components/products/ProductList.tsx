import { Product } from '@/types/database';
import { ProductCard } from './ProductCard';
import { ProductCardSkeleton } from './ProductCardSkeleton';

interface ProductListProps {
  products: Product[];
  loading?: boolean;
  emptyMessage?: string;
}

export function ProductList({ products, loading, emptyMessage = "No products found" }: ProductListProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-16">
        <span className="text-6xl mb-4 block">🎨</span>
        <h3 className="font-display text-xl font-semibold text-foreground mb-2">
          {emptyMessage}
        </h3>
        <p className="text-muted-foreground">
          Try adjusting your search or browse different categories.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-fade-in">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
