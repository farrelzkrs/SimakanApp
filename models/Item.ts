export interface Item {
  id: number;
  code: string | null;
  barcode: string | null;
  name: string;
  category: string | null;
  purchase_price: number;
  selling_price: number;
  stock: number;
  minimum_stock: number;
  unit: string | null;
  photo: string | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
  created_by: number | null;
  updated_at: string | null;
  updated_by: number | null;
  deleted_at: string | null;
  is_deleted: boolean;
}

export type CreateItemInput = Pick<Item, 'name'> & {
  code?: string;
  barcode?: string;
  category?: string;
  purchase_price?: number;
  selling_price?: number;
  stock?: number;
  minimum_stock?: number;
  unit?: string;
  photo?: string;
  description?: string;
  created_by?: number;
};

export type UpdateItemInput = Partial<Pick<
  Item,
  'code' | 'barcode' | 'name' | 'category' | 'purchase_price' | 'selling_price' |
  'minimum_stock' | 'unit' | 'photo' | 'description' | 'is_active'
>> & {
  updated_by?: number;
};
