import { Link } from 'react-router-dom';
import { Product } from '@/types/database';
import { formatPrice } from '@/lib/utils';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const mainImage = product.images?.[0];

  return (
    <Link to={`/product/${product.id}`} className="group">
      <article className="artisan-card">
        {/* Image */}
        <div className="aspect-[4/5] overflow-hidden bg-muted">
          {mainImage ? (
            <img
              src={mainImage}
              alt={product.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-4xl bg-gradient-to-br from-sand to-cream-dark">
              🎨
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-display text-lg font-semibold text-foreground truncate group-hover:text-primary transition-colors">
            {product.title}
          </h3>
          
          {product.artisan && (
            <p className="text-sm text-muted-foreground mt-1">
              by {product.artisan.display_name || product.artisan.username}
            </p>
          )}

          <div className="flex items-center justify-between mt-3">
            <span className="font-display text-xl font-bold text-primary">
              {formatPrice(product.price)}
            </span>
            
            {product.quantity > 0 ? (
              <span className="text-xs text-accent font-medium">
                {product.quantity} available
              </span>
            ) : (
              <span className="text-xs text-destructive font-medium">
                Sold out
              </span>
            )}
          </div>

          {product.tags && product.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
              {product.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </article>
    </Link>
  );
}
