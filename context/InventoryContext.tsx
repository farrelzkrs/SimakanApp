import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { SQLiteDatabase } from 'expo-sqlite';
import { InventoryService } from '@/services/InventoryService';

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  stock: number;
  unit: string;
  price: number;
  sellingPrice: number;
  minStock?: number;
  status: 'Tersedia' | 'Menipis';
  progress: number;
}

interface InventoryContextType {
  inventoryItems: InventoryItem[];
  addInventoryItem: (itemData: {
    name: string;
    category: string;
    stock: number;
    unit: string;
    price: number;
    sellingPrice?: number;
    minStock?: number;
  }) => void;
  updateInventoryItem: (id: string, updatedData: Partial<InventoryItem>) => void;
  deleteInventoryItem: (id: string) => void;
  adjustStockByItemName: (itemName: string, delta: number) => void;
  registerOrRestockExpenseItem: (itemData: {
    name: string;
    category: string;
    quantity: number;
    unit: string;
    price: number;
  }) => void;
  updateSellingPrice: (id: string, sellingPrice: number) => void;
  getProfit: (item: InventoryItem) => number;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

function mapDbItemToInventoryItem(dbItem: any): InventoryItem {
  const stock = dbItem.stock ?? 0;
  const minThreshold = dbItem.minimum_stock ?? 5;
  const status: 'Tersedia' | 'Menipis' = stock <= minThreshold ? 'Menipis' : 'Tersedia';
  const maxStock = Math.max(stock, 50);
  const progress = Math.min(Math.max(stock / maxStock, 0.05), 1);

  return {
    id: String(dbItem.id),
    name: dbItem.name,
    category: dbItem.category || 'Umum',
    stock,
    unit: dbItem.unit || 'Pcs',
    price: dbItem.purchase_price ?? 0,
    sellingPrice: dbItem.selling_price ?? 0,
    minStock: minThreshold,
    status,
    progress,
  };
}

export function InventoryProvider({ children, db }: { children: React.ReactNode; db: SQLiteDatabase }) {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);

  const reloadItems = useCallback(async () => {
    try {
      const svc = new InventoryService(db);
      const items = await svc.getAllItems();
      setInventoryItems(items.map(mapDbItemToInventoryItem));
    } catch (err) {
      console.log('Error loading inventory from DB:', err);
    }
  }, [db]);

  useEffect(() => {
    reloadItems();
  }, [reloadItems]);

  const addInventoryItem = async (itemData: {
    name: string;
    category: string;
    stock: number;
    unit: string;
    price: number;
    sellingPrice?: number;
    minStock?: number;
  }) => {
    try {
      const svc = new InventoryService(db);
      await svc.createItem({
        name: itemData.name.trim(),
        category: itemData.category || 'Umum',
        stock: itemData.stock,
        unit: itemData.unit || 'Pcs',
        purchase_price: itemData.price || 0,
        selling_price: itemData.sellingPrice || 0,
        minimum_stock: itemData.minStock || 5,
      });
      await reloadItems();
    } catch (err) {
      console.log('Error adding inventory item:', err);
    }
  };

  const updateInventoryItem = async (id: string, updatedData: Partial<InventoryItem>) => {
    try {
      const svc = new InventoryService(db);
      const updateInput: any = {};
      if (updatedData.name !== undefined) updateInput.name = updatedData.name;
      if (updatedData.category !== undefined) updateInput.category = updatedData.category;
      if (updatedData.unit !== undefined) updateInput.unit = updatedData.unit;
      if (updatedData.price !== undefined) updateInput.purchase_price = updatedData.price;
      if (updatedData.sellingPrice !== undefined) updateInput.selling_price = updatedData.sellingPrice;
      if (updatedData.minStock !== undefined) updateInput.minimum_stock = updatedData.minStock;

      if (Object.keys(updateInput).length > 0) {
        await svc.updateItem(Number(id), updateInput);
      }

      if (updatedData.stock !== undefined) {
        await svc.adjustStock(Number(id), updatedData.stock);
      }

      await reloadItems();
    } catch (err) {
      console.log('Error updating inventory item:', err);
    }
  };

  const deleteInventoryItem = async (id: string) => {
    try {
      const svc = new InventoryService(db);
      await svc.deleteItem(Number(id));
      await reloadItems();
    } catch (err) {
      console.log('Error deleting inventory item:', err);
    }
  };

  const adjustStockByItemName = async (itemName: string, delta: number) => {
    try {
      const svc = new InventoryService(db);
      const allItems = await svc.getAllItems();
      const match = allItems.find(
        (i) => i.name.toLowerCase() === itemName.toLowerCase()
      );
      if (match) {
        const newStock = Math.max(0, match.stock + delta);
        await svc.adjustStock(match.id, newStock);
        await reloadItems();
      }
    } catch (err) {
      console.log('Error adjusting stock:', err);
    }
  };

  const registerOrRestockExpenseItem = async (itemData: {
    name: string;
    category: string;
    quantity: number;
    unit: string;
    price: number;
  }) => {
    try {
      const svc = new InventoryService(db);
      const trimmedName = itemData.name.trim();
      const allItems = await svc.getAllItems();
      const existing = allItems.find(
        (i) => i.name.toLowerCase() === trimmedName.toLowerCase()
      );

      if (existing) {
        const newStock = existing.stock + itemData.quantity;
        await svc.adjustStock(existing.id, newStock);
        if (itemData.price > 0 && itemData.price !== existing.purchase_price) {
          await svc.updateItem(existing.id, { purchase_price: itemData.price });
        }
      } else {
        await svc.createItem({
          name: trimmedName,
          category: itemData.category || 'Bahan Baku',
          stock: itemData.quantity,
          unit: itemData.unit || 'Pcs',
          purchase_price: itemData.price,
          minimum_stock: 5,
        });
      }
      await reloadItems();
    } catch (err) {
      console.log('Error registering/restocking item:', err);
    }
  };

  const updateSellingPrice = async (id: string, sellingPrice: number) => {
    try {
      const svc = new InventoryService(db);
      await svc.updateItem(Number(id), { selling_price: sellingPrice });
      await reloadItems();
    } catch (err) {
      console.log('Error updating selling price:', err);
    }
  };

  const getProfit = (item: InventoryItem) => {
    if (item.sellingPrice > 0 && item.price > 0) {
      return item.sellingPrice - item.price;
    }
    return 0;
  };

  return (
    <InventoryContext.Provider
      value={{
        inventoryItems,
        addInventoryItem,
        updateInventoryItem,
        deleteInventoryItem,
        adjustStockByItemName,
        registerOrRestockExpenseItem,
        updateSellingPrice,
        getProfit,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
}

export function useInventory() {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
}
