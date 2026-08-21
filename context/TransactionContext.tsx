import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { OrderFormData } from '@/components/OrderModal';

const STORAGE_KEY = '@simakan_transactions_v2';

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
  debtorName?: string;
  debtStatus?: 'Belum Lunas' | 'Lunas';
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
  updateTransaction: (id: string, data: Partial<OrderFormData>) => void;
  deleteTransaction: (id: string) => void;
  toggleDebtStatus: (id: string) => void;
  settleAllDebtsForPerson: (debtorName: string) => void;
  getTransactionsByDay: (dayId: string, type?: 'IN' | 'OUT') => TransactionItem[];
  getTotalByType: (type: 'IN' | 'OUT', dayId?: string) => number;
  getDebtTransactions: () => TransactionItem[];
  markDebtAsPaid: (id: string) => void;
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
    debtStatus: 'Lunas',
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
    debtStatus: 'Lunas',
    monthKey: '2026-08',
    weekKey: 'W3',
    dateKey: '2026-08-15',
    dayId: 'day-sat',
    fullDateText: 'Sabtu, 15 Agustus 2026',
    timeText: '15:10 WIB',
    timestamp: new Date('2026-08-15T15:10:00').getTime(),
  },
  {
    id: 'trx-inc-hutang-1',
    name: 'Kopi Susu Aren Special',
    category: 'Minuman',
    quantity: 3,
    unit: 'Cup',
    price: 22000,
    total: 66000,
    paymentMethod: 'Hutang',
    transactionType: 'IN',
    debtorName: 'Pak Budi (Guru SMA)',
    debtStatus: 'Belum Lunas',
    monthKey: '2026-08',
    weekKey: 'W3',
    dateKey: '2026-08-15',
    dayId: 'day-sat',
    fullDateText: 'Sabtu, 15 Agustus 2026',
    timeText: '15:30 WIB',
    timestamp: new Date('2026-08-15T15:30:00').getTime(),
  },
  {
    id: 'trx-inc-hutang-1b',
    name: 'Roti Bakar Keju Cokelat',
    category: 'Makanan',
    quantity: 2,
    unit: 'Porsi',
    price: 25000,
    total: 50000,
    paymentMethod: 'Hutang',
    transactionType: 'IN',
    debtorName: 'Pak Budi (Guru SMA)',
    debtStatus: 'Belum Lunas',
    monthKey: '2026-08',
    weekKey: 'W3',
    dateKey: '2026-08-15',
    dayId: 'day-sat',
    fullDateText: 'Sabtu, 15 Agustus 2026',
    timeText: '15:40 WIB',
    timestamp: new Date('2026-08-15T15:40:00').getTime(),
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
    debtStatus: 'Lunas',
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
    debtStatus: 'Lunas',
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
    debtStatus: 'Lunas',
    monthKey: '2026-08',
    weekKey: 'W3',
    dateKey: '2026-08-15',
    dayId: 'day-sat',
    fullDateText: 'Sabtu, 15 Agustus 2026',
    timeText: '10:00 WIB',
    timestamp: new Date('2026-08-15T10:00:00').getTime(),
  },

  // Jumat, 14 Agustus 2026
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
    debtStatus: 'Lunas',
    monthKey: '2026-08',
    weekKey: 'W2',
    dateKey: '2026-08-14',
    dayId: 'day-fri',
    fullDateText: 'Jumat, 14 Agustus 2026',
    timeText: '13:15 WIB',
    timestamp: new Date('2026-08-14T13:15:00').getTime(),
  },
  {
    id: 'trx-inc-hutang-2',
    name: 'Nasi Goreng Spesial Telur',
    category: 'Makanan',
    quantity: 2,
    unit: 'Porsi',
    price: 28000,
    total: 56000,
    paymentMethod: 'Hutang',
    transactionType: 'IN',
    debtorName: 'Mas Fajar (Santri)',
    debtStatus: 'Belum Lunas',
    monthKey: '2026-08',
    weekKey: 'W2',
    dateKey: '2026-08-14',
    dayId: 'day-fri',
    fullDateText: 'Jumat, 14 Agustus 2026',
    timeText: '12:00 WIB',
    timestamp: new Date('2026-08-14T12:00:00').getTime(),
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
    debtStatus: 'Lunas',
    monthKey: '2026-08',
    weekKey: 'W2',
    dateKey: '2026-08-14',
    dayId: 'day-fri',
    fullDateText: 'Jumat, 14 Agustus 2026',
    timeText: '11:20 WIB',
    timestamp: new Date('2026-08-14T11:20:00').getTime(),
  },

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
    debtStatus: 'Lunas',
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
    debtStatus: 'Lunas',
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
    paymentMethod: 'Lunas',
    transactionType: 'OUT',
    debtStatus: 'Lunas',
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
    debtStatus: 'Lunas',
    monthKey: '2026-08',
    weekKey: 'W2',
    dateKey: '2026-08-10',
    dayId: 'day-mon',
    fullDateText: 'Senin, 10 Agustus 2026',
    timeText: '10:15 WIB',
    timestamp: new Date('2026-08-10T10:15:00').getTime(),
  },
  {
    id: 'trx-inc-hutang-3',
    name: 'Roti Bakar Keju Cokelat',
    category: 'Makanan',
    quantity: 4,
    unit: 'Porsi',
    price: 25000,
    total: 100000,
    paymentMethod: 'Hutang',
    transactionType: 'IN',
    debtorName: 'Bu Ani (Staf Yayasan)',
    debtStatus: 'Lunas',
    monthKey: '2026-08',
    weekKey: 'W2',
    dateKey: '2026-08-10',
    dayId: 'day-mon',
    fullDateText: 'Senin, 10 Agustus 2026',
    timeText: '11:00 WIB',
    timestamp: new Date('2026-08-10T11:00:00').getTime(),
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
    debtStatus: 'Lunas',
    monthKey: '2026-08',
    weekKey: 'W2',
    dateKey: '2026-08-10',
    dayId: 'day-mon',
    fullDateText: 'Senin, 10 Agustus 2026',
    timeText: '09:00 WIB',
    timestamp: new Date('2026-08-10T09:00:00').getTime(),
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
    const now = customDate || new Date();
    const dayMap = ['day-sun', 'day-mon', 'day-tue', 'day-wed', 'day-thu', 'day-fri', 'day-sat'];
    const assignedDayId = targetDayId || dayMap[now.getDay()];

    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    const timeText = `${h}:${m} WIB`;
    
    // Format full date text
    const DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    
    const fullDateText = `${DAYS[now.getDay()]}, ${now.getDate()} ${MONTHS[now.getMonth()]} ${now.getFullYear()}`;

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

    const isDebt = data.paymentMethod === 'Hutang';
    const assignedDebtor = isDebt ? (data.debtorName?.trim() || 'Tanpa Nama') : undefined;
    const assignedDebtStatus = isDebt ? (data.debtStatus || 'Belum Lunas') : 'Lunas';

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
      debtorName: assignedDebtor,
      debtStatus: assignedDebtStatus,
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

  const updateTransaction = (id: string, data: Partial<OrderFormData>) => {
    setTransactions((prev) => {
      const updated = prev.map((item) => {
        if (item.id === id) {
          const qty = data.quantity !== undefined ? data.quantity : item.quantity;
          const price = data.price !== undefined ? data.price : item.price;
          const total = qty * price;
          const isDebt = (data.paymentMethod ?? item.paymentMethod) === 'Hutang';

          return {
            ...item,
            name: data.name ?? item.name,
            category: data.category ?? item.category,
            quantity: qty,
            unit: data.unit ?? item.unit,
            price: price,
            total: total,
            paymentMethod: (data.paymentMethod ?? item.paymentMethod) as 'Lunas' | 'Hutang',
            transactionType: (data.transactionType ?? item.transactionType) as 'IN' | 'OUT',
            debtorName: isDebt ? (data.debtorName ?? item.debtorName ?? 'Tanpa Nama') : undefined,
            debtStatus: isDebt ? (data.debtStatus ?? item.debtStatus ?? 'Belum Lunas') : 'Lunas',
          };
        }
        return item;
      });
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

  // Mark debt as Paid (Lunas) or toggle back to Belum Lunas
  const toggleDebtStatus = (id: string) => {
    setTransactions((prev) => {
      const updated = prev.map((item) => {
        if (item.id === id) {
          const newStatus: 'Belum Lunas' | 'Lunas' =
            item.debtStatus === 'Belum Lunas' ? 'Lunas' : 'Belum Lunas';
          return {
            ...item,
            debtStatus: newStatus,
            paymentMethod: newStatus === 'Lunas' ? ('Lunas' as const) : ('Hutang' as const),
          };
        }
        return item;
      });
      saveTransactions(updated);
      return updated;
    });
  };

  // Settle all unpaid debts for a specific person in one action
  const settleAllDebtsForPerson = (debtorName: string) => {
    const target = debtorName.trim().toLowerCase();
    setTransactions((prev) => {
      const updated = prev.map((item) => {
        if ((item.debtorName || '').trim().toLowerCase() === target) {
          return {
            ...item,
            debtStatus: 'Lunas' as const,
            paymentMethod: 'Lunas' as const,
          };
        }
        return item;
      });
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

  const getDebtTransactions = () => {
    return transactions.filter((t) => t.paymentMethod === 'Hutang');
  };

  const markDebtAsPaid = (id: string) => {
    setTransactions((prev) => {
      const updated = prev.map((item) => {
        if (item.id === id) {
          return {
            ...item,
            debtStatus: 'Lunas' as const,
            paymentMethod: 'Lunas' as const,
          };
        }
        return item;
      });
      saveTransactions(updated);
      return updated;
    });
  };

  return (
    <TransactionContext.Provider
      value={{
        transactions,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        toggleDebtStatus,
        settleAllDebtsForPerson,
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
