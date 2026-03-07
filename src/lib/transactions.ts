import { getCurrentUser } from './auth';
import { USE_BACKEND } from './api-config';
import { transactionsAPI } from './api';

export interface TransactionRequest {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  type: 'send' | 'receive';
  asset: string;
  amount: number;
  address: string;
  fee: number;
  feePercent: number;
  netAmount: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: number;
  reviewedAt?: number;
  reviewedBy?: string;
  note?: string;
}

const TXN_KEY = 'hub-transactions';

export const FEE_SCHEDULE: Record<string, { makerFee: number; takerFee: number; withdrawalFee: number }> = {
  BTC: { makerFee: 0.001, takerFee: 0.001, withdrawalFee: 0.0005 },
  ETH: { makerFee: 0.001, takerFee: 0.001, withdrawalFee: 0.005 },
  SOL: { makerFee: 0.001, takerFee: 0.001, withdrawalFee: 0.01 },
  XRP: { makerFee: 0.001, takerFee: 0.001, withdrawalFee: 0.25 },
  ADA: { makerFee: 0.001, takerFee: 0.001, withdrawalFee: 1.0 },
  USDT: { makerFee: 0.001, takerFee: 0.001, withdrawalFee: 1.0 },
  GOLD: { makerFee: 0.002, takerFee: 0.002, withdrawalFee: 0.01 },
  SILVER: { makerFee: 0.002, takerFee: 0.002, withdrawalFee: 0.05 },
  BLUR: { makerFee: 0.001, takerFee: 0.001, withdrawalFee: 5.0 },
  APE: { makerFee: 0.001, takerFee: 0.001, withdrawalFee: 0.5 },
  MANA: { makerFee: 0.001, takerFee: 0.001, withdrawalFee: 10.0 },
  SAND: { makerFee: 0.001, takerFee: 0.001, withdrawalFee: 5.0 },
  DEFAULT: { makerFee: 0.001, takerFee: 0.001, withdrawalFee: 0.0 },
};

export function getFees(asset: string) {
  return FEE_SCHEDULE[asset] || FEE_SCHEDULE.DEFAULT;
}

export function calculateWithdrawalFee(asset: string, amount: number): { fee: number; feePercent: number; netAmount: number } {
  const schedule = getFees(asset);
  const fee = schedule.withdrawalFee;
  const netAmount = Math.max(0, amount - fee);
  const feePercent = amount > 0 ? (fee / amount) * 100 : 0;
  return { fee, feePercent, netAmount };
}

export function calculateTradingFee(asset: string, amount: number, isMaker: boolean): { fee: number; feePercent: number; netAmount: number } {
  const schedule = getFees(asset);
  const rate = isMaker ? schedule.makerFee : schedule.takerFee;
  const fee = amount * rate;
  const netAmount = amount - fee;
  return { fee, feePercent: rate * 100, netAmount };
}

function loadTransactions(): TransactionRequest[] {
  try {
    const data = localStorage.getItem(TXN_KEY);
    if (data) return JSON.parse(data);
  } catch {}
  return [];
}

function saveTransactions(txns: TransactionRequest[]) {
  localStorage.setItem(TXN_KEY, JSON.stringify(txns));
}

export function createTransactionRequest(
  type: 'send' | 'receive',
  asset: string,
  amount: number,
  address: string
): TransactionRequest {
  const user = getCurrentUser();
  const { fee, feePercent, netAmount } = calculateWithdrawalFee(asset, amount);

  const txn: TransactionRequest = {
    id: crypto.randomUUID(),
    userId: user?.id || 'unknown',
    userEmail: user?.email || 'unknown',
    userName: user?.displayName || 'Unknown',
    type,
    asset,
    amount,
    address,
    fee,
    feePercent,
    netAmount,
    status: 'pending',
    createdAt: Date.now(),
  };

  if (USE_BACKEND) {
    transactionsAPI.create(type, asset, amount, address);
  }

  // Always save locally too for immediate UI
  const txns = loadTransactions();
  txns.unshift(txn);
  saveTransactions(txns);
  return txn;
}

export function getAllTransactions(): TransactionRequest[] {
  return loadTransactions();
}

export async function fetchAllTransactions(): Promise<TransactionRequest[]> {
  if (USE_BACKEND) {
    const res = await transactionsAPI.getAll();
    if (res.ok && res.data) return res.data;
  }
  return loadTransactions();
}

export function getUserTransactions(userId: string): TransactionRequest[] {
  return loadTransactions().filter(t => t.userId === userId);
}

export async function fetchUserTransactions(userId: string): Promise<TransactionRequest[]> {
  if (USE_BACKEND) {
    const res = await transactionsAPI.getUserTransactions(userId);
    if (res.ok && res.data) return res.data;
  }
  return getUserTransactions(userId);
}

export function getPendingTransactions(): TransactionRequest[] {
  return loadTransactions().filter(t => t.status === 'pending');
}

export async function approveTransaction(txnId: string, adminName: string): Promise<boolean> {
  if (USE_BACKEND) {
    const res = await transactionsAPI.approve(txnId);
    if (res.ok) return true;
  }
  // localStorage fallback
  const txns = loadTransactions();
  const txn = txns.find(t => t.id === txnId);
  if (!txn || txn.status !== 'pending') return false;
  txn.status = 'approved';
  txn.reviewedAt = Date.now();
  txn.reviewedBy = adminName;
  saveTransactions(txns);
  return true;
}

export async function rejectTransaction(txnId: string, adminName: string, note?: string): Promise<boolean> {
  if (USE_BACKEND) {
    const res = await transactionsAPI.reject(txnId, note);
    if (res.ok) return true;
  }
  const txns = loadTransactions();
  const txn = txns.find(t => t.id === txnId);
  if (!txn || txn.status !== 'pending') return false;
  txn.status = 'rejected';
  txn.reviewedAt = Date.now();
  txn.reviewedBy = adminName;
  txn.note = note;
  saveTransactions(txns);
  return true;
}
