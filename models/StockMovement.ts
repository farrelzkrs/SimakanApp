export type MovementType = 'IN' | 'OUT' | 'ADJUSTMENT';

export interface StockMovement {
  id: number;
  item_id: number;
  transaction_id: number | null;
  movement_type: MovementType;
  quantity: number;
  stock_before: number;
  stock_after: number;
  description: string | null;
  created_at: string;
}
