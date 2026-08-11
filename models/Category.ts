export interface Category {
  id: number;
  code: string | null;
  name: string;
  transaction_type: 'IN' | 'OUT';
  icon: string | null;
  color: string | null;
  is_active: boolean;
  created_at: string;
  created_by: number | null;
  updated_at: string | null;
  updated_by: number | null;
  deleted_at: string | null;
  is_deleted: boolean;
}

export type CreateCategoryInput = Pick<Category, 'name' | 'transaction_type'> & {
  code?: string;
  icon?: string;
  color?: string;
  created_by?: number;
};

export type UpdateCategoryInput = Partial<Pick<Category, 'name' | 'transaction_type' | 'code' | 'icon' | 'color' | 'is_active'>> & {
  updated_by?: number;
};
