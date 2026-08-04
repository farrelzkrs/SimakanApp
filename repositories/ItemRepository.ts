import type { SQLiteDatabase } from 'expo-sqlite';
import type { CreateItemInput, Item, UpdateItemInput } from '../models/Item';
import { generateId } from '../utils/generateId';
import { toSQLiteDateTime } from '../utils/dateUtils';

export class ItemRepository {
  constructor(private db: SQLiteDatabase) {}

  async findAll(): Promise<Item[]> {
    return this.db.getAllAsync<Item>(
      'SELECT * FROM items WHERE is_deleted = 0 ORDER BY name ASC'
    );
  }

  async findById(id: string): Promise<Item | null> {
    return this.db.getFirstAsync<Item>(
      'SELECT * FROM items WHERE id = ? AND is_deleted = 0',
      [id]
    );
  }

  async findByCode(code: string): Promise<Item | null> {
    return this.db.getFirstAsync<Item>(
      'SELECT * FROM items WHERE code = ? AND is_deleted = 0',
      [code]
    );
  }

  async findByBarcode(barcode: string): Promise<Item | null> {
    return this.db.getFirstAsync<Item>(
      'SELECT * FROM items WHERE barcode = ? AND is_deleted = 0',
      [barcode]
    );
  }

  async findLowStock(): Promise<Item[]> {
    return this.db.getAllAsync<Item>(
      'SELECT * FROM items WHERE stock <= minimum_stock AND is_deleted = 0 AND is_active = 1 ORDER BY stock ASC'
    );
  }

  async search(query: string): Promise<Item[]> {
    const searchTerm = `%${query}%`;
    return this.db.getAllAsync<Item>(
      'SELECT * FROM items WHERE (name LIKE ? OR code LIKE ? OR barcode LIKE ?) AND is_deleted = 0 ORDER BY name ASC',
      [searchTerm, searchTerm, searchTerm]
    );
  }

  async create(input: CreateItemInput): Promise<string> {
    const id = generateId('ITM');
    await this.db.runAsync(
      `INSERT INTO items (id, code, barcode, name, category, purchase_price, selling_price, stock, minimum_stock, unit, photo, description, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        input.code ?? null,
        input.barcode ?? null,
        input.name,
        input.category ?? null,
        input.purchase_price ?? 0,
        input.selling_price ?? 0,
        input.stock ?? 0,
        input.minimum_stock ?? 0,
        input.unit ?? 'pcs',
        input.photo ?? null,
        input.description ?? null,
        input.created_by ?? null,
      ]
    );
    return id;
  }

  async update(id: string, input: UpdateItemInput): Promise<void> {
    const updates: string[] = [];
    const values: any[] = [];

    if (input.code !== undefined) { updates.push('code = ?'); values.push(input.code); }
    if (input.barcode !== undefined) { updates.push('barcode = ?'); values.push(input.barcode); }
    if (input.name !== undefined) { updates.push('name = ?'); values.push(input.name); }
    if (input.category !== undefined) { updates.push('category = ?'); values.push(input.category); }
    if (input.purchase_price !== undefined) { updates.push('purchase_price = ?'); values.push(input.purchase_price); }
    if (input.selling_price !== undefined) { updates.push('selling_price = ?'); values.push(input.selling_price); }
    if (input.minimum_stock !== undefined) { updates.push('minimum_stock = ?'); values.push(input.minimum_stock); }
    if (input.unit !== undefined) { updates.push('unit = ?'); values.push(input.unit); }
    if (input.photo !== undefined) { updates.push('photo = ?'); values.push(input.photo); }
    if (input.description !== undefined) { updates.push('description = ?'); values.push(input.description); }
    if (input.is_active !== undefined) { updates.push('is_active = ?'); values.push(input.is_active ? 1 : 0); }

    if (updates.length === 0) return;

    updates.push('updated_at = ?');
    values.push(toSQLiteDateTime());

    if (input.updated_by) {
      updates.push('updated_by = ?');
      values.push(input.updated_by);
    }

    values.push(id);

    await this.db.runAsync(
      `UPDATE items SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
  }

  async updateStock(id: string, newStock: number): Promise<void> {
    await this.db.runAsync(
      'UPDATE items SET stock = ?, updated_at = ? WHERE id = ?',
      [newStock, toSQLiteDateTime(), id]
    );
  }

  async softDelete(id: string, deletedBy?: string): Promise<void> {
    await this.db.runAsync(
      `UPDATE items SET 
        is_deleted = 1, 
        deleted_at = ?, 
        updated_by = ? 
       WHERE id = ?`,
      [toSQLiteDateTime(), deletedBy ?? null, id]
    );
  }

  async count(): Promise<number> {
    const result = await this.db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM items WHERE is_deleted = 0'
    );
    return result?.count ?? 0;
  }

  async countLowStock(): Promise<number> {
    const result = await this.db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM items WHERE stock <= minimum_stock AND is_deleted = 0 AND is_active = 1'
    );
    return result?.count ?? 0;
  }
}
