/**
 * API Service Layer
 * 
 * All backend API calls are defined here. When USE_BACKEND is false,
 * the individual modules (auth.ts, trading.ts, etc.) fall back to localStorage.
 * When USE_BACKEND is true, these functions call the Node.js backend.
 */

import { apiFetch } from './api-config';
import type { AuthUser } from './auth';
import type { Portfolio, Trade } from './trading';
import type { UserProfile } from './profile';
import type { TransactionRequest } from './transactions';

// ─── Auth API ────────────────────────────────────────────────────────────────

export const authAPI = {
  register: (email: string, password: string, displayName: string) =>
    apiFetch<{ success: boolean; error?: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, displayName }),
    }),

  login: (email: string, password: string) =>
    apiFetch<{ success: boolean; token: string; user: AuthUser; error?: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  logout: () =>
    apiFetch<void>('/auth/logout', { method: 'POST' }),

  getCurrentUser: () =>
    apiFetch<AuthUser>('/auth/me'),

  getAllUsers: () =>
    apiFetch<AuthUser[]>('/auth/users'),

  updateUserRole: (userId: string, role: 'user' | 'admin') =>
    apiFetch<void>(`/auth/users/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    }),

  toggleUserActive: (userId: string) =>
    apiFetch<void>(`/auth/users/${userId}/toggle-active`, { method: 'PUT' }),

  deleteUser: (userId: string) =>
    apiFetch<void>(`/auth/users/${userId}`, { method: 'DELETE' }),
};

// ─── Portfolio / Trading API ─────────────────────────────────────────────────

export const tradingAPI = {
  loadPortfolio: () =>
    apiFetch<Portfolio>('/portfolio'),

  savePortfolio: (portfolio: Portfolio) =>
    apiFetch<void>('/portfolio', {
      method: 'PUT',
      body: JSON.stringify(portfolio),
    }),

  executeTrade: (side: 'buy' | 'sell', type: 'market' | 'limit', price: number, amount: number) =>
    apiFetch<Portfolio>('/portfolio/trade', {
      method: 'POST',
      body: JSON.stringify({ side, type, price, amount }),
    }),
};

// ─── Profile API ─────────────────────────────────────────────────────────────

export const profileAPI = {
  load: () =>
    apiFetch<UserProfile>('/profile'),

  save: (profile: UserProfile) =>
    apiFetch<void>('/profile', {
      method: 'PUT',
      body: JSON.stringify(profile),
    }),
};

// ─── Transactions API ────────────────────────────────────────────────────────

export const transactionsAPI = {
  create: (type: 'send' | 'receive', asset: string, amount: number, address: string) =>
    apiFetch<TransactionRequest>('/transactions', {
      method: 'POST',
      body: JSON.stringify({ type, asset, amount, address }),
    }),

  getAll: () =>
    apiFetch<TransactionRequest[]>('/transactions'),

  getUserTransactions: (userId: string) =>
    apiFetch<TransactionRequest[]>(`/transactions/user/${userId}`),

  getPending: () =>
    apiFetch<TransactionRequest[]>('/transactions/pending'),

  approve: (txnId: string) =>
    apiFetch<boolean>(`/transactions/${txnId}/approve`, { method: 'PUT' }),

  reject: (txnId: string, note?: string) =>
    apiFetch<boolean>(`/transactions/${txnId}/reject`, {
      method: 'PUT',
      body: JSON.stringify({ note }),
    }),
};

// ─── Admin Wallet API ────────────────────────────────────────────────────────

export interface AdminWalletConfig {
  userId: string;
  asset: string;
  receiverAddress: string;
  qrData: string;
  balance: number;
  updatedAt: number;
  updatedBy: string;
}

export const adminWalletAPI = {
  getAll: () =>
    apiFetch<AdminWalletConfig[]>('/admin/wallets'),

  getOne: (userId: string, asset: string) =>
    apiFetch<AdminWalletConfig>(`/admin/wallets/${userId}/${asset}`),

  update: (config: AdminWalletConfig) =>
    apiFetch<void>('/admin/wallets', {
      method: 'PUT',
      body: JSON.stringify(config),
    }),
};
