import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { ProductList } from '@/components/products/ProductList';
import { CategoryList } from '@/components/products/CategoryList';
import { SearchBar } from '@/components/products/SearchBar';
import { supabase } from '@/integrations/supabase/client';
import { Product, ProductCategory } from '@/types/database';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export default function Index() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [category, setCategory] = useState<ProductCategory | null>(
    (searchParams.get('category') as ProductCategory) || null
  );

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);

      let query = supabase
        .from('products')
        .select(`
          *,
          artisan:profiles(*)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (category) {
        query = query.eq('category', category);
      }

      if (search) {
        query = query.or(`title.ilike.%${search}%,tags.cs.{${search}}`);
      }

      const { data, error } = await query;

      if (!error && data) {
        setProducts(data as Product[]);
      }
      setLoading(false);
    };

    fetchProducts();
  }, [category, search]);

  const handleCategoryChange = (newCategory: ProductCategory | null) => {
    setCategory(newCategory);
    if (newCategory) {
      searchParams.set('category', newCategory);
    } else {
      searchParams.delete('category');
    }
    setSearchParams(searchParams);
  };

  const handleSearchChange = (newSearch: string) => {
    setSearch(newSearch);
    if (newSearch) {
      searchParams.set('q', newSearch);
    } else {
      searchParams.delete('q');
    }
    setSearchParams(searchParams);
  };

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-cream via-sand/30 to-cream-dark py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 text-8xl">🏺</div>
          <div className="absolute bottom-10 right-10 text-8xl">🧶</div>
          <div className="absolute top-1/2 left-1/3 text-6xl">✨</div>
        </div>
        <div className="artisan-container relative">
          <div className="max-w-3xl mx-auto text-center animate-fade-in">
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 text-balance">
              Discover Unique{' '}
              <span className="text-primary">Handcrafted</span>{' '}
              Treasures
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Connect with talented artisans and find one-of-a-kind pieces 
              that tell a story. Every item is made with love and care.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <SearchBar value={search} onChange={handleSearchChange} />
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="artisan-container py-12">
        {/* Categories */}
        <div className="mb-8">
          <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
            Browse Categories
          </h2>
          <CategoryList selected={category} onSelect={handleCategoryChange} />
        </div>

        {/* Results Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-2xl font-semibold text-foreground">
            {category ? `${category.charAt(0).toUpperCase() + category.slice(1)}` : 'Latest Products'}
            {search && ` matching "${search}"`}
          </h2>
          {!loading && (
            <span className="text-sm text-muted-foreground">
              {products.length} {products.length === 1 ? 'item' : 'items'}
            </span>
          )}
        </div>

        {/* Product Grid */}
        <ProductList 
          products={products} 
          loading={loading}
          emptyMessage={
            search 
              ? `No results for "${search}"` 
              : category 
                ? `No ${category} products yet` 
                : "No products yet"
          }
        />
      </section>

      {/* CTA Section */}
      <section className="bg-primary/5 py-16">
        <div className="artisan-container text-center">
          <h2 className="font-display text-3xl font-bold text-foreground mb-4">
            Are you an artisan?
          </h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            Join our community of talented makers and start selling your handcrafted goods today.
          </p>
          <Button variant="hero" size="lg" asChild>
            <Link to="/signup">
              Start Selling
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>
    </Layout>
  );
}
