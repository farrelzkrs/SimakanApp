export type MovementType = 'IN' | 'OUT' | 'ADJUSTMENT';

export interface StockMovement {
  id: string;
  item_id: string;
  transaction_id: string | null;
  movement_type: MovementType;
  quantity: number;
  stock_before: number;
  stock_after: number;
  description: string | null;
  created_at: string;
}
