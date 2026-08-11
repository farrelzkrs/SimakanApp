import type { SQLiteDatabase } from 'expo-sqlite';
import type { MovementType, StockMovement } from '../models/StockMovement';

export class StockMovementRepository {
  constructor(private db: SQLiteDatabase) {}

  async findByItem(itemId: number, limit: number = 50): Promise<StockMovement[]> {
    return this.db.getAllAsync<StockMovement>(
      'SELECT * FROM stock_movements WHERE item_id = ? ORDER BY created_at DESC LIMIT ?',
      [itemId, limit]
    );
  }

  async findByTransaction(transactionId: number): Promise<StockMovement[]> {
    return this.db.getAllAsync<StockMovement>(
      'SELECT * FROM stock_movements WHERE transaction_id = ? ORDER BY created_at DESC',
      [transactionId]
    );
  }

  async create(params: {
    itemId: number;
    transactionId: number | null;
    movementType: MovementType;
    quantity: number;
    stockBefore: number;
    stockAfter: number;
    description?: string;
  }): Promise<number> {
    const result = await this.db.runAsync(
      `INSERT INTO stock_movements (item_id, transaction_id, movement_type, quantity, stock_before, stock_after, description)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        params.itemId,
        params.transactionId,
        params.movementType,
        params.quantity,
        params.stockBefore,
        params.stockAfter,
        params.description ?? null,
      ]
    );
    return result.lastInsertRowId;
  }

  async getLatestByItem(itemId: number): Promise<StockMovement | null> {
    return this.db.getFirstAsync<StockMovement>(
      'SELECT * FROM stock_movements WHERE item_id = ? ORDER BY created_at DESC LIMIT 1',
      [itemId]
    );
  }
}
