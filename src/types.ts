export interface Card {
  id: string;
  name: string;
  limit: number;
  closingDay: number;
  dueDay: number;
}

export interface Transaction {
  id: string;
  cardId: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  type: 'fixed' | 'variable';
  isInstallment: boolean;
  installmentId?: string;
  currentInstallment?: number;
  totalInstallments?: number;
}

export interface Installment {
  id: string;
  transactionId: string;
  totalAmount: number;
  currentInstallment: number;
  totalInstallments: number;
  installmentAmount: number;
  startDate: string;
}

export interface ExtractedData {
  establishment: string;
  date: string;
  totalValue: number;
  isInstallment: boolean;
  currentInstallment?: number;
  totalInstallments?: number;
  type: 'fixed' | 'variable';
  category: string;
}
