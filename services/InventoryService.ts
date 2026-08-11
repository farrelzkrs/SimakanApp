import type { SQLiteDatabase } from 'expo-sqlite';
import type { CreateItemInput, Item, UpdateItemInput } from '../models/Item';
import type { StockMovement } from '../models/StockMovement';
import { ItemRepository } from '../repositories/ItemRepository';
import { StockMovementRepository } from '../repositories/StockMovementRepository';

export class InventoryService {
  private itemRepo: ItemRepository;
  private stockMovementRepo: StockMovementRepository;

  constructor(private db: SQLiteDatabase) {
    this.itemRepo = new ItemRepository(db);
    this.stockMovementRepo = new StockMovementRepository(db);
  }

  async getAllItems(): Promise<Item[]> {
    return this.itemRepo.findAll();
  }

  async getItemById(id: number): Promise<Item | null> {
    return this.itemRepo.findById(id);
  }

  async searchItems(query: string): Promise<Item[]> {
    return this.itemRepo.search(query);
  }

  async scanBarcode(barcode: string): Promise<Item | null> {
    return this.itemRepo.findByBarcode(barcode);
  }

  async createItem(input: CreateItemInput): Promise<number> {
    if (input.code) {
      const existing = await this.itemRepo.findByCode(input.code);
      if (existing) {
        throw new Error(`Kode item ${input.code} sudah digunakan`);
      }
    }

    const id = await this.itemRepo.create(input);

    if (input.stock && input.stock > 0) {
      await this.stockMovementRepo.create({
        itemId: id,
        transactionId: null,
        movementType: 'ADJUSTMENT',
        quantity: input.stock,
        stockBefore: 0,
        stockAfter: input.stock,
        description: 'Stok awal',
      });
    }

    return id;
  }

  async updateItem(id: number, input: UpdateItemInput): Promise<void> {
    const item = await this.itemRepo.findById(id);
    if (!item) {
      throw new Error('Item tidak ditemukan');
    }

    if (input.code && input.code !== item.code) {
      const existing = await this.itemRepo.findByCode(input.code);
      if (existing) {
        throw new Error(`Kode item ${input.code} sudah digunakan`);
      }
    }

    await this.itemRepo.update(id, input);
  }

  async adjustStock(itemId: number, newStock: number, description?: string): Promise<void> {
    await this.db.withTransactionAsync(async () => {
      const item = await this.itemRepo.findById(itemId);
      if (!item) {
        throw new Error('Item tidak ditemukan');
      }

      const stockBefore = item.stock;
      await this.itemRepo.updateStock(itemId, newStock);

      await this.stockMovementRepo.create({
        itemId,
        transactionId: null,
        movementType: 'ADJUSTMENT',
        quantity: Math.abs(newStock - stockBefore),
        stockBefore,
        stockAfter: newStock,
        description: description ?? 'Penyesuaian stok manual',
      });
    });
  }

  async deleteItem(id: number, deletedBy?: number): Promise<void> {
    await this.itemRepo.softDelete(id, deletedBy);
  }

  async getLowStockItems(): Promise<Item[]> {
    return this.itemRepo.findLowStock();
  }

  async getLowStockCount(): Promise<number> {
    return this.itemRepo.countLowStock();
  }

  async getStockHistory(itemId: number, limit: number = 50): Promise<StockMovement[]> {
    return this.stockMovementRepo.findByItem(itemId, limit);
  }

  async getTotalItems(): Promise<number> {
    return this.itemRepo.count();
  }
}
