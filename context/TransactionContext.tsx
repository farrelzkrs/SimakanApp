import React, { createContext, useContext, useState } from 'react';
import { OrderFormData } from '@/components/OrderModal';

export interface TransactionItem {
  id: string;
  name: string;
  customerName: string;
  category: string;
  quantity: number;
  unit: string;
  price: number;
  total: number;
  paymentMethod: 'Lunas' | 'Hutang';
  transactionType: 'IN' | 'OUT';
  monthKey: string;
  weekKey: string;
  dateKey: string;
  dayId: string;
  fullDateText: string;
  timeText: string;
  timestamp: number;
}

interface TransactionContextType {
  transactions: TransactionItem[];
  addTransaction: (data: OrderFormData, targetDayId?: string, customDate?: Date) => void;
  deleteTransaction: (id: string) => void;
  getTransactionsByDay: (dayId: string, type?: 'IN' | 'OUT') => TransactionItem[];
  getTotalByType: (type: 'IN' | 'OUT', dayId?: string) => number;
  getDebtTransactions: () => TransactionItem[];
  markDebtAsPaid: (id: string) => void;
}

const INITIAL_TRANSACTIONS: TransactionItem[] = [
  {
    id: 'trx-inc-1',
    name: 'Kopi Susu Aren Special',
    customerName: 'Admin',
    category: 'Minuman',
    quantity: 15,
    unit: 'Cup',
    price: 22000,
    total: 330000,
    paymentMethod: 'Lunas',
    transactionType: 'IN',
    monthKey: '2026-08',
    weekKey: 'W3',
    dateKey: '2026-08-15',
    dayId: 'day-sat',
    fullDateText: 'Sabtu, 15 Agustus 2026',
    timeText: '14:20 WIB',
    timestamp: new Date('2026-08-15T14:20:00').getTime(),
  },
  {
    id: 'trx-inc-2',
    name: 'Roti Bakar Keju Cokelat',
    customerName: 'Admin',
    category: 'Makanan',
    quantity: 8,
    unit: 'Porsi',
    price: 25000,
    total: 200000,
    paymentMethod: 'Lunas',
    transactionType: 'IN',
    monthKey: '2026-08',
    weekKey: 'W3',
    dateKey: '2026-08-15',
    dayId: 'day-sat',
    fullDateText: 'Sabtu, 15 Agustus 2026',
    timeText: '15:10 WIB',
    timestamp: new Date('2026-08-15T15:10:00').getTime(),
  },
  {
    id: 'trx-inc-7',
    name: 'Croissant Butter Warm',
    customerName: 'Admin',
    category: 'Snack',
    quantity: 12,
    unit: 'Pcs',
    price: 18000,
    total: 216000,
    paymentMethod: 'Lunas',
    transactionType: 'IN',
    monthKey: '2026-08',
    weekKey: 'W3',
    dateKey: '2026-08-15',
    dayId: 'day-sat',
    fullDateText: 'Sabtu, 15 Agustus 2026',
    timeText: '16:45 WIB',
    timestamp: new Date('2026-08-15T16:45:00').getTime(),
  },
  {
    id: 'trx-exp-1',
    name: 'Biji Kopi Arabika Gayo 1kg',
    customerName: 'Admin',
    category: 'Bahan Baku',
    quantity: 2,
    unit: 'Kg',
    price: 125000,
    total: 250000,
    paymentMethod: 'Lunas',
    transactionType: 'OUT',
    monthKey: '2026-08',
    weekKey: 'W3',
    dateKey: '2026-08-15',
    dayId: 'day-sat',
    fullDateText: 'Sabtu, 15 Agustus 2026',
    timeText: '09:30 WIB',
    timestamp: new Date('2026-08-15T09:30:00').getTime(),
  },
  {
    id: 'trx-exp-2',
    name: 'Susu UHT Full Cream 1L',
    customerName: 'Admin',
    category: 'Bahan Baku',
    quantity: 10,
    unit: 'Karton',
    price: 18000,
    total: 180000,
    paymentMethod: 'Lunas',
    transactionType: 'OUT',
    monthKey: '2026-08',
    weekKey: 'W3',
    dateKey: '2026-08-15',
    dayId: 'day-sat',
    fullDateText: 'Sabtu, 15 Agustus 2026',
    timeText: '10:00 WIB',
    timestamp: new Date('2026-08-15T10:00:00').getTime(),
  },
  {
    id: 'trx-inc-8',
    name: 'Matcha Latte Ice',
    customerName: 'Admin',
    category: 'Minuman',
    quantity: 14,
    unit: 'Cup',
    price: 24000,
    total: 336000,
    paymentMethod: 'Lunas',
    transactionType: 'IN',
    monthKey: '2026-08',
    weekKey: 'W2',
    dateKey: '2026-08-14',
    dayId: 'day-fri',
    fullDateText: 'Jumat, 14 Agustus 2026',
    timeText: '13:15 WIB',
    timestamp: new Date('2026-08-14T13:15:00').getTime(),
  },
  {
    id: 'trx-exp-4',
    name: 'Sirup Karamel 750ml',
    customerName: 'Admin',
    category: 'Bahan Baku',
    quantity: 3,
    unit: 'Botol',
    price: 65000,
    total: 195000,
    paymentMethod: 'Lunas',
    transactionType: 'OUT',
    monthKey: '2026-08',
    weekKey: 'W2',
    dateKey: '2026-08-14',
    dayId: 'day-fri',
    fullDateText: 'Jumat, 14 Agustus 2026',
    timeText: '11:20 WIB',
    timestamp: new Date('2026-08-14T11:20:00').getTime(),
  },
  {
    id: 'trx-inc-3',
    name: 'Espresso Double Shot',
    customerName: 'Admin',
    category: 'Minuman',
    quantity: 10,
    unit: 'Cup',
    price: 18000,
    total: 180000,
    paymentMethod: 'Lunas',
    transactionType: 'IN',
    monthKey: '2026-08',
    weekKey: 'W2',
    dateKey: '2026-08-12',
    dayId: 'day-wed',
    fullDateText: 'Rabu, 12 Agustus 2026',
    timeText: '11:00 WIB',
    timestamp: new Date('2026-08-12T11:00:00').getTime(),
  },
  {
    id: 'trx-inc-4',
    name: 'Nasi Goreng Spesial Telur',
    customerName: 'Admin',
    category: 'Makanan',
    quantity: 6,
    unit: 'Porsi',
    price: 28000,
    total: 168000,
    paymentMethod: 'Lunas',
    transactionType: 'IN',
    monthKey: '2026-08',
    weekKey: 'W2',
    dateKey: '2026-08-12',
    dayId: 'day-wed',
    fullDateText: 'Rabu, 12 Agustus 2026',
    timeText: '12:30 WIB',
    timestamp: new Date('2026-08-12T12:30:00').getTime(),
  },
  {
    id: 'trx-exp-3',
    name: 'Cup Plastik Sablon 16oz',
    customerName: 'Pak Budi',
    category: 'Kemasan',
    quantity: 5,
    unit: 'Pack',
    price: 35000,
    total: 175000,
    paymentMethod: 'Hutang',
    transactionType: 'OUT',
    monthKey: '2026-08',
    weekKey: 'W2',
    dateKey: '2026-08-12',
    dayId: 'day-wed',
    fullDateText: 'Rabu, 12 Agustus 2026',
    timeText: '13:45 WIB',
    timestamp: new Date('2026-08-12T13:45:00').getTime(),
  },
  {
    id: 'trx-inc-5',
    name: 'Caramel Macchiato Large',
    customerName: 'Admin',
    category: 'Minuman',
    quantity: 8,
    unit: 'Cup',
    price: 26000,
    total: 208000,
    paymentMethod: 'Lunas',
    transactionType: 'IN',
    monthKey: '2026-08',
    weekKey: 'W2',
    dateKey: '2026-08-10',
    dayId: 'day-mon',
    fullDateText: 'Senin, 10 Agustus 2026',
    timeText: '10:15 WIB',
    timestamp: new Date('2026-08-10T10:15:00').getTime(),
  },
  {
    id: 'trx-exp-5',
    name: 'Gas Elpiji 12kg',
    customerName: 'Admin',
    category: 'Operasional',
    quantity: 1,
    unit: 'Tabung',
    price: 215000,
    total: 215000,
    paymentMethod: 'Lunas',
    transactionType: 'OUT',
    monthKey: '2026-08',
    weekKey: 'W2',
    dateKey: '2026-08-10',
    dayId: 'day-mon',
    fullDateText: 'Senin, 10 Agustus 2026',
    timeText: '08:45 WIB',
    timestamp: new Date('2026-08-10T08:45:00').getTime(),
  },
  {
    id: 'trx-inc-6',
    name: 'Americano Ice Segar',
    customerName: 'Admin',
    category: 'Minuman',
    quantity: 12,
    unit: 'Cup',
    price: 16000,
    total: 192000,
    paymentMethod: 'Lunas',
    transactionType: 'IN',
    monthKey: '2026-08',
    weekKey: 'W1',
    dateKey: '2026-08-04',
    dayId: 'day-tue',
    fullDateText: 'Selasa, 04 Agustus 2026',
    timeText: '09:40 WIB',
    timestamp: new Date('2026-08-04T09:40:00').getTime(),
  },
  {
    id: 'trx-exp-6',
    name: 'Sedotan Steril & Tissue Paper',
    customerName: 'Admin',
    category: 'Kemasan',
    quantity: 4,
    unit: 'Pack',
    price: 25000,
    total: 100000,
    paymentMethod: 'Lunas',
    transactionType: 'OUT',
    monthKey: '2026-08',
    weekKey: 'W1',
    dateKey: '2026-08-04',
    dayId: 'day-tue',
    fullDateText: 'Selasa, 04 Agustus 2026',
    timeText: '11:00 WIB',
    timestamp: new Date('2026-08-04T11:00:00').getTime(),
  },
  {
    id: 'trx-inc-jul-1',
    name: 'Ice Lemon Tea Jumbo',
    customerName: 'Admin',
    category: 'Minuman',
    quantity: 20,
    unit: 'Cup',
    price: 15000,
    total: 300000,
    paymentMethod: 'Lunas',
    transactionType: 'IN',
    monthKey: '2026-07',
    weekKey: 'W4',
    dateKey: '2026-07-25',
    dayId: 'day-sat',
    fullDateText: 'Sabtu, 25 Juli 2026',
    timeText: '15:30 WIB',
    timestamp: new Date('2026-07-25T15:30:00').getTime(),
  },
  {
    id: 'trx-exp-jul-1',
    name: 'Listrik & Token PLN Juli',
    customerName: 'Admin',
    category: 'Operasional',
    quantity: 1,
    unit: 'Bulan',
    price: 350000,
    total: 350000,
    paymentMethod: 'Lunas',
    transactionType: 'OUT',
    monthKey: '2026-07',
    weekKey: 'W4',
    dateKey: '2026-07-25',
    dayId: 'day-sat',
    fullDateText: 'Sabtu, 25 Juli 2026',
    timeText: '10:00 WIB',
    timestamp: new Date('2026-07-25T10:00:00').getTime(),
  },
];

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export function TransactionProvider({ children }: { children: React.ReactNode }) {
  const [transactions, setTransactions] = useState<TransactionItem[]>(INITIAL_TRANSACTIONS);

  const addTransaction = (data: OrderFormData, targetDayId?: string, customDate?: Date) => {
    const qty = data.quantity || 1;
    const price = data.price || 0;
    const total = qty * price;
    const assignedDayId = targetDayId || 'day-sat';

    const now = customDate || new Date();
    const timeText = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
    
    const fullDateText = now.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const monthKey = `${yyyy}-${mm}`;
    const dateKey = `${yyyy}-${mm}-${dd}`;

    const dateNum = now.getDate();
    let weekKey = 'W1';
    if (dateNum > 28) weekKey = 'W5';
    else if (dateNum > 21) weekKey = 'W4';
    else if (dateNum > 14) weekKey = 'W3';
    else if (dateNum > 7) weekKey = 'W2';

    const newTrx: TransactionItem = {
      id: 'trx-' + Date.now(),
      name: data.name,
      customerName: data.customerName || 'Admin',
      category: data.category || 'Umum',
      quantity: qty,
      unit: data.unit || 'Pcs',
      price: price,
      total: total,
      paymentMethod: data.paymentMethod || 'Lunas',
      transactionType: data.transactionType || 'IN',
      monthKey,
      weekKey,
      dateKey,
      dayId: assignedDayId,
      fullDateText,
      timeText,
      timestamp: now.getTime(),
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

  const getDebtTransactions = () => {
    return transactions.filter((t) => t.paymentMethod === 'Hutang');
  };

  const markDebtAsPaid = (id: string) => {
    setTransactions((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, paymentMethod: 'Lunas' as const } : t
      )
    );
  };

  return (
    <TransactionContext.Provider
      value={{
        transactions,
        addTransaction,
        deleteTransaction,
        getTransactionsByDay,
        getTotalByType,
        getDebtTransactions,
        markDebtAsPaid,
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
