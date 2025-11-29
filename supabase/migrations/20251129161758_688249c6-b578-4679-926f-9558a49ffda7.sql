-- Create categories enum
CREATE TYPE product_category AS ENUM (
  'ceramics', 'woodwork', 'textiles', 'jewelry', 'leather', 'glass', 'metalwork', 'paper', 'other'
);

-- Create profiles table (extends auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  username TEXT NOT NULL UNIQUE,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  is_artisan BOOLEAN DEFAULT false,
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create products table
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artisan_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  price DECIMAL(10,2) NOT NULL CHECK (price > 0),
  quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  category product_category NOT NULL DEFAULT 'other',
  tags TEXT[] DEFAULT '{}',
  images TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create messages table
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  recipient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_products_artisan ON public.products(artisan_id);
CREATE INDEX idx_products_category ON public.products(category);
CREATE INDEX idx_products_slug ON public.products(slug);
CREATE INDEX idx_messages_sender ON public.messages(sender_id);
CREATE INDEX idx_messages_recipient ON public.messages(recipient_id);
CREATE INDEX idx_messages_product ON public.messages(product_id);
CREATE INDEX idx_profiles_username ON public.profiles(username);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Profiles are viewable by everyone" 
ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" 
ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Products policies
CREATE POLICY "Products are viewable by everyone" 
ON public.products FOR SELECT USING (is_active = true);

CREATE POLICY "Artisans can view own products" 
ON public.products FOR SELECT USING (
  artisan_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Artisans can insert own products" 
ON public.products FOR INSERT WITH CHECK (
  artisan_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Artisans can update own products" 
ON public.products FOR UPDATE USING (
  artisan_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Artisans can delete own products" 
ON public.products FOR DELETE USING (
  artisan_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);

-- Messages policies
CREATE POLICY "Users can view own messages" 
ON public.messages FOR SELECT USING (
  sender_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()) OR
  recipient_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Users can send messages" 
ON public.messages FOR INSERT WITH CHECK (
  sender_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Recipients can update messages (mark as read)" 
ON public.messages FOR UPDATE USING (
  recipient_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true);

-- Storage policies
CREATE POLICY "Product images are publicly accessible" 
ON storage.objects FOR SELECT USING (bucket_id = 'product-images');

CREATE POLICY "Authenticated users can upload product images" 
ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'product-images' AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can update own product images" 
ON storage.objects FOR UPDATE USING (
  bucket_id = 'product-images' AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can delete own product images" 
ON storage.objects FOR DELETE USING (
  bucket_id = 'product-images' AND auth.role() = 'authenticated'
);