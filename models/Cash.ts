export interface Cash {
  id: string;
  cash_name: string | null;
  opening_balance: number;
  current_balance: number;
  total_income: number;
  total_expense: number;
  last_transaction: string | null;
  updated_at: string | null;
}
