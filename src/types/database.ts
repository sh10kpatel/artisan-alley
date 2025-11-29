export type ProductCategory = 
  | 'ceramics' 
  | 'woodwork' 
  | 'textiles' 
  | 'jewelry' 
  | 'leather' 
  | 'glass' 
  | 'metalwork' 
  | 'paper' 
  | 'other';

export interface Profile {
  id: string;
  user_id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  is_artisan: boolean;
  location: string | null;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  artisan_id: string;
  title: string;
  slug: string;
  description: string | null;
  price: number;
  quantity: number;
  category: ProductCategory;
  tags: string[];
  images: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Joined data
  artisan?: Profile;
}

export interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  product_id: string | null;
  content: string;
  is_read: boolean;
  created_at: string;
  // Joined data
  sender?: Profile;
  recipient?: Profile;
  product?: Product;
}

export interface MessageThread {
  peer: Profile;
  product: Product | null;
  lastMessage: Message;
  unreadCount: number;
}

export const CATEGORIES: { value: ProductCategory; label: string; icon: string }[] = [
  { value: 'ceramics', label: 'Ceramics', icon: '🏺' },
  { value: 'woodwork', label: 'Woodwork', icon: '🪵' },
  { value: 'textiles', label: 'Textiles', icon: '🧶' },
  { value: 'jewelry', label: 'Jewelry', icon: '💎' },
  { value: 'leather', label: 'Leather', icon: '👜' },
  { value: 'glass', label: 'Glass', icon: '🫙' },
  { value: 'metalwork', label: 'Metalwork', icon: '⚙️' },
  { value: 'paper', label: 'Paper', icon: '📜' },
  { value: 'other', label: 'Other', icon: '✨' },
];
