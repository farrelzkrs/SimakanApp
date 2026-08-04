import type { SQLiteDatabase } from 'expo-sqlite';
import type { MovementType, StockMovement } from '../models/StockMovement';
import { generateId } from '../utils/generateId';

export class StockMovementRepository {
  constructor(private db: SQLiteDatabase) {}

  async findByItem(itemId: string, limit: number = 50): Promise<StockMovement[]> {
    return this.db.getAllAsync<StockMovement>(
      'SELECT * FROM stock_movements WHERE item_id = ? ORDER BY created_at DESC LIMIT ?',
      [itemId, limit]
    );
  }

  async findByTransaction(transactionId: string): Promise<StockMovement[]> {
    return this.db.getAllAsync<StockMovement>(
      'SELECT * FROM stock_movements WHERE transaction_id = ? ORDER BY created_at DESC',
      [transactionId]
    );
  }

  async create(params: {
    itemId: string;
    transactionId: string | null;
    movementType: MovementType;
    quantity: number;
    stockBefore: number;
    stockAfter: number;
    description?: string;
  }): Promise<string> {
    const id = generateId('STM');
    await this.db.runAsync(
      `INSERT INTO stock_movements (id, item_id, transaction_id, movement_type, quantity, stock_before, stock_after, description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        params.itemId,
        params.transactionId,
        params.movementType,
        params.quantity,
        params.stockBefore,
        params.stockAfter,
        params.description ?? null,
      ]
    );
    return id;
  }

  async getLatestByItem(itemId: string): Promise<StockMovement | null> {
    return this.db.getFirstAsync<StockMovement>(
      'SELECT * FROM stock_movements WHERE item_id = ? ORDER BY created_at DESC LIMIT 1',
      [itemId]
    );
  }
}
