import { create } from 'zustand';
console.log("[walletStore] Module Start");
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api/apiClient';
import { useAuthStore } from './authStore';

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'credit' | 'debit';
  status: 'Completed' | 'Pending' | 'Failed';
}

export interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  holderName: string;
  verified: boolean;
  isPrimary: boolean;
}

export type BankAccountInput = Omit<BankAccount, 'id' | 'verified' | 'isPrimary'>;

interface WithdrawalOptions {
  bankAccountId?: string;
  upiId?: string;
}

interface WalletState {
  balance: number;
  totalEarnings: number;
  transactions: Transaction[];
  bankAccount: BankAccount | null;    // primary account (kept for backward compatibility)
  bankAccounts: BankAccount[];        // all saved accounts (max 3)
  upiId: string | null;
  isLoading: boolean;
  fetchWallet: () => Promise<void>;
  fetchTransactions: () => Promise<void>;
  fetchBankAccount: () => Promise<void>;
  fetchBankAccounts: () => Promise<void>;
  syncBalance: (balance: number) => void;
  addBankAccount: (bank: BankAccountInput) => Promise<void>;
  updateBankAccount: (id: string, bank: BankAccountInput) => Promise<void>;
  deleteBankAccount: (id: string) => Promise<void>;
  setPrimaryBankAccount: (id: string) => Promise<void>;
  addUpiId: (upi: string) => Promise<void>;
  removeUpiId: () => void;
  requestWithdrawal: (amount: number, method: 'bank' | 'upi', options?: WithdrawalOptions) => Promise<boolean>;
  creditReward: (amount: number, description: string) => void;
  sellCarbonCredits: (credits: number) => Promise<boolean>;
  resetWallet: () => void;
}

