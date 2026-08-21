import type { SQLiteDatabase } from 'expo-sqlite';

export interface Customer {
  id: number;
  name: string;
  created_at: string;
}

export class CustomerRepository {
  constructor(private db: SQLiteDatabase) {}

  async addCustomer(name: string): Promise<void> {
    if (!name || name.trim() === '') return;

    await this.db.runAsync(
      `INSERT OR IGNORE INTO customers (name) VALUES (?)`,
      [name.trim()]
    );
  }

  async getAllCustomers(): Promise<Customer[]> {
    return this.db.getAllAsync<Customer>(
      `SELECT * FROM customers ORDER BY name ASC`
    );
  }
}
