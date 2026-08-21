import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { SQLiteDatabase } from 'expo-sqlite';
import { OrderFormData } from '@/components/OrderModal';
import { TransactionService } from '@/services/TransactionService';
import { CustomerRepository, Customer } from '@/repositories/CustomerRepository';
import { toSQLiteDateTime, fromSQLiteDateTime } from '@/utils/dateUtils';

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
  customers: Customer[];
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

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

const DAYS_MAP = ['day-sun', 'day-mon', 'day-tue', 'day-wed', 'day-thu', 'day-fri', 'day-sat'];
const DAYS_NAMES = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const MONTHS_NAMES = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

function mapDbToTransactionItem(t: any): TransactionItem {
  const d = fromSQLiteDateTime(t.transaction_date);
  const qty = t.quantity || 1;
  const unitPrice = t.unit_price || 0;
  const nominal = t.nominal || 0;

  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');

  const dateNum = d.getDate();
  let weekKey = 'W1';
  if (dateNum > 28) weekKey = 'W5';
  else if (dateNum > 21) weekKey = 'W4';
  else if (dateNum > 14) weekKey = 'W3';
  else if (dateNum > 7) weekKey = 'W2';

  return {
    id: String(t.id),
    name: t.description || t.category_name || 'Transaksi',
    category: t.category_name || 'Umum',
    quantity: qty,
    unit: 'Pcs',
    price: unitPrice,
    total: nominal,
    paymentMethod: t.payment_method === 'Hutang' ? 'Hutang' : 'Lunas',
    transactionType: t.transaction_type as 'IN' | 'OUT',
    debtorName: t.customer_name || undefined,
    debtStatus: t.payment_method === 'Hutang' ? 'Belum Lunas' : 'Lunas',
    monthKey: `${yyyy}-${mm}`,
    weekKey,
    dateKey: `${yyyy}-${mm}-${dd}`,
    dayId: DAYS_MAP[d.getDay()],
    fullDateText: `${DAYS_NAMES[d.getDay()]}, ${d.getDate()} ${MONTHS_NAMES[d.getMonth()]} ${yyyy}`,
    timeText: `${h}:${m} WIB`,
    timestamp: d.getTime(),
  };
}

export function TransactionProvider({ children, db }: { children: React.ReactNode; db: SQLiteDatabase }) {
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  const reloadTransactions = useCallback(async () => {
    try {
      const svc = new TransactionService(db);
      const dbList = await svc.getTransactions(500);
      setTransactions(dbList.map(mapDbToTransactionItem));
      
      const custRepo = new CustomerRepository(db);
      const custList = await custRepo.getAllCustomers();
      setCustomers(custList);
    } catch (err) {
      console.log('Error loading data from DB:', err);
    }
  }, [db]);

  useEffect(() => {
    reloadTransactions();
  }, [reloadTransactions]);

  const addTransaction = async (data: OrderFormData, targetDayId?: string, customDate?: Date) => {
    const qty = data.quantity || 1;
    const price = data.price || 0;
    const total = qty * price;
    const now = customDate || new Date();

    try {
      const svc = new TransactionService(db);
      await svc.createTransaction({
        transaction_date: toSQLiteDateTime(now),
        transaction_type: data.transactionType || 'IN',
        category_id: data.transactionType === 'OUT' ? 4 : 1,
        cash_id: 1,
        nominal: total,
        quantity: qty,
        unit_price: price,
        payment_method: data.paymentMethod || 'Lunas',
        description: data.name,
        customer_name: data.debtorName,
      });
      await reloadTransactions();
    } catch (err) {
      console.log('Error adding transaction:', err);
    }
  };

  const updateTransaction = async (id: string, data: Partial<OrderFormData>) => {
    try {
      const svc = new TransactionService(db);
      const qty = data.quantity;
      const price = data.price;
      const nominal = qty !== undefined && price !== undefined ? qty * price : undefined;

      await svc.updateTransaction(id, {
        transaction_type: data.transactionType,
        nominal: nominal,
        quantity: qty,
        unit_price: price,
        payment_method: data.paymentMethod,
        description: data.name,
        customer_name: data.debtorName,
      });
      await reloadTransactions();
    } catch (err) {
      console.log('Error updating transaction:', err);
    }
  };

  const deleteTransaction = async (id: string) => {
    try {
      const svc = new TransactionService(db);
      await svc.deleteTransaction(id);
      await reloadTransactions();
    } catch (err) {
      console.log('Error deleting transaction:', err);
    }
  };

  const toggleDebtStatus = async (id: string) => {
    try {
      const existing = transactions.find((t) => t.id === id);
      if (!existing) return;

      const svc = new TransactionService(db);
      if (existing.debtStatus === 'Belum Lunas') {
        await svc.markDebtPaid(id);
      }
      await reloadTransactions();
    } catch (err) {
      console.log('Error toggling debt status:', err);
    }
  };

  const settleAllDebtsForPerson = async (debtorName: string) => {
    try {
      const svc = new TransactionService(db);
      const debts = await svc.getDebts();
      const target = debtorName.trim().toLowerCase();

      for (const debt of debts) {
        if ((debt.customer_name || '').trim().toLowerCase() === target) {
          await svc.markDebtPaid(debt.id);
        }
      }
      await reloadTransactions();
    } catch (err) {
      console.log('Error settling debts:', err);
    }
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

  const markDebtAsPaid = async (id: string) => {
    try {
      const svc = new TransactionService(db);
      await svc.markDebtPaid(id);
      await reloadTransactions();
    } catch (err) {
      console.log('Error marking debt as paid:', err);
    }
  };

  return (
    <TransactionContext.Provider
      value={{
        transactions,
        customers,
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
