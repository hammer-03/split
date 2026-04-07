const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface ApiError {
  error: string;
  details?: unknown;
}

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('token', token);
      } else {
        localStorage.removeItem('token');
      }
    }
  }

  getToken(): string | null {
    if (this.token) return this.token;
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('token');
    }
    return this.token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getToken();
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const isJson = response.headers.get('content-type')?.includes('application/json');
    let data;

    if (isJson) {
      data = await response.json();
    } else {
      const text = await response.text();
      if (!response.ok) {
        console.error(`Received non-JSON error response from ${API_URL}${endpoint}:`, text.substring(0, 200));
        throw new Error(`API Endpoint returning invalid response (status ${response.status}). Is the backend running on the correct port?`);
      }
      data = text as unknown as T;
    }

    if (!response.ok) {
      throw new Error((data as ApiError)?.error || 'Request failed');
    }

    return data as T;
  }

  // Auth
  async register(email: string, password: string, name: string) {
    return this.request<{ user: User; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
  }

  async login(email: string, password: string) {
    return this.request<{ user: User; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async getMe() {
    return this.request<{ user: User }>('/auth/me');
  }

  async updateProfile(data: { name?: string; avatar?: string; currency?: string }) {
    return this.request<{ user: User }>('/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Groups
  async getGroups() {
    return this.request<{ groups: Group[] }>('/groups');
  }

  async createGroup(data: { name: string; description?: string; category?: string; memberEmails?: string[] }) {
    return this.request<{ group: Group }>('/groups', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getGroup(id: string) {
    return this.request<{ group: Group }>(`/groups/${id}`);
  }

  async updateGroup(id: string, data: Partial<Group>) {
    return this.request<{ group: Group }>(`/groups/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteGroup(id: string) {
    return this.request<{ message: string }>(`/groups/${id}`, {
      method: 'DELETE',
    });
  }

  async addGroupMember(groupId: string, email: string) {
    return this.request<{ group: Group }>(`/groups/${groupId}/members`, {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async removeGroupMember(groupId: string, userId: string) {
    return this.request<{ group: Group }>(`/groups/${groupId}/members/${userId}`, {
      method: 'DELETE',
    });
  }

  // Expenses
  async getExpenses(params?: { groupId?: string; category?: string; startDate?: string; endDate?: string; limit?: number; offset?: number }) {
    const searchParams = new URLSearchParams();
    if (params?.groupId) searchParams.set('groupId', params.groupId);
    if (params?.category) searchParams.set('category', params.category);
    if (params?.startDate) searchParams.set('startDate', params.startDate);
    if (params?.endDate) searchParams.set('endDate', params.endDate);
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.offset) searchParams.set('offset', params.offset.toString());
    
    const query = searchParams.toString();
    return this.request<{ expenses: Expense[]; total: number }>(`/expenses${query ? `?${query}` : ''}`);
  }

  async createExpense(data: CreateExpenseData) {
    return this.request<{ expense: Expense }>('/expenses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getExpense(id: string) {
    return this.request<{ expense: Expense }>(`/expenses/${id}`);
  }

  async updateExpense(id: string, data: Partial<CreateExpenseData>) {
    return this.request<{ expense: Expense }>(`/expenses/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteExpense(id: string) {
    return this.request<{ message: string }>(`/expenses/${id}`, {
      method: 'DELETE',
    });
  }

  // AI
  async parseAIExpense(text: string, groupId?: string) {
    return this.request<{ result: AIExpenseResult }>('/ai/parse-expense', {
      method: 'POST',
      body: JSON.stringify({ text, groupId }),
    });
  }

  // Settlements
  async getSettlements(params?: { groupId?: string; limit?: number; offset?: number }) {
    const searchParams = new URLSearchParams();
    if (params?.groupId) searchParams.set('groupId', params.groupId);
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.offset) searchParams.set('offset', params.offset.toString());
    
    const query = searchParams.toString();
    return this.request<{ settlements: Settlement[]; total: number }>(`/settlements${query ? `?${query}` : ''}`);
  }

  async createSettlement(data: { groupId?: string; toUser: string; amount: number; currency?: string; note?: string }) {
    return this.request<{ settlement: Settlement }>('/settlements', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Balances
  async getBalances() {
    return this.request<BalanceSummary>('/balances');
  }

  async getGroupBalances(groupId: string) {
    return this.request<GroupBalanceSummary>(`/balances/group/${groupId}`);
  }

  async getUserBalance(userId: string) {
    return this.request<UserBalance>(`/balances/user/${userId}`);
  }

  async simplifyDebts(groupId: string) {
    return this.request<{ suggestedTransactions: SuggestedTransaction[] }>(`/balances/simplify/${groupId}`);
  }

  // Analytics
  async getAnalytics() {
    return this.request<AnalyticsData>('/analytics/spending');
  }

  // Activity
  async getActivity(params?: { limit?: number; offset?: number }) {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.offset) searchParams.set('offset', params.offset.toString());
    
    const query = searchParams.toString();
    return this.request<{ activities: Activity[]; total: number }>(`/activity${query ? `?${query}` : ''}`);
  }

  async getGroupActivity(groupId: string, params?: { limit?: number; offset?: number }) {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.offset) searchParams.set('offset', params.offset.toString());
    
    const query = searchParams.toString();
    return this.request<{ activities: Activity[]; total: number }>(`/activity/group/${groupId}${query ? `?${query}` : ''}`);
  }

  // Users
  async searchUsers(query: string) {
    return this.request<{ users: User[] }>(`/users/search?q=${encodeURIComponent(query)}`);
  }

  async getUser(id: string) {
    return this.request<{ user: User }>(`/users/${id}`);
  }

  async getFriends() {
    return this.request<{ friends: User[] }>('/users/me/friends');
  }

  async addFriend(userId: string) {
    return this.request<{ message: string }>(`/users/friends/${userId}`, {
      method: 'POST',
    });
  }

  async removeFriend(userId: string) {
    return this.request<{ message: string }>(`/users/friends/${userId}`, {
      method: 'DELETE',
    });
  }
}

export const api = new ApiClient();

// Types
export interface User {
  _id: string;
  email: string;
  name: string;
  avatar?: string;
  currency: string;
  friends?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface GroupMember {
  userId: User | string;
  role: 'admin' | 'member';
  joinedAt: string;
}

export interface Group {
  _id: string;
  name: string;
  description?: string;
  image?: string;
  category: 'trip' | 'home' | 'couple' | 'friends' | 'work' | 'other';
  members: GroupMember[];
  simplifyDebts: boolean;
  defaultSplitType: 'equal' | 'exact' | 'percentage' | 'shares';
  createdBy: User | string;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseSplit {
  userId: User | string;
  amount: number;
  percentage?: number;
  shares?: number;
  paid: boolean;
}

export interface Expense {
  _id: string;
  groupId?: Group | string;
  description: string;
  amount: number;
  currency: string;
  category: string;
  paidBy: User | string;
  splitType: 'equal' | 'exact' | 'percentage' | 'shares';
  splits: ExpenseSplit[];
  receipt?: string;
  notes?: string;
  date: string;
  createdBy: User | string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateExpenseData {
  groupId?: string;
  description: string;
  amount: number;
  currency?: string;
  category?: string;
  paidBy: string;
  splitType: 'equal' | 'exact' | 'percentage' | 'shares';
  splits: { userId: string; amount: number; percentage?: number; shares?: number }[];
  receipt?: string;
  notes?: string;
  date?: string;
}

export interface Settlement {
  _id: string;
  groupId?: Group | string;
  fromUser: User | string;
  toUser: User | string;
  amount: number;
  currency: string;
  note?: string;
  settledAt: string;
  createdAt: string;
}

export interface BalanceDetail {
  userId: string;
  name: string;
  email: string;
  avatar?: string;
  balance: number;
}

export interface BalanceSummary {
  totalOwed: number;
  totalOwing: number;
  netBalance: number;
  balances: BalanceDetail[];
}

export interface GroupBalanceSummary extends BalanceSummary {
  group: {
    _id: string;
    name: string;
  };
}

export interface UserBalance {
  user: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  balance: number;
  direction: 'they_owe_you' | 'you_owe_them' | 'settled';
}

export interface Activity {
  _id: string;
  type: string;
  groupId?: Group | string;
  userId: User | string;
  targetUserId?: User | string;
  expenseId?: Expense | string;
  settlementId?: Settlement | string;
  data: Record<string, unknown>;
  createdAt: string;
}

export interface AIExpenseResult {
  description: string;
  amount: number;
  paidBy: string;
  paidByUserId?: string;
  category: string;
  date: string;
}

export interface SuggestedTransaction {
  from: {
    _id: string;
    name: string;
    avatar?: string;
  };
  to: {
    _id: string;
    name: string;
    avatar?: string;
  };
  amount: number;
}

export interface AnalyticsData {
  categoryData: { category: string; total: number }[];
  trendData: { month: string; year: number; total: number }[];
  insights: { type: 'increase' | 'decrease' | 'top_category'; text: string; value: number }[];
  currentMonthTotal: number;
}

