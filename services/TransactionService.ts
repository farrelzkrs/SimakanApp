import type { SQLiteDatabase } from 'expo-sqlite';
import type { CreateTransactionInput, TransactionWithCategory } from '../models/Transaction';
import { CashRepository } from '../repositories/CashRepository';
import { ItemRepository } from '../repositories/ItemRepository';
import { StockMovementRepository } from '../repositories/StockMovementRepository';
import { TransactionRepository } from '../repositories/TransactionRepository';

export class TransactionService {
  private transactionRepo: TransactionRepository;
  private cashRepo: CashRepository;
  private itemRepo: ItemRepository;
  private stockMovementRepo: StockMovementRepository;

  constructor(private db: SQLiteDatabase) {
    this.transactionRepo = new TransactionRepository(db);
    this.cashRepo = new CashRepository(db);
    this.itemRepo = new ItemRepository(db);
    this.stockMovementRepo = new StockMovementRepository(db);
  }

  async createTransaction(input: CreateTransactionInput): Promise<number> {
    let transactionId = 0;

    await this.db.withTransactionAsync(async () => {
      transactionId = await this.transactionRepo.create(input);

      const cashId = input.cash_id ?? 1;
      const cashExists = await this.cashRepo.findById(cashId);
      const targetCashId = cashExists ? cashId : ((await this.cashRepo.findMain())?.id ?? 1);
      if (input.transaction_type === 'IN') {
        await this.cashRepo.addIncome(targetCashId, input.nominal);
      } else {
        await this.cashRepo.addExpense(targetCashId, input.nominal);
      }

      if (input.item_id && input.quantity && input.quantity > 0) {
        const item = await this.itemRepo.findById(input.item_id);
        if (!item) {
          throw new Error('Item tidak ditemukan');
        }

        const stockBefore = item.stock;
        let stockAfter: number;

        if (input.transaction_type === 'IN') {
          stockAfter = stockBefore + input.quantity;
        } else {
          stockAfter = stockBefore - input.quantity;
          if (stockAfter < 0) {
            throw new Error(`Stok ${item.name} tidak mencukupi (sisa: ${stockBefore})`);
          }
        }

        await this.itemRepo.updateStock(input.item_id, stockAfter);

        await this.stockMovementRepo.create({
          itemId: input.item_id,
          transactionId,
          movementType: input.transaction_type,
          quantity: input.quantity,
          stockBefore,
          stockAfter,
          description: `Transaksi ${input.transaction_type === 'IN' ? 'masuk' : 'keluar'}`,
        });
      }
    });

    return transactionId;
  }

  async updateTransaction(id: number | string, input: Partial<CreateTransactionInput> & { updated_by?: number | string }): Promise<void> {
    await this.db.withTransactionAsync(async () => {
      const existing = await this.transactionRepo.findById(id);
      if (!existing) {
        throw new Error('Transaksi tidak ditemukan');
      }

      // Reverse cash for existing transaction
      if (existing.transaction_type === 'IN') {
        await this.cashRepo.reverseIncome(existing.cash_id, existing.nominal);
      } else {
        await this.cashRepo.reverseExpense(existing.cash_id, existing.nominal);
      }

      // Apply new cash
      const newType = input.transaction_type ?? existing.transaction_type;
      const newNominal = input.nominal ?? existing.nominal;
      const cashId = input.cash_id ?? existing.cash_id;

      if (newType === 'IN') {
        await this.cashRepo.addIncome(cashId, newNominal);
      } else {
        await this.cashRepo.addExpense(cashId, newNominal);
      }

      await this.transactionRepo.update(id, input);
    });
  }

  async deleteTransaction(transactionId: number | string, deletedBy?: number | string): Promise<void> {
    await this.db.withTransactionAsync(async () => {
      const transaction = await this.transactionRepo.findById(transactionId);
      if (!transaction) {
        throw new Error('Transaksi tidak ditemukan');
      }

      if (transaction.transaction_type === 'IN') {
        await this.cashRepo.reverseIncome(transaction.cash_id, transaction.nominal);
      } else {
        await this.cashRepo.reverseExpense(transaction.cash_id, transaction.nominal);
      }

      if (transaction.item_id && transaction.quantity > 0) {
        const item = await this.itemRepo.findById(transaction.item_id);
        if (item) {
          const stockBefore = item.stock;
          let stockAfter: number;

          if (transaction.transaction_type === 'IN') {
            stockAfter = stockBefore - transaction.quantity;
          } else {
            stockAfter = stockBefore + transaction.quantity;
          }

          await this.itemRepo.updateStock(transaction.item_id, stockAfter);

          await this.stockMovementRepo.create({
            itemId: transaction.item_id,
            transactionId: typeof transactionId === 'number' ? transactionId : 0,
            movementType: 'ADJUSTMENT',
            quantity: transaction.quantity,
            stockBefore,
            stockAfter,
            description: `Pembatalan transaksi ${transaction.transaction_no}`,
          });
        }
      }

      await this.transactionRepo.softDelete(transactionId, deletedBy);
    });
  }

  async getTransactions(limit: number = 50, offset: number = 0): Promise<TransactionWithCategory[]> {
    return this.transactionRepo.findAll(limit, offset);
  }

  async getRecentTransactions(limit: number = 5): Promise<TransactionWithCategory[]> {
    return this.transactionRepo.findRecent(limit);
  }

  async getTransactionsByDateRange(startDate: string, endDate: string): Promise<TransactionWithCategory[]> {
    return this.transactionRepo.findByDateRange(startDate, endDate);
  }

  async getTransactionDetail(id: number | string): Promise<TransactionWithCategory | null> {
    return this.transactionRepo.findById(id);
  }
}
