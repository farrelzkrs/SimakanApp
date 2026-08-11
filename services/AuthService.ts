import type { SQLiteDatabase } from 'expo-sqlite';
import * as Crypto from 'expo-crypto';
import { UserRepository } from '../repositories/UserRepository';
import type { User, CreateUserInput } from '../models/User';

export class AuthService {
  private userRepo: UserRepository;

  constructor(private db: SQLiteDatabase) {
    this.userRepo = new UserRepository(db);
  }

  async login(username: string, password: string): Promise<User | null> {
    const user = await this.userRepo.findByUsername(username);
    if (!user) return null;

    const hashedPassword = await this.hashPassword(password);
    if (user.password !== hashedPassword) return null;

    await this.userRepo.updateLastLogin(user.id);
    return user;
  }

  async createUser(input: CreateUserInput): Promise<number> {
    const existing = await this.userRepo.findByUsername(input.username);
    if (existing) {
      throw new Error('Username sudah digunakan');
    }

    const hashedPassword = await this.hashPassword(input.password);
    return this.userRepo.create({
      ...input,
      password: hashedPassword,
    });
  }

  async changePassword(userId: number, oldPassword: string, newPassword: string): Promise<void> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new Error('User tidak ditemukan');
    }

    const hashedOld = await this.hashPassword(oldPassword);
    if (user.password !== hashedOld) {
      throw new Error('Password lama salah');
    }

    const hashedNew = await this.hashPassword(newPassword);
    await this.userRepo.update(userId, { password: hashedNew });
  }

  async resetPassword(userId: number, newPassword: string, updatedBy?: number): Promise<void> {
    const hashedPassword = await this.hashPassword(newPassword);
    await this.userRepo.update(userId, {
      password: hashedPassword,
      updated_by: updatedBy,
    });
  }

  private async hashPassword(password: string): Promise<string> {
    return Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      password
    );
  }
}
