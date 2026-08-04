import type { SQLiteDatabase } from 'expo-sqlite';
import type { CreateUserInput, UpdateUserInput, User } from '../models/User';
import { generateId } from '../utils/generateId';
import { toSQLiteDateTime } from '../utils/dateUtils';

export class UserRepository {
  constructor(private db: SQLiteDatabase) {}

  async findAll(): Promise<User[]> {
    return this.db.getAllAsync<User>('SELECT * FROM users WHERE is_deleted = 0');
  }

  async findById(id: string): Promise<User | null> {
    return this.db.getFirstAsync<User>(
      'SELECT * FROM users WHERE id = ? AND is_deleted = 0',
      [id]
    );
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.db.getFirstAsync<User>(
      'SELECT * FROM users WHERE username = ? AND is_deleted = 0',
      [username]
    );
  }

  async create(input: CreateUserInput): Promise<string> {
    const id = generateId('USR');
    await this.db.runAsync(
      `INSERT INTO users (id, username, password, name, role)
       VALUES (?, ?, ?, ?, ?)`,
      [id, input.username, input.password, input.name, input.role]
    );
    return id;
  }

  async update(id: string, input: UpdateUserInput): Promise<void> {
    const updates: string[] = [];
    const values: any[] = [];

    if (input.password !== undefined) {
      updates.push('password = ?');
      values.push(input.password);
    }
    if (input.name !== undefined) {
      updates.push('name = ?');
      values.push(input.name);
    }
    if (input.role !== undefined) {
      updates.push('role = ?');
      values.push(input.role);
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
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.db.runAsync(
      'UPDATE users SET last_login = ?, updated_at = ? WHERE id = ?',
      [toSQLiteDateTime(), toSQLiteDateTime(), id]
    );
  }

  async softDelete(id: string, deletedBy?: string): Promise<void> {
    await this.db.runAsync(
      `UPDATE users SET 
        is_deleted = 1, 
        deleted_at = ?, 
        updated_by = ? 
       WHERE id = ?`,
      [toSQLiteDateTime(), deletedBy ?? null, id]
    );
  }
}
