export type Product = {
  id: string;
  brand: string;
  name: string;
  color?: string;
  price: number;
  sizes: string[];
  description?: string;
  images: string[];
  isFavorite: boolean;
  isActive: boolean;
  createdAt: string;
};

export const fallbackProducts: Product[] = [];

export const products = fallbackProducts;
