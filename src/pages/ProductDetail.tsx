import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Product, CATEGORIES } from '@/types/database';
import { useAuth } from '@/hooks/useAuth';
import { formatPrice, formatDate } from '@/lib/utils';
import { 
  ChevronLeft, 
  ChevronRight, 
  MessageCircle, 
  Store, 
  MapPin,
  ArrowLeft
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProductDetail() {
  const { product_id } = useParams<{ product_id: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!product_id) return;

      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          artisan:profiles(*)
        `)
        .eq('id', product_id)
        .maybeSingle();

      if (!error && data) {
        setProduct(data as Product);
      }
      setLoading(false);
    };

    fetchProduct();
  }, [product_id]);

  const handleMessageSeller = () => {
    if (!user) {
      navigate(`/login?redirect=/product/${product_id}`);
      return;
    }
    navigate(`/messages?to=${product?.artisan_id}&product=${product_id}`);
  };

  const categoryInfo = product ? CATEGORIES.find(c => c.value === product.category) : null;

  const nextImage = () => {
    if (product?.images && product.images.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % product.images.length);
    }
  };

  const prevImage = () => {
    if (product?.images && product.images.length > 1) {
      setCurrentImageIndex((prev) => 
        prev === 0 ? product.images.length - 1 : prev - 1
      );
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="artisan-container py-8">
          <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
            <Skeleton className="aspect-square rounded-xl" />
            <div className="space-y-4">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-8 w-1/4" />
              <Skeleton className="h-32 w-full" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!product) {
    return (
      <Layout>
        <div className="artisan-container py-16 text-center">
          <span className="text-6xl mb-4 block">🔍</span>
          <h1 className="font-display text-2xl font-bold text-foreground mb-2">
            Product not found
          </h1>
          <p className="text-muted-foreground mb-6">
            This product may have been removed or doesn't exist.
          </p>
          <Button asChild>
            <Link to="/">Browse Products</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const isOwner = profile?.id === product.artisan_id;

  return (
    <Layout>
      <div className="artisan-container py-8">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          className="mb-6" 
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {/* Image Carousel */}
          <div className="space-y-4">
            <div className="relative aspect-square bg-muted rounded-xl overflow-hidden">
              {product.images && product.images.length > 0 ? (
                <>
                  <img
                    src={product.images[currentImageIndex]}
                    alt={`${product.title} - Image ${currentImageIndex + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {product.images.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/80 backdrop-blur flex items-center justify-center hover:bg-background transition-colors"
                      >
                        <ChevronLeft className="h-6 w-6" />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/80 backdrop-blur flex items-center justify-center hover:bg-background transition-colors"
                      >
                        <ChevronRight className="h-6 w-6" />
                      </button>
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                        {product.images.map((_, idx) => (
                          <button
                            key={idx}
                            onClick={() => setCurrentImageIndex(idx)}
                            className={`h-2 w-2 rounded-full transition-colors ${
                              idx === currentImageIndex
                                ? 'bg-primary'
                                : 'bg-background/60'
                            }`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="h-full w-full flex items-center justify-center text-8xl bg-gradient-to-br from-sand to-cream-dark">
                  🎨
                </div>
              )}
            </div>

            {/* Thumbnail strip */}
            {product.images && product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                      idx === currentImageIndex
                        ? 'border-primary'
                        : 'border-transparent'
                    }`}
                  >
                    <img
                      src={img}
                      alt={`Thumbnail ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Category */}
            {categoryInfo && (
              <Link 
                to={`/?category=${product.category}`}
                className="artisan-badge"
              >
                {categoryInfo.icon} {categoryInfo.label}
              </Link>
            )}

            {/* Title */}
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">
              {product.title}
            </h1>

            {/* Artisan */}
            {product.artisan && (
              <Link 
                to={`/shop/${product.artisan.id}`}
                className="flex items-center gap-3 group"
              >
                <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center overflow-hidden">
                  {product.artisan.avatar_url ? (
                    <img 
                      src={product.artisan.avatar_url} 
                      alt={product.artisan.display_name || ''} 
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Store className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-foreground group-hover:text-primary transition-colors">
                    {product.artisan.display_name || product.artisan.username}
                  </p>
                  {product.artisan.location && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {product.artisan.location}
                    </p>
                  )}
                </div>
              </Link>
            )}

            {/* Price & Quantity */}
            <div className="flex items-end gap-4">
              <span className="font-display text-4xl font-bold text-primary">
                {formatPrice(product.price)}
              </span>
              {product.quantity > 0 ? (
                <span className="text-accent font-medium pb-1">
                  {product.quantity} available
                </span>
              ) : (
                <span className="text-destructive font-medium pb-1">
                  Sold out
                </span>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <div className="prose prose-muted max-w-none">
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {product.description}
                </p>
              </div>
            )}

            {/* Tags */}
            {product.tags && product.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {product.tags.map((tag) => (
                  <Link
                    key={tag}
                    to={`/?q=${tag}`}
                    className="px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-sm hover:bg-secondary/80 transition-colors"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              {isOwner ? (
                <Button variant="outline" size="lg" asChild className="flex-1">
                  <Link to={`/edit-listing/${product.id}`}>
                    Edit Listing
                  </Link>
                </Button>
              ) : (
                <>
                  {/* TODO: Add to cart functionality - integrate Stripe here */}
                  <Button 
                    variant="hero" 
                    size="lg" 
                    className="flex-1"
                    disabled={product.quantity === 0}
                  >
                    {product.quantity > 0 ? 'Buy Now' : 'Sold Out'}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="lg"
                    onClick={handleMessageSeller}
                  >
                    <MessageCircle className="mr-2 h-5 w-5" />
                    Message
                  </Button>
                </>
              )}
            </div>

            {/* Meta */}
            <p className="text-xs text-muted-foreground pt-4">
              Listed on {formatDate(product.created_at)}
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
