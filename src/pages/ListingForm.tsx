import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { CATEGORIES, Product, ProductCategory } from '@/types/database';
import { generateSlug } from '@/lib/utils';
import { z } from 'zod';
import { Loader2, Upload, X, ImagePlus } from 'lucide-react';

const listingSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100, 'Title must be less than 100 characters'),
  description: z.string().max(2000, 'Description must be less than 2000 characters').optional(),
  price: z.number().positive('Price must be greater than 0'),
  quantity: z.number().min(0, 'Quantity must be 0 or more').int('Quantity must be a whole number'),
  category: z.string(),
  tags: z.array(z.string()),
});

interface ListingFormProps {
  mode: 'create' | 'edit';
}

export default function ListingForm({ mode }: ListingFormProps) {
  const { product_id } = useParams<{ product_id: string }>();
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const { toast } = useToast();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [category, setCategory] = useState<ProductCategory>('other');
  const [tagsInput, setTagsInput] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(mode === 'edit');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch existing product for edit mode
  useEffect(() => {
    if (mode === 'edit' && product_id) {
      const fetchProduct = async () => {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('id', product_id)
          .maybeSingle();

        if (!error && data) {
          const product = data as Product;
          setTitle(product.title);
          setDescription(product.description || '');
          setPrice(product.price.toString());
          setQuantity(product.quantity.toString());
          setCategory(product.category);
          setTagsInput((product.tags || []).join(', '));
          setImages(product.images || []);
        }
        setInitialLoading(false);
      };

      fetchProduct();
    }
  }, [mode, product_id]);

  // Redirect non-artisans
  useEffect(() => {
    if (profile && !profile.is_artisan) {
      navigate('/');
      toast({
        title: 'Access denied',
        description: 'Only artisans can create listings.',
        variant: 'destructive',
      });
    }
  }, [profile, navigate, toast]);

  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !user) return;

    setUploading(true);
    const newImages: string[] = [];

    try {
      for (const file of Array.from(files)) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
          .from('product-images')
          .getPublicUrl(fileName);

        newImages.push(data.publicUrl);
      }

      setImages((prev) => [...prev, ...newImages]);
      toast({
        title: 'Images uploaded',
        description: `${newImages.length} image(s) uploaded successfully.`,
      });
    } catch (error: any) {
      toast({
        title: 'Upload failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  }, [user, toast]);

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setErrors({});
    setLoading(true);

    const tags = tagsInput
      .split(',')
      .map((tag) => tag.trim().toLowerCase())
      .filter((tag) => tag.length > 0);

    const formData = {
      title: title.trim(),
      description: description.trim(),
      price: parseFloat(price),
      quantity: parseInt(quantity, 10),
      category,
      tags,
    };

    const result = listingSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      setLoading(false);
      return;
    }

    try {
      const slug = generateSlug(title) + '-' + Date.now().toString(36);

      const productData = {
        title: formData.title,
        description: formData.description || null,
        price: formData.price,
        quantity: formData.quantity,
        category: formData.category,
        tags: formData.tags,
        images,
        slug,
        artisan_id: profile.id,
      };

      if (mode === 'edit' && product_id) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', product_id);

        if (error) throw error;

        toast({
          title: 'Listing updated',
          description: 'Your product has been updated successfully.',
        });
      } else {
        const { error } = await supabase
          .from('products')
          .insert(productData);

        if (error) throw error;

        toast({
          title: 'Listing created',
          description: 'Your product is now live!',
        });
      }

      navigate('/dashboard');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    navigate('/login?redirect=/create-listing');
    return null;
  }

  if (initialLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="artisan-container py-8 max-w-2xl">
        <h1 className="font-display text-3xl font-bold text-foreground mb-8">
          {mode === 'create' ? 'Create New Listing' : 'Edit Listing'}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Images */}
          <div className="space-y-3">
            <Label>Product Images</Label>
            <div className="flex flex-wrap gap-3">
              {images.map((img, idx) => (
                <div 
                  key={idx} 
                  className="relative w-24 h-24 rounded-lg overflow-hidden group"
                >
                  <img 
                    src={img} 
                    alt={`Product ${idx + 1}`} 
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute top-1 right-1 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <label className="w-24 h-24 rounded-lg border-2 border-dashed border-input hover:border-primary cursor-pointer flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-primary transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={uploading}
                />
                {uploading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <>
                    <ImagePlus className="h-6 w-6" />
                    <span className="text-xs">Add</span>
                  </>
                )}
              </label>
            </div>
            <p className="text-xs text-muted-foreground">
              Upload up to 10 images. First image will be the cover.
            </p>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="artisan-input"
              placeholder="Handmade ceramic vase"
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="artisan-input min-h-[120px]"
              placeholder="Tell buyers about your product..."
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description}</p>
            )}
          </div>

          {/* Price & Quantity */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price (USD) *</Label>
              <input
                id="price"
                type="number"
                step="0.01"
                min="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="artisan-input"
                placeholder="0.00"
              />
              {errors.price && (
                <p className="text-sm text-destructive">{errors.price}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity *</Label>
              <input
                id="quantity"
                type="number"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="artisan-input"
                placeholder="1"
              />
              {errors.quantity && (
                <p className="text-sm text-destructive">{errors.quantity}</p>
              )}
            </div>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>Category *</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as ProductCategory)}>
              <SelectTrigger className="artisan-input">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.icon} {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <input
              id="tags"
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="artisan-input"
              placeholder="handmade, vintage, gift (comma separated)"
            />
            <p className="text-xs text-muted-foreground">
              Add tags to help buyers find your product
            </p>
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="hero"
              className="flex-1"
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === 'create' ? 'Create Listing' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
