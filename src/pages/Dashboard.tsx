import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Product } from '@/types/database';
import { formatPrice, formatDate } from '@/lib/utils';
import { Plus, Package, MessageCircle, Edit, Eye, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [messagesCount, setMessagesCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile && !profile.is_artisan) {
      navigate('/');
    }
  }, [profile, navigate]);

  useEffect(() => {
    if (!profile) return;

    const fetchData = async () => {
      const [productsRes, messagesRes] = await Promise.all([
        supabase
          .from('products')
          .select('*')
          .eq('artisan_id', profile.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('messages')
          .select('id', { count: 'exact' })
          .eq('recipient_id', profile.id)
          .eq('is_read', false),
      ]);

      if (!productsRes.error) setProducts(productsRes.data as Product[]);
      if (!messagesRes.error) setMessagesCount(messagesRes.count || 0);
      setLoading(false);
    };

    fetchData();
  }, [profile]);

  if (!user) {
    navigate('/login?redirect=/dashboard');
    return null;
  }

  if (loading) {
    return (
      <Layout>
        <div className="artisan-container py-8">
          <Skeleton className="h-10 w-48 mb-8" />
          <div className="grid grid-cols-2 gap-4 mb-8">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
          <Skeleton className="h-64" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="artisan-container py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-display text-3xl font-bold text-foreground">Dashboard</h1>
          <Button variant="terracotta" asChild>
            <Link to="/create-listing">
              <Plus className="mr-2 h-4 w-4" />
              New Listing
            </Link>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          <div className="artisan-card p-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Package className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{products.length}</p>
                <p className="text-sm text-muted-foreground">Listings</p>
              </div>
            </div>
          </div>
          <div className="artisan-card p-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center">
                <MessageCircle className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{messagesCount}</p>
                <p className="text-sm text-muted-foreground">Unread Messages</p>
              </div>
            </div>
          </div>
          {/* TODO: Add sales stats when Stripe is integrated */}
        </div>

        {/* Products Table */}
        <div className="artisan-card overflow-hidden">
          <div className="p-4 border-b border-border">
            <h2 className="font-display text-xl font-semibold">Your Listings</h2>
          </div>
          {products.length === 0 ? (
            <div className="p-8 text-center">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">You haven't created any listings yet</p>
              <Button asChild>
                <Link to="/create-listing">Create Your First Listing</Link>
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {products.map((product) => (
                <div key={product.id} className="p-4 flex items-center gap-4">
                  <div className="h-16 w-16 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                    {product.images?.[0] ? (
                      <img src={product.images[0]} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-2xl">🎨</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-foreground truncate">{product.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {formatPrice(product.price)} · {product.quantity} in stock
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" asChild>
                      <Link to={`/product/${product.id}`}><Eye className="h-4 w-4" /></Link>
                    </Button>
                    <Button variant="ghost" size="icon" asChild>
                      <Link to={`/edit-listing/${product.id}`}><Edit className="h-4 w-4" /></Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
