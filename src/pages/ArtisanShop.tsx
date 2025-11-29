import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { ProductList } from '@/components/products/ProductList';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Product, Profile } from '@/types/database';
import { useAuth } from '@/hooks/useAuth';
import { formatDate } from '@/lib/utils';
import { MapPin, Calendar, MessageCircle, Plus, Store } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function ArtisanShop() {
  const { artisan_id } = useParams<{ artisan_id: string }>();
  const { profile: currentUser } = useAuth();
  const [artisan, setArtisan] = useState<Profile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArtisan = async () => {
      if (!artisan_id) return;

      const [artisanRes, productsRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('*')
          .eq('id', artisan_id)
          .maybeSingle(),
        supabase
          .from('products')
          .select('*')
          .eq('artisan_id', artisan_id)
          .eq('is_active', true)
          .order('created_at', { ascending: false }),
      ]);

      if (!artisanRes.error && artisanRes.data) {
        setArtisan(artisanRes.data as Profile);
      }
      if (!productsRes.error && productsRes.data) {
        setProducts(productsRes.data as Product[]);
      }
      setLoading(false);
    };

    fetchArtisan();
  }, [artisan_id]);

  const isOwner = currentUser?.id === artisan_id;

  if (loading) {
    return (
      <Layout>
        <div className="bg-gradient-to-br from-cream via-sand/30 to-cream-dark py-12">
          <div className="artisan-container">
            <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
              <Skeleton className="h-32 w-32 rounded-full" />
              <div className="space-y-3 flex-1">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-20 w-full max-w-md" />
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!artisan) {
    return (
      <Layout>
        <div className="artisan-container py-16 text-center">
          <span className="text-6xl mb-4 block">🔍</span>
          <h1 className="font-display text-2xl font-bold text-foreground mb-2">
            Artisan not found
          </h1>
          <p className="text-muted-foreground mb-6">
            This shop may have been removed or doesn't exist.
          </p>
          <Button asChild>
            <Link to="/">Browse Products</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Header */}
      <div className="bg-gradient-to-br from-cream via-sand/30 to-cream-dark py-12">
        <div className="artisan-container">
          <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
            {/* Avatar */}
            <div className="h-32 w-32 rounded-full bg-secondary flex items-center justify-center overflow-hidden border-4 border-background shadow-elevated">
              {artisan.avatar_url ? (
                <img 
                  src={artisan.avatar_url} 
                  alt={artisan.display_name || ''} 
                  className="h-full w-full object-cover"
                />
              ) : (
                <Store className="h-12 w-12 text-muted-foreground" />
              )}
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="font-display text-3xl font-bold text-foreground mb-1">
                {artisan.display_name || artisan.username}
              </h1>
              <p className="text-muted-foreground mb-3">@{artisan.username}</p>
              
              <div className="flex flex-wrap gap-4 justify-center md:justify-start text-sm text-muted-foreground mb-4">
                {artisan.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {artisan.location}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Joined {formatDate(artisan.created_at)}
                </span>
              </div>

              {artisan.bio && (
                <p className="text-muted-foreground max-w-xl">
                  {artisan.bio}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              {isOwner ? (
                <Button variant="terracotta" asChild>
                  <Link to="/create-listing">
                    <Plus className="mr-2 h-4 w-4" />
                    New Listing
                  </Link>
                </Button>
              ) : (
                <Button variant="outline" asChild>
                  <Link to={`/messages?to=${artisan.id}`}>
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Message
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Products */}
      <div className="artisan-container py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-2xl font-semibold text-foreground">
            Products
          </h2>
          <span className="text-sm text-muted-foreground">
            {products.length} {products.length === 1 ? 'item' : 'items'}
          </span>
        </div>

        <ProductList 
          products={products}
          emptyMessage={
            isOwner 
              ? "You haven't listed any products yet" 
              : "This artisan hasn't listed any products yet"
          }
        />
      </div>
    </Layout>
  );
}
