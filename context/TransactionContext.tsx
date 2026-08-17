import React, { createContext, useContext, useState } from 'react';
import { OrderFormData } from '@/components/OrderModal';

export interface TransactionItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  price: number;
  total: number;
  paymentMethod: 'Lunas' | 'Hutang';
  transactionType: 'IN' | 'OUT';
  dayId: string; // e.g. "day-sat", "day-wed", "week-2", "m-8"
  fullDateText: string;
  timeText: string;
  timestamp: number;
}

interface TransactionContextType {
  transactions: TransactionItem[];
  addTransaction: (data: OrderFormData, targetDayId?: string) => void;
  deleteTransaction: (id: string) => void;
  getTransactionsByDay: (dayId: string, type?: 'IN' | 'OUT') => TransactionItem[];
  getTotalByType: (type: 'IN' | 'OUT', dayId?: string) => number;
}

const INITIAL_TRANSACTIONS: TransactionItem[] = [
  // Income Items for Saturday 15 Aug (day-sat)
  {
    id: 'trx-inc-1',
    name: 'Kopi Susu Aren Special',
    category: 'Minuman',
    quantity: 15,
    unit: 'Cup',
    price: 22000,
    total: 330000,
    paymentMethod: 'Lunas',
    transactionType: 'IN',
    dayId: 'day-sat',
    fullDateText: 'Sabtu, 15 Agustus 2026',
    timeText: '14:20 WIB',
    timestamp: Date.now() - 3600000,
  },
  {
    id: 'trx-inc-2',
    name: 'Roti Bakar Keju Cokelat',
    category: 'Makanan',
    quantity: 8,
    unit: 'Porsi',
    price: 25000,
    total: 200000,
    paymentMethod: 'Lunas',
    transactionType: 'IN',
    dayId: 'day-sat',
    fullDateText: 'Sabtu, 15 Agustus 2026',
    timeText: '15:10 WIB',
    timestamp: Date.now() - 1800000,
  },
  // Expense Items for Saturday 15 Aug (day-sat)
  {
    id: 'trx-exp-1',
    name: 'Biji Kopi Arabika 1kg',
    category: 'Bahan Baku',
    quantity: 2,
    unit: 'Kg',
    price: 125000,
    total: 250000,
    paymentMethod: 'Lunas',
    transactionType: 'OUT',
    dayId: 'day-sat',
    fullDateText: 'Sabtu, 15 Agustus 2026',
    timeText: '09:30 WIB',
    timestamp: Date.now() - 10000000,
  },
  {
    id: 'trx-exp-2',
    name: 'Susu UHT Full Cream 1L',
    category: 'Bahan Baku',
    quantity: 10,
    unit: 'Karton',
    price: 18000,
    total: 180000,
    paymentMethod: 'Lunas',
    transactionType: 'OUT',
    dayId: 'day-sat',
    fullDateText: 'Sabtu, 15 Agustus 2026',
    timeText: '10:00 WIB',
    timestamp: Date.now() - 9000000,
  },
  // Items for Wednesday 12 Aug (day-wed)
  {
    id: 'trx-inc-3',
    name: 'Espresso Double Shot',
    category: 'Minuman',
    quantity: 10,
    unit: 'Cup',
    price: 18000,
    total: 180000,
    paymentMethod: 'Lunas',
    transactionType: 'IN',
    dayId: 'day-wed',
    fullDateText: 'Rabu, 12 Agustus 2026',
    timeText: '11:00 WIB',
    timestamp: Date.now() - 86400000 * 3,
  },
  {
    id: 'trx-exp-3',
    name: 'Cup Plastik Sablon 16oz',
    category: 'Kemasan',
    quantity: 5,
    unit: 'Pack',
    price: 35000,
    total: 175000,
    paymentMethod: 'Hutang',
    transactionType: 'OUT',
    dayId: 'day-wed',
    fullDateText: 'Rabu, 12 Agustus 2026',
    timeText: '13:45 WIB',
    timestamp: Date.now() - 86400000 * 3,
  },
];

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export function TransactionProvider({ children }: { children: React.ReactNode }) {
  const [transactions, setTransactions] = useState<TransactionItem[]>(INITIAL_TRANSACTIONS);

  const addTransaction = (data: OrderFormData, targetDayId?: string) => {
    const qty = data.quantity || 1;
    const price = data.price || 0;
    const total = qty * price;
    const assignedDayId = targetDayId || 'day-sat'; // Default to today/newest day (Sabtu, 15 Agustus 2026)

    const now = new Date();
    const timeText = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
    const fullDateText = 'Sabtu, 15 Agustus 2026';

    const newTrx: TransactionItem = {
      id: 'trx-' + Date.now(),
      name: data.name,
      category: data.category || 'Umum',
      quantity: qty,
      unit: data.unit || 'Pcs',
      price: price,
      total: total,
      paymentMethod: data.paymentMethod || 'Lunas',
      transactionType: data.transactionType || 'IN',
      dayId: assignedDayId,
      fullDateText: fullDateText,
      timeText: timeText,
      timestamp: Date.now(),
    };

    setTransactions((prev) => [newTrx, ...prev]);
  };

  const deleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((item) => item.id !== id));
  };

  const getTransactionsByDay = (dayId: string, type?: 'IN' | 'OUT') => {
    return transactions.filter((t) => {
      const matchDay = t.dayId === dayId;
      const matchType = type ? t.transactionType === type : true;
      return matchDay && matchType;
    });
  };

  const getTotalByType = (type: 'IN' | 'OUT', dayId?: string) => {
    return transactions
      .filter((t) => t.transactionType === type && (dayId ? t.dayId === dayId : true))
      .reduce((acc, curr) => acc + curr.total, 0);
  };

  return (
    <TransactionContext.Provider
      value={{
        transactions,
        addTransaction,
        deleteTransaction,
        getTransactionsByDay,
        getTotalByType,
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
}

export function useTransactions() {
  const context = useContext(TransactionContext);
  if (!context) {
    throw new Error('useTransactions must be used within a TransactionProvider');
  }
  return context;
}
