// ✅ Penyesuaian tipe agar sesuai struktur dari Supabase (nullable dan array relasi)
export enum ProductStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING_REVIEW = 'pending_review'
}


export interface User {
  id: string;
  name?: string;
  username?: string;
  email?: string;
  role?: string;
  first_name?: string;
  last_name?: string;

  // ✅ Tambahan untuk hindari error
  phone?: string;
}


export interface Store {
  id: string;
  user_id: string;
  store_name: string;
  store_description?: string | null;
  contact_whatsapp?: string | null;
  e_commerce_link?: string | null;
  store_logo_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Product {
  id: string | null;
  name: string;
  price: number;
  contact_wa?: string | null;
  ecommerce_link?: string | null;
  created_at?: string;
  image_url?: string | null;
  created_by?: string;
  store_id: string | null;
  category?: string;
  status?: ProductStatus;
  description?: string;

  // Relasi
  store?: Store | null;
  created_by_user?: User | null;
}
