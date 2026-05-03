export type TransactionType = 'income' | 'expense' | 'transfer';
export type AccountType = 'cash' | 'credit' | 'saving' | 'investment' | 'paypal' | 'bank' | 'other';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  icon?: string;
}

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  icon?: string;
  color: string;
  budget?: number;
}

export type PaymentMethod = 'cash' | 'card' | 'transfer' | 'online';

export interface Transaction {
  id: string;
  amount: number;
  note: string; // Short title/pattern
  description: string; // Longer details
  category: string;
  accountId: string; // From account
  toAccountId?: string; // For transfers
  type: TransactionType;
  paymentMethod: PaymentMethod;
  date: string; // ISO string 2024-05-01T14:30:00
  showTime: boolean;
  created_at: string;
}

export interface FinanceState {
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
}
