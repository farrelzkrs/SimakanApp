export type TransactionType = 'IN' | 'OUT';
export type PaymentMethod = 'Cash' | 'Lunas' | 'Transfer' | 'QRIS' | 'Hutang';

export interface Transaction {
  id: number;
  transaction_no: string | null;
  transaction_date: string;
  transaction_type: TransactionType;
  category_id: number;
  cash_id: number;
  item_id: number | null;
  quantity: number;
  unit_price: number;
  nominal: number;
  payment_method: PaymentMethod | null;
  reference_number: string | null;
  attachment: string | null;
  description: string | null;
  created_at: string;
  created_by: number | null;
  updated_at: string | null;
  updated_by: number | null;
  deleted_at: string | null;
  is_deleted: boolean;
}

export interface TransactionWithCategory extends Transaction {
  category_name: string;
  category_icon: string | null;
  category_color: string | null;
}

export type CreateTransactionInput = {
  transaction_date: string;
  transaction_type: TransactionType;
  category_id: number;
  cash_id?: number;
  item_id?: number;
  quantity?: number;
  unit_price?: number;
  nominal: number;
  payment_method?: PaymentMethod;
  reference_number?: string;
  attachment?: string;
  description?: string;
  created_by?: number;
};