function mapBankAccount(acct: any): BankAccount {
  return {
    id: acct.id,
    bankName: acct.bank_name,
    accountNumber: acct.account_number,
    ifscCode: acct.ifsc_code,
    holderName: acct.account_holder_name,
    verified: acct.is_active,
    isPrimary: acct.is_primary,
  };
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set, get) => ({
      balance: 0,
      totalEarnings: 0,
      transactions: [],
      bankAccount: null,
      bankAccounts: [],
      upiId: null,
      isLoading: false,

      fetchWallet: async () => {
        try {
          const { data } = await api.get('/farmer/wallet');
          const w = data.data;
          set({
            balance: w.balance,
            totalEarnings: w.total_earnings,
          });
        } catch {
          // Keep existing cached state on error
        }
      },

      fetchTransactions: async () => {
        try {
          const { data } = await api.get('/farmer/wallet/transactions');
          const items: any[] = data.data ?? [];
          const transactions: Transaction[] = items.map((tx) => ({
            id: tx.id,
            date: tx.created_at
              ? new Date(tx.created_at).toISOString().split('T')[0]
              : '',
            description: tx.description,
            amount: tx.amount,
            type: tx.type as 'credit' | 'debit',
            status:
              (tx.status === 'completed' || tx.status === 'approved')
                ? 'Completed'
                : (tx.status === 'rejected' || tx.status === 'failed')
                  ? 'Failed'
                  : 'Pending',
          }));
          set({ transactions });
        } catch {
          // Keep existing cached transactions on error
        }
      },

      fetchBankAccount: async () => {
        try {
          const { data } = await api.get('/farmer/wallet/bank-account');
          set({ bankAccount: mapBankAccount(data.data) });
        } catch (error: any) {
          if (error?.response?.status === 404) {
            set({ bankAccount: null });
          }
          // For other errors, preserve the cached bank account
        }
      },

      fetchBankAccounts: async () => {
        try {
          const { data } = await api.get('/farmer/wallet/bank-accounts');
          const items: any[] = data.data ?? [];
          const bankAccounts = items.map(mapBankAccount);
          const primary = bankAccounts.find((a) => a.isPrimary) ?? bankAccounts[0] ?? null;
          set({ bankAccounts, bankAccount: primary });
        } catch {
          // Keep existing cached accounts on error
        }
      },

      syncBalance: (balance: number) => {
        set({ balance });
      },

      addBankAccount: async (bankData) => {
        set({ isLoading: true });
        try {
          await api.post('/farmer/wallet/bank-account', {
            bank_name: bankData.bankName,
            account_number: bankData.accountNumber,
            ifsc_code: bankData.ifscCode,
            account_holder_name: bankData.holderName,
          });
          await get().fetchBankAccounts();
          set({ isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      updateBankAccount: async (id, bankData) => {
        set({ isLoading: true });
        try {
          await api.put(`/farmer/wallet/bank-account/${id}`, {
            bank_name: bankData.bankName,
            account_number: bankData.accountNumber,
            ifsc_code: bankData.ifscCode,
            account_holder_name: bankData.holderName,
          });
          await get().fetchBankAccounts();
          set({ isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      deleteBankAccount: async (id) => {
        set({ isLoading: true });
        try {
          await api.delete(`/farmer/wallet/bank-account/${id}`);
          await get().fetchBankAccounts();
          set({ isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      setPrimaryBankAccount: async (id) => {
        set({ isLoading: true });
        try {
          await api.put(`/farmer/wallet/bank-account/${id}/primary`);
          await get().fetchBankAccounts();
          set({ isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      addUpiId: async (upi) => {
        // UPI payouts are not yet supported by the backend — stored locally only.
        set({ upiId: upi });
      },

      removeUpiId: () => {
        set({ upiId: null });
      },

      requestWithdrawal: async (amount, method, options) => {
        if (amount <= 0 || amount > get().balance) return false;
        set({ isLoading: true });
        try {
          await api.post('/farmer/wallet/withdraw', {
            amount,
            payment_method: method,
            bank_account_id: method === 'bank' ? options?.bankAccountId : undefined,
            upi_id: method === 'upi' ? options?.upiId : undefined,
          });
          // Refresh balance and ledger from backend after request is accepted
          await get().fetchWallet();
          await get().fetchTransactions();
          set({ isLoading: false });
          return true;
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      creditReward: (amount, description) => {
        // Local credit entry used by Carbon Credit module until its backend is wired.
        const txnId = `TXN-${Math.floor(Math.random() * 90000) + 10000}`;
        const newTxn: Transaction = {
          id: txnId,
          date: new Date().toISOString().split('T')[0],
          description,
          amount,
          type: 'credit',
          status: 'Completed',
        };
        set({
          balance: get().balance + amount,
          totalEarnings: get().totalEarnings + amount,
          transactions: [newTxn, ...get().transactions],
        });
      },

      sellCarbonCredits: async (credits: number) => {
        set({ isLoading: true });
        try {
          const res = await api.post('/farmer/wallet/sell-credits', {
            credits_to_sell: credits
          });
          
          if (res.data?.success) {
            const data = res.data.data;
            const netAmount = data.net_amount_earned;
            
            // Format description based on whether tax was applied
            let desc = `Sold ${credits} CO₂e Carbon Credits`;
            if (data.gross_amount > 5000) {
              desc += ` (Net after 25% tax)`;
            }
            
            // Log transaction as Pending
            const txnId = `TXN-${Math.floor(Math.random() * 90000) + 10000}`;
            const newTxn: Transaction = {
              id: txnId,
              date: new Date().toISOString().split('T')[0],
              description: desc,
              amount: netAmount,
              type: 'credit',
              status: 'Pending',
            };

            set({
              // We do NOT update balance because it's pending admin approval
              transactions: [newTxn, ...get().transactions],
              isLoading: false,
            });
            
            // Sync with auth store to get updated credits
            useAuthStore.getState().fetchProfile().catch(() => {});
            return true;
          }
          set({ isLoading: false });
          return false;
        } catch (error) {
          console.warn('[walletStore] sellCarbonCredits error', error);
          set({ isLoading: false });
          return false;
        }
      },

      resetWallet: () => {
        // Clears cached wallet state on logout so the next farmer to sign in
        // on this device never inherits a previous farmer's balance, bank
        // accounts, or UPI ID from persisted AsyncStorage.
        set({
          balance: 0,
          totalEarnings: 0,
          transactions: [],
          bankAccount: null,
          bankAccounts: [],
          upiId: null,
          isLoading: false,
        });
      },
    }),

    {
      name: 'bhumicred_wallet_store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
