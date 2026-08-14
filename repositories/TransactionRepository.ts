import type { SQLiteDatabase } from 'expo-sqlite';
import type { CreateTransactionInput, TransactionWithCategory } from '../models/Transaction';
import { generateId } from '../utils/generateId';
import { toSQLiteDateTime } from '../utils/dateUtils';

export class TransactionRepository {
  constructor(private db: SQLiteDatabase) {}

  async findAll(limit: number = 50, offset: number = 0): Promise<TransactionWithCategory[]> {
    return this.db.getAllAsync<TransactionWithCategory>(
      `SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color 
       FROM transactions t 
       LEFT JOIN categories c ON t.category_id = c.id 
       WHERE t.is_deleted = 0 
       ORDER BY t.transaction_date DESC 
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );
  }

  async findById(id: string): Promise<TransactionWithCategory | null> {
    return this.db.getFirstAsync<TransactionWithCategory>(
      `SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color 
       FROM transactions t 
       LEFT JOIN categories c ON t.category_id = c.id 
       WHERE t.id = ? AND t.is_deleted = 0`,
      [id]
    );
  }

  async findByDateRange(startDate: string, endDate: string): Promise<TransactionWithCategory[]> {
    return this.db.getAllAsync<TransactionWithCategory>(
      `SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color 
       FROM transactions t 
       LEFT JOIN categories c ON t.category_id = c.id 
       WHERE t.transaction_date BETWEEN ? AND ? AND t.is_deleted = 0 
       ORDER BY t.transaction_date DESC`,
      [startDate, endDate]
    );
  }

  async findByType(type: 'IN' | 'OUT', limit: number = 50): Promise<TransactionWithCategory[]> {
    return this.db.getAllAsync<TransactionWithCategory>(
      `SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color 
       FROM transactions t 
       LEFT JOIN categories c ON t.category_id = c.id 
       WHERE t.transaction_type = ? AND t.is_deleted = 0 
       ORDER BY t.transaction_date DESC 
       LIMIT ?`,
      [type, limit]
    );
  }

  async findRecent(limit: number = 5): Promise<TransactionWithCategory[]> {
    return this.db.getAllAsync<TransactionWithCategory>(
      `SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color 
       FROM transactions t 
       LEFT JOIN categories c ON t.category_id = c.id 
       WHERE t.is_deleted = 0 
       ORDER BY t.transaction_date DESC 
       LIMIT ?`,
      [limit]
    );
  }

  async create(input: CreateTransactionInput): Promise<string> {
    const id = generateId('TRX');
    const transactionNo = await this.generateTransactionNo(input.transaction_type);

    await this.db.runAsync(
      `INSERT INTO transactions (
        id, transaction_no, transaction_date, transaction_type, 
        category_id, cash_id, item_id, quantity, unit_price, 
        nominal, payment_method, reference_number, attachment, 
        description, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        transactionNo,
        input.transaction_date,
        input.transaction_type,
        input.category_id,
        input.cash_id ?? 'CSH-utama',
        input.item_id ?? null,
        input.quantity ?? 0,
        input.unit_price ?? 0,
        input.nominal,
        input.payment_method ?? 'Cash',
        input.reference_number ?? null,
        input.attachment ?? null,
        input.description ?? null,
        input.created_by ?? null,
      ]
    );

    return id;
  }

  async update(id: string, input: Partial<CreateTransactionInput> & { updated_by?: string }): Promise<void> {
    const updates: string[] = [];
    const values: any[] = [];

    if (input.transaction_type !== undefined) { updates.push('transaction_type = ?'); values.push(input.transaction_type); }
    if (input.category_id !== undefined) { updates.push('category_id = ?'); values.push(input.category_id); }
    if (input.item_id !== undefined) { updates.push('item_id = ?'); values.push(input.item_id); }
    if (input.quantity !== undefined) { updates.push('quantity = ?'); values.push(input.quantity); }
    if (input.unit_price !== undefined) { updates.push('unit_price = ?'); values.push(input.unit_price); }
    if (input.nominal !== undefined) { updates.push('nominal = ?'); values.push(input.nominal); }
    if (input.payment_method !== undefined) { updates.push('payment_method = ?'); values.push(input.payment_method); }
    if (input.description !== undefined) { updates.push('description = ?'); values.push(input.description); }

    if (updates.length === 0) return;

    updates.push('updated_at = ?');
    values.push(toSQLiteDateTime());

    if (input.updated_by) {
      updates.push('updated_by = ?');
      values.push(input.updated_by);
    }

    values.push(id);

    await this.db.runAsync(
      `UPDATE transactions SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
  }

  async softDelete(id: string, deletedBy?: string): Promise<void> {
    await this.db.runAsync(
      `UPDATE transactions SET 
        is_deleted = 1, 
        deleted_at = ?, 
        updated_by = ? 
       WHERE id = ?`,
      [toSQLiteDateTime(), deletedBy ?? null, id]
    );
  }

  async countToday(): Promise<{ count: number; total: number }> {
    const result = await this.db.getFirstAsync<{ count: number; total: number }>(
      `SELECT 
        COUNT(*) as count, 
        COALESCE(SUM(nominal), 0) as total 
       FROM transactions 
       WHERE date(transaction_date) = date('now', 'localtime') 
       AND is_deleted = 0`
    );

    return result ?? { count: 0, total: 0 };
  }

  async countByType(type: 'IN' | 'OUT'): Promise<number> {
    const result = await this.db.getFirstAsync<{ total: number }>(
      'SELECT COUNT(*) as total FROM transactions WHERE transaction_type = ? AND is_deleted = 0',
      [type]
    );
    return result?.total ?? 0;
  }

  async sumByDateRange(startDate: string, endDate: string): Promise<{ income: number; expense: number }> {
    const result = await this.db.getFirstAsync<{ income: number; expense: number }>(
      `SELECT 
        COALESCE(SUM(CASE WHEN transaction_type = 'IN' THEN nominal ELSE 0 END), 0) as income,
        COALESCE(SUM(CASE WHEN transaction_type = 'OUT' THEN nominal ELSE 0 END), 0) as expense
       FROM transactions 
       WHERE transaction_date BETWEEN ? AND ? AND is_deleted = 0`,
      [startDate, endDate]
    );

    return result ?? { income: 0, expense: 0 };
  }

  private async generateTransactionNo(type: 'IN' | 'OUT'): Promise<string> {
    const today = new Date();
    const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
    const prefix = type === 'IN' ? 'TRX-IN' : 'TRX-OUT';
    const pattern = `${prefix}-${dateStr}-%`;

    const result = await this.db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM transactions WHERE transaction_no LIKE ?',
      [pattern]
    );

    const count = (result?.count ?? 0) + 1;
    const sequence = String(count).padStart(3, '0');

    return `${prefix}-${dateStr}-${sequence}`;
  }
}
