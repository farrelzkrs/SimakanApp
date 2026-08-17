import React, { createContext, useContext, useState } from 'react';

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  stock: number;
  unit: string;
  price: number; // Harga per picis (Rp)
  minStock?: number;
  status: 'Tersedia' | 'Menipis';
  progress: number; // 0 to 1
}

interface InventoryContextType {
  inventoryItems: InventoryItem[];
  addInventoryItem: (itemData: {
    name: string;
    category: string;
    stock: number;
    unit: string;
    price: number;
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
}

const DEFAULT_INVENTORY_ITEMS: InventoryItem[] = [
  {
    id: 'inv-1',
    name: 'Biji Kopi Arabika 1kg',
    category: 'Bahan Baku',
    stock: 25,
    unit: 'Kg',
    price: 125000,
    minStock: 5,
    status: 'Tersedia',
    progress: 0.85,
  },
  {
    id: 'inv-2',
    name: 'Susu UHT Full Cream 1L',
    category: 'Bahan Baku',
    stock: 40,
    unit: 'Karton',
    price: 18000,
    minStock: 10,
    status: 'Tersedia',
    progress: 0.75,
  },
  {
    id: 'inv-3',
    name: 'Cup Plastik Sablon 16oz',
    category: 'Kemasan',
    stock: 4,
    unit: 'Pack',
    price: 35000,
    minStock: 10,
    status: 'Menipis',
    progress: 0.2,
  },
  {
    id: 'inv-4',
    name: 'Kopi Susu Aren Special',
    category: 'Minuman',
    stock: 50,
    unit: 'Cup',
    price: 22000,
    minStock: 10,
    status: 'Tersedia',
    progress: 0.9,
  },
  {
    id: 'inv-5',
    name: 'Roti Bakar Keju Cokelat',
    category: 'Makanan',
    stock: 30,
    unit: 'Porsi',
    price: 25000,
    minStock: 5,
    status: 'Tersedia',
    progress: 0.7,
  },
  {
    id: 'inv-6',
    name: 'Laptop ASUS ROG',
    category: 'Elektronik',
    stock: 12,
    unit: 'Unit',
    price: 15000000,
    minStock: 3,
    status: 'Tersedia',
    progress: 0.9,
  },
  {
    id: 'inv-7',
    name: 'Mouse Logitech',
    category: 'Aksesoris',
    stock: 3,
    unit: 'Unit',
    price: 250000,
    minStock: 5,
    status: 'Menipis',
    progress: 0.25,
  },
  {
    id: 'inv-8',
    name: 'Kertas A4 HVS 80gr',
    category: 'ATK',
    stock: 50,
    unit: 'Rim',
    price: 55000,
    minStock: 10,
    status: 'Tersedia',
    progress: 0.7,
  },
];

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export function InventoryProvider({ children }: { children: React.ReactNode }) {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>(DEFAULT_INVENTORY_ITEMS);

  const addInventoryItem = (itemData: {
    name: string;
    category: string;
    stock: number;
    unit: string;
    price: number;
    minStock?: number;
  }) => {
    const minThreshold = itemData.minStock || 5;
    const status: 'Tersedia' | 'Menipis' = itemData.stock <= minThreshold ? 'Menipis' : 'Tersedia';
    const maxStock = Math.max(itemData.stock, 50);
    const progress = Math.min(Math.max(itemData.stock / maxStock, 0.1), 1);

    const newItem: InventoryItem = {
      id: 'inv-' + Date.now(),
      name: itemData.name.trim(),
      category: itemData.category || 'Umum',
      stock: itemData.stock,
      unit: itemData.unit || 'Pcs',
      price: itemData.price || 0,
      minStock: minThreshold,
      status,
      progress,
    };

    setInventoryItems((prev) => [newItem, ...prev]);
  };

  const updateInventoryItem = (id: string, updatedData: Partial<InventoryItem>) => {
    setInventoryItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newStock = updatedData.stock !== undefined ? updatedData.stock : item.stock;
          const minThreshold = updatedData.minStock || item.minStock || 5;
          const status: 'Tersedia' | 'Menipis' = newStock <= minThreshold ? 'Menipis' : 'Tersedia';
          const maxStock = Math.max(newStock, 50);
          const progress = Math.min(Math.max(newStock / maxStock, 0.05), 1);

          return {
            ...item,
            ...updatedData,
            stock: newStock,
            status,
            progress,
          };
        }
        return item;
      })
    );
  };

  const deleteInventoryItem = (id: string) => {
    setInventoryItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Adjust stock automatically when item is sold (-delta) or restocked (+delta)
  const adjustStockByItemName = (itemName: string, delta: number) => {
    setInventoryItems((prev) =>
      prev.map((item) => {
        if (item.name.toLowerCase() === itemName.toLowerCase()) {
          const newStock = Math.max(0, item.stock + delta);
          const minThreshold = item.minStock || 5;
          const status: 'Tersedia' | 'Menipis' = newStock <= minThreshold ? 'Menipis' : 'Tersedia';
          const maxStock = Math.max(newStock, 50);
          const progress = Math.min(Math.max(newStock / maxStock, 0.05), 1);

          return {
            ...item,
            stock: newStock,
            status,
            progress,
          };
        }
        return item;
      })
    );
  };

  // Function to either restock an existing item or register a new item in Inventory during Expense entry
  const registerOrRestockExpenseItem = (itemData: {
    name: string;
    category: string;
    quantity: number;
    unit: string;
    price: number;
  }) => {
    const trimmedName = itemData.name.trim();
    const existing = inventoryItems.find(
      (i) => i.name.toLowerCase() === trimmedName.toLowerCase()
    );

    if (existing) {
      // Item already registered -> Add quantity to its stock
      adjustStockByItemName(existing.name, itemData.quantity);
      if (itemData.price > 0 && itemData.price !== existing.price) {
        updateInventoryItem(existing.id, { price: itemData.price });
      }
    } else {
      // Item NOT registered -> Register as a new inventory item with initial stock = quantity!
      addInventoryItem({
        name: trimmedName,
        category: itemData.category || 'Bahan Baku',
        stock: itemData.quantity,
        unit: itemData.unit || 'Pcs',
        price: itemData.price,
        minStock: 5,
      });
    }
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
