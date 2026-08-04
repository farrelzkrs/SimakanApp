import type { SQLiteDatabase } from 'expo-sqlite';
import type { Cash } from '../models/Cash';
import { toSQLiteDateTime } from '../utils/dateUtils';

export class CashRepository {
  constructor(private db: SQLiteDatabase) {}

  async findMain(): Promise<Cash | null> {
    return this.db.getFirstAsync<Cash>(
      'SELECT * FROM cash WHERE id = ?',
      ['CSH-utama']
    );
  }

  async findById(id: string): Promise<Cash | null> {
    return this.db.getFirstAsync<Cash>(
      'SELECT * FROM cash WHERE id = ?',
      [id]
    );
  }

  async findAll(): Promise<Cash[]> {
    return this.db.getAllAsync<Cash>('SELECT * FROM cash');
  }

  async addIncome(cashId: string, amount: number): Promise<void> {
    await this.db.runAsync(
      `UPDATE cash SET
        current_balance = current_balance + ?,
        total_income = total_income + ?,
        last_transaction = ?,
        updated_at = ?
       WHERE id = ?`,
      [amount, amount, toSQLiteDateTime(), toSQLiteDateTime(), cashId]
    );
  }

  async addExpense(cashId: string, amount: number): Promise<void> {
    await this.db.runAsync(
      `UPDATE cash SET
        current_balance = current_balance - ?,
        total_expense = total_expense + ?,
        last_transaction = ?,
        updated_at = ?
       WHERE id = ?`,
      [amount, amount, toSQLiteDateTime(), toSQLiteDateTime(), cashId]
    );
  }

  async reverseIncome(cashId: string, amount: number): Promise<void> {
    await this.db.runAsync(
      `UPDATE cash SET
        current_balance = current_balance - ?,
        total_income = total_income - ?,
        updated_at = ?
       WHERE id = ?`,
      [amount, amount, toSQLiteDateTime(), cashId]
    );
  }

  async reverseExpense(cashId: string, amount: number): Promise<void> {
    await this.db.runAsync(
      `UPDATE cash SET
        current_balance = current_balance + ?,
        total_expense = total_expense - ?,
        updated_at = ?
       WHERE id = ?`,
      [amount, amount, toSQLiteDateTime(), cashId]
    );
  }

  async updateOpeningBalance(cashId: string, amount: number): Promise<void> {
    await this.db.runAsync(
      `UPDATE cash SET
        opening_balance = ?,
        current_balance = ? + total_income - total_expense,
        updated_at = ?
       WHERE id = ?`,
      [amount, amount, toSQLiteDateTime(), cashId]
    );
  }
}
