import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { OrderFormData } from '@/components/OrderModal';

const STORAGE_KEY = '@simakan_transactions';

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
  monthKey: string; // e.g. "2026-08"
  weekKey: string;  // e.g. "W1", "W2", "W3", "W4", "W5"
  dateKey: string;  // e.g. "2026-08-15"
  dayId: string;    // e.g. "day-sat", "day-wed"
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
}

const INITIAL_TRANSACTIONS: TransactionItem[] = [
  // --- AGUSTUS 2026: MINGGU KE-3 (15 - 21 Ags) ---
  // Sabtu, 15 Agustus 2026 (Pemasukan)
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
  // Sabtu, 15 Agustus 2026 (Pengeluaran)
  {
    id: 'trx-exp-1',
    name: 'Biji Kopi Arabika Gayo 1kg',
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

  // Jumat, 14 Agustus 2026 (W2/W3 border)
  {
    id: 'trx-inc-8',
    name: 'Matcha Latte Ice',
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

  // --- AGUSTUS 2026: MINGGU KE-2 (08 - 14 Ags) ---
  // Rabu, 12 Agustus 2026
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

  // Senin, 10 Agustus 2026
  {
    id: 'trx-inc-5',
    name: 'Caramel Macchiato Large',
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

  // --- AGUSTUS 2026: MINGGU KE-1 (01 - 07 Ags) ---
  // Selasa, 04 Agustus 2026
  {
    id: 'trx-inc-6',
    name: 'Americano Ice Segar',
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

  // --- JULI 2026 SAMPLE DATA ---
  {
    id: 'trx-inc-jul-1',
    name: 'Ice Lemon Tea Jumbo',
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

  // Load persistent transactions on mount
  useEffect(() => {
    async function loadStoredTransactions() {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setTransactions(parsed);
          }
        }
      } catch (err) {
        console.log('Error loading transactions from storage:', err);
      }
    }
    loadStoredTransactions();
  }, []);

  const saveTransactions = async (items: TransactionItem[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (err) {
      console.log('Error saving transactions to storage:', err);
    }
  };

  const addTransaction = (data: OrderFormData, targetDayId?: string, customDate?: Date) => {
    const qty = data.quantity || 1;
    const price = data.price || 0;
    const total = qty * price;
    const assignedDayId = targetDayId || 'day-sat';

    const now = customDate || new Date();
    const timeText = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
    
    // Format full date text
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

    setTransactions((prev) => {
      const updated = [newTrx, ...prev];
      saveTransactions(updated);
      return updated;
    });
  };

  const deleteTransaction = (id: string) => {
    setTransactions((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      saveTransactions(updated);
      return updated;
    });
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

