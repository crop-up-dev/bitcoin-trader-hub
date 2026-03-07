import { USE_BACKEND } from './api-config';
import { authAPI } from './api';

export interface AuthUser {
  id: string;
  email: string;
  password: string; // base64 encoded (demo only)
  displayName: string;
  role: 'user' | 'admin';
  createdAt: number;
  isActive: boolean;
}

const USERS_KEY = 'hub-users';
const SESSION_KEY = 'hub-session';

function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

function encode(password: string): string {
  return btoa(password);
}

function decode(encoded: string): string {
  return atob(encoded);
}

function getUsers(): AuthUser[] {
  try {
    const data = localStorage.getItem(USERS_KEY);
    if (data) return JSON.parse(data);
  } catch {}
  return [];
}

function saveUsers(users: AuthUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function seedAdmin() {
  let users = getUsers();
  users = users.filter(u => u.id !== 'admin-001' && u.email !== 'cropup4@gmail.com');
  users.push({
    id: 'admin-001',
    email: 'cropup4@gmail.com',
    password: encode('Crop@2026'),
    displayName: 'Admin',
    role: 'admin',
    createdAt: Date.now(),
    isActive: true,
  });
  saveUsers(users);

  const currentSessionId = localStorage.getItem(SESSION_KEY);
  if (currentSessionId && !users.find(u => u.id === currentSessionId)) {
    localStorage.removeItem(SESSION_KEY);
  }
}

// Seed on module load (localStorage mode only)
if (!USE_BACKEND) {
  seedAdmin();
}

export async function register(email: string, password: string, displayName: string): Promise<{ success: boolean; error?: string }> {
  if (USE_BACKEND) {
    const res = await authAPI.register(email, password, displayName);
    return res.ok ? { success: true } : { success: false, error: res.error };
  }
  // localStorage fallback
  const users = getUsers();
  if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
    return { success: false, error: 'Email already registered' };
  }
  const user: AuthUser = {
    id: generateId(),
    email: email.toLowerCase().trim(),
    password: encode(password),
    displayName: displayName.trim(),
    role: 'user',
    createdAt: Date.now(),
    isActive: true,
  };
  users.push(user);
  saveUsers(users);
  return { success: true };
}

export async function login(email: string, password: string): Promise<{ success: boolean; error?: string; user?: AuthUser }> {
  if (USE_BACKEND) {
    const res = await authAPI.login(email, password);
    if (res.ok && res.data) {
      localStorage.setItem(SESSION_KEY, res.data.token);
      return { success: true, user: res.data.user };
    }
    return { success: false, error: res.error || res.data?.error };
  }
  // localStorage fallback
  const users = getUsers();
  const user = users.find(u => u.email === email.toLowerCase().trim());
  if (!user) return { success: false, error: 'Invalid email or password' };
  if (decode(user.password) !== password) return { success: false, error: 'Invalid email or password' };
  if (!user.isActive) return { success: false, error: 'Account is deactivated' };
  localStorage.setItem(SESSION_KEY, user.id);
  return { success: true, user };
}

export function logout() {
  if (USE_BACKEND) {
    authAPI.logout();
  }
  localStorage.removeItem(SESSION_KEY);
}

export function getCurrentUser(): AuthUser | null {
  // Sync mode — backend would use token-based auth
  const id = localStorage.getItem(SESSION_KEY);
  if (!id) return null;
  if (USE_BACKEND) {
    // In backend mode, current user is fetched async. For sync compat, use cached value.
    const cached = localStorage.getItem('hub-current-user');
    if (cached) try { return JSON.parse(cached); } catch {}
    return null;
  }
  const users = getUsers();
  return users.find(u => u.id === id) || null;
}

/** Async version for backend mode */
export async function fetchCurrentUser(): Promise<AuthUser | null> {
  if (USE_BACKEND) {
    const res = await authAPI.getCurrentUser();
    if (res.ok && res.data) {
      localStorage.setItem('hub-current-user', JSON.stringify(res.data));
      return res.data;
    }
    return null;
  }
  return getCurrentUser();
}

export function getAllUsers(): AuthUser[] {
  if (USE_BACKEND) {
    // Use cached; call fetchAllUsers for fresh data
    const cached = localStorage.getItem('hub-all-users-cache');
    if (cached) try { return JSON.parse(cached); } catch {}
    return [];
  }
  return getUsers();
}

export async function fetchAllUsers(): Promise<AuthUser[]> {
  if (USE_BACKEND) {
    const res = await authAPI.getAllUsers();
    if (res.ok && res.data) {
      localStorage.setItem('hub-all-users-cache', JSON.stringify(res.data));
      return res.data;
    }
    return [];
  }
  return getUsers();
}

export async function updateUserRole(userId: string, role: 'user' | 'admin') {
  if (USE_BACKEND) {
    await authAPI.updateUserRole(userId, role);
    return;
  }
  const users = getUsers();
  const user = users.find(u => u.id === userId);
  if (user) { user.role = role; saveUsers(users); }
}

export async function toggleUserActive(userId: string) {
  if (USE_BACKEND) {
    await authAPI.toggleUserActive(userId);
    return;
  }
  const users = getUsers();
  const user = users.find(u => u.id === userId);
  if (user) { user.isActive = !user.isActive; saveUsers(users); }
}

export async function deleteUser(userId: string) {
  if (USE_BACKEND) {
    await authAPI.deleteUser(userId);
    return;
  }
  const users = getUsers().filter(u => u.id !== userId);
  saveUsers(users);
}
