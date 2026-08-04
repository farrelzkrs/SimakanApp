import type { SQLiteDatabase } from 'expo-sqlite';
import type { Category, CreateCategoryInput, UpdateCategoryInput } from '../models/Category';
import { generateId } from '../utils/generateId';
import { toSQLiteDateTime } from '../utils/dateUtils';

export class CategoryRepository {
  constructor(private db: SQLiteDatabase) {}

  async findAll(): Promise<Category[]> {
    return this.db.getAllAsync<Category>(
      'SELECT * FROM categories WHERE is_deleted = 0 ORDER BY name ASC'
    );
  }

  async findByType(type: 'IN' | 'OUT'): Promise<Category[]> {
    return this.db.getAllAsync<Category>(
      'SELECT * FROM categories WHERE type = ? AND is_deleted = 0 ORDER BY name ASC',
      [type]
    );
  }

  async findById(id: string): Promise<Category | null> {
    return this.db.getFirstAsync<Category>(
      'SELECT * FROM categories WHERE id = ? AND is_deleted = 0',
      [id]
    );
  }

  async findByCode(code: string): Promise<Category | null> {
    return this.db.getFirstAsync<Category>(
      'SELECT * FROM categories WHERE code = ? AND is_deleted = 0',
      [code]
    );
  }

  async create(input: CreateCategoryInput): Promise<string> {
    const id = generateId('CAT');
    await this.db.runAsync(
      `INSERT INTO categories (id, code, name, transaction_type, icon, color, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        input.code ?? null,
        input.name,
        input.transaction_type,
        input.icon ?? null,
        input.color ?? null,
        input.created_by ?? null,
      ]
    );
    return id;
  }

  async update(id: string, input: UpdateCategoryInput): Promise<void> {
    const updates: string[] = [];
    const values: any[] = [];

    if (input.code !== undefined) {
      updates.push('code = ?');
      values.push(input.code);
    }
    if (input.name !== undefined) {
      updates.push('name = ?');
      values.push(input.name);
    }
    if (input.transaction_type !== undefined) {
      updates.push('transaction_type = ?');
      values.push(input.transaction_type);
    }
    if (input.icon !== undefined) {
      updates.push('icon = ?');
      values.push(input.icon);
    }
    if (input.color !== undefined) {
      updates.push('color = ?');
      values.push(input.color);
    }
    if (input.is_active !== undefined) {
      updates.push('is_active = ?');
      values.push(input.is_active ? 1 : 0);
    }

    if (updates.length === 0) return;

    updates.push('updated_at = ?');
    values.push(toSQLiteDateTime());

    if (input.updated_by) {
      updates.push('updated_by = ?');
      values.push(input.updated_by);
    }

    values.push(id);

    await this.db.runAsync(
      `UPDATE categories SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
  }

  async softDelete(id: string, deletedBy?: string): Promise<void> {
    await this.db.runAsync(
      `UPDATE categories SET 
        is_deleted = 1, 
        deleted_at = ?, 
        updated_by = ? 
       WHERE id = ?`,
      [toSQLiteDateTime(), deletedBy ?? null, id]
    );
  }
}
