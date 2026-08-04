import type { SQLiteDatabase } from 'expo-sqlite';
import type { Cash } from '../models/Cash';
import type { Item } from '../models/Item';
import type { TransactionWithCategory } from '../models/Transaction';
import { CashRepository } from '../repositories/CashRepository';
import { ItemRepository } from '../repositories/ItemRepository';
import { TransactionRepository } from '../repositories/TransactionRepository';

export interface DashboardData {
  cash: Cash | null;
  todayCount: number;
  todayTotal: number;
  totalItems: number;
  lowStockCount: number;
  lowStockItems: Item[];
  recentTransactions: TransactionWithCategory[];
}

export class DashboardService {
  private cashRepo: CashRepository;
  private transactionRepo: TransactionRepository;
  private itemRepo: ItemRepository;

  constructor(private db: SQLiteDatabase) {
    this.cashRepo = new CashRepository(db);
    this.transactionRepo = new TransactionRepository(db);
    this.itemRepo = new ItemRepository(db);
  }

  async getDashboardData(): Promise<DashboardData> {
    const [cash, todayStats, totalItems, lowStockCount, lowStockItems, recentTransactions] = await Promise.all([
      this.cashRepo.findMain(),
      this.transactionRepo.countToday(),
      this.itemRepo.count(),
      this.itemRepo.countLowStock(),
      this.itemRepo.findLowStock(),
      this.transactionRepo.findRecent(5),
    ]);

    return {
      cash,
      todayCount: todayStats.count,
      todayTotal: todayStats.total,
      totalItems,
      lowStockCount,
      lowStockItems,
      recentTransactions,
    };
  }

  async getCashSummary(): Promise<Cash | null> {
    return this.cashRepo.findMain();
  }

  async getMonthlyReport(year: number, month: number): Promise<{ income: number; expense: number }> {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01 00:00:00`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')} 23:59:59`;

    return this.transactionRepo.sumByDateRange(startDate, endDate);
  }

  async getDailyReport(date: string): Promise<{ income: number; expense: number }> {
    const startDate = `${date} 00:00:00`;
    const endDate = `${date} 23:59:59`;

    return this.transactionRepo.sumByDateRange(startDate, endDate);
  }
}
