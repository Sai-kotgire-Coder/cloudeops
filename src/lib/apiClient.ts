// API client for backend communication
const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3001/api' : '/api');

/**
 * Custom error class for API responses that preserves metadata
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface User {
  id: string;
  email: string;
  isVerified?: boolean;
  isAdmin?: boolean;
  hasPassword?: boolean;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface RegisterResponse {
  message: string;
  email: string;
  requiresVerification: boolean;
}

export interface VerifyOTPResponse {
  message: string;
  token: string;
  user: User;
}

class ApiClient {
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    const token = localStorage.getItem('auth_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  // Auth endpoints
  async register(email: string, password: string): Promise<RegisterResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Registration failed');
    }

    return response.json();
  }

  async verifyOTP(email: string, otp: string): Promise<VerifyOTPResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'OTP verification failed');
    }

    return response.json();
  }

  async resendOTP(email: string): Promise<{ message: string; email: string }> {
    const response = await fetch(`${API_BASE_URL}/auth/resend-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to resend OTP');
    }

    return response.json();
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      
      // Handle special case where email is not verified
      if (response.status === 403 && error.requiresVerification) {
        const verificationError: any = new Error(error.error || error.message);
        verificationError.requiresVerification = true;
        verificationError.email = error.email;
        throw verificationError;
      }
      
      throw new Error(error.error || 'Login failed');
    }

    return response.json();
  }

  async googleLogin(credential: string): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Google sign-in failed');
    }

    return response.json();
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to send reset code');
    }

    return response.json();
  }

  async resetPassword(email: string, otp: string, newPassword: string): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp, newPassword }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to reset password');
    }

    return response.json();
  }

  async changePassword(currentPassword: string | undefined, newPassword: string): Promise<{ message: string; token: string }> {
    return this.request('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  async logoutAllDevices(): Promise<{ message: string; token: string }> {
    return this.request('/auth/logout-all', { method: 'POST' });
  }

  async deleteAccount(password?: string): Promise<{ message: string }> {
    return this.request('/auth/account', {
      method: 'DELETE',
      body: JSON.stringify({ password }),
    });
  }

  async exportData(): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/auth/export`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Export failed' }));
      throw new Error(error.error || 'Export failed');
    }

    return response.blob();
  }

  async getCurrentUser(): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to get user');
    }

    const data = await response.json();
    return data.user;
  }

  // Generic API request method
  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Request failed' }));

      if (response.status === 401) {
        // A previously-valid token was rejected -- almost always because its
        // tokenVersion was revoked elsewhere (password change/reset, or an
        // explicit "log out of all devices"). Every already-authenticated
        // call goes through this method, so this is the one place that can
        // catch it app-wide; a listener (see App.tsx) forces a clean logout
        // + redirect instead of letting the rest of the app fail silently
        // request by request.
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
      }

      throw new ApiError(
        errorData.error || 'Request failed',
        response.status,
        errorData // Pass all error data (includes limit, upgradeUrl, isPro, etc.)
      );
    }

    return response.json();
  }

  // Applications
  async getApplications(): Promise<any> {
    return this.request('/applications', { method: 'GET' });
  }

  async createApplication(data: any) {
    return this.request('/applications', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateApplication(id: string, data: any) {
    return this.request(`/applications/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteApplication(id: string) {
    return this.request(`/applications/${id}`, { method: 'DELETE' });
  }

  // Instances
  async getInstances(): Promise<any> {
    return this.request('/instances', { method: 'GET' });
  }

  async createInstance(data: any) {
    return this.request('/instances', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateInstance(id: string, data: any) {
    return this.request(`/instances/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteInstance(id: string) {
    return this.request(`/instances/${id}`, { method: 'DELETE' });
  }

  // Containers
  async getContainers(): Promise<any> {
    return this.request('/containers', { method: 'GET' });
  }

  async createContainer(data: any) {
    return this.request('/containers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateContainer(id: string, data: any) {
    return this.request(`/containers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteContainer(id: string) {
    return this.request(`/containers/${id}`, { method: 'DELETE' });
  }

  // Pipelines
  async getPipelines() {
    return this.request('/pipelines', { method: 'GET' });
  }

  async createPipeline(data: any) {
    return this.request('/pipelines', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePipeline(id: string, data: any) {
    return this.request(`/pipelines/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deletePipeline(id: string) {
    return this.request(`/pipelines/${id}`, { method: 'DELETE' });
  }

  // Docker Images
  async getImages(): Promise<any> {
    return this.request('/images', { method: 'GET' });
  }

  async createImage(data: any) {
    return this.request('/images', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteImage(id: string) {
    return this.request(`/images/${id}`, { method: 'DELETE' });
  }

  // Progress
  async getProgress(module?: string): Promise<any> {
    const endpoint = module ? `/progress/${module}` : '/progress';
    return this.request(endpoint, { method: 'GET' });
  }

  async updateProgress(module: string, data: any) {
    return this.request(`/progress/${module}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Scenarios
  async getScenarios(): Promise<any> {
    return this.request('/scenarios', { method: 'GET' });
  }

  async createScenario(data: any) {
    return this.request('/scenarios', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateScenario(id: string, data: any) {
    return this.request(`/scenarios/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteScenario(id: string) {
    return this.request(`/scenarios/${id}`, { method: 'DELETE' });
  }

  // Dashboard
  async getDashboard(): Promise<any> {
    return this.request('/dashboard', { method: 'GET' });
  }

  async updateDashboard(data: any) {
    return this.request('/dashboard', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Networking
  async getNetworking(): Promise<any> {
    return this.request('/networking', { method: 'GET' });
  }

  async updateNetworking(data: any) {
    return this.request('/networking', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Terraform
  async getTerraformWorkspace() {
    return this.request('/terraform', { method: 'GET' });
  }

  async updateTerraformWorkspace(data: any) {
    return this.request('/terraform', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Ansible
  async getAnsibleWorkspace() {
    return this.request('/ansible', { method: 'GET' });
  }

  async updateAnsibleWorkspace(data: any) {
    return this.request('/ansible', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Vault
  async getVaultWorkspace() {
    return this.request('/vault', { method: 'GET' });
  }

  async updateVaultWorkspace(data: any) {
    return this.request('/vault', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // GitOps
  async getGitOpsWorkspace() {
    return this.request('/gitops', { method: 'GET' });
  }

  async updateGitOpsWorkspace(data: any) {
    return this.request('/gitops', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Profile
  async getProfile() {
    return this.request('/profile', { method: 'GET' });
  }

  async updateProfile(data: any) {
    return this.request('/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Plan / subscription (read-only from this client's perspective --
  // upgrades happen through the payment flow, not this endpoint)
  async getPlan() {
    return this.request('/payment/plan', { method: 'GET' });
  }

  // Payment / plan
  async getPricing() {
    // Public endpoint, no auth header needed
    const response = await fetch(`${API_BASE_URL}/payment/pricing`);
    if (!response.ok) throw new Error('Failed to fetch pricing');
    return response.json();
  }

  async getUserPlan(): Promise<any> {
    return this.request('/payment/plan', { method: 'GET' });
  }

  async getUsage(): Promise<any> {
    return this.request('/payment/usage', { method: 'GET' });
  }

  async cancelSubscription(): Promise<any> {
    return this.request('/payment/cancel', { method: 'POST' });
  }

  // GitHub Sign-In
  async githubLogin(code: string, redirectUri: string): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/github`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, redirectUri }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'GitHub sign-in failed');
    }

    return response.json();
  }

  // Notifications
  async getNotifications(): Promise<any> {
    return this.request('/notifications', { method: 'GET' });
  }

  async getUnreadNotificationCount(): Promise<{ count: number }> {
    return this.request('/notifications/unread-count', { method: 'GET' });
  }

  async markNotificationRead(id: string): Promise<any> {
    return this.request(`/notifications/${id}/read`, { method: 'PATCH' });
  }

  async markAllNotificationsRead(): Promise<any> {
    return this.request('/notifications/read-all', { method: 'PATCH' });
  }

  // Leaderboard
  async getLeaderboard(): Promise<any> {
    return this.request('/leaderboard', { method: 'GET' });
  }

  // Module progress + certificates
  async getProgressSummary(): Promise<any> {
    return this.request('/progress/summary', { method: 'GET' });
  }

  async getCertificates(): Promise<any> {
    return this.request('/certificates', { method: 'GET' });
  }

  async getCertificate(code: string): Promise<any> {
    return this.request(`/certificates/${code}`, { method: 'GET' });
  }

  // Admin audit log
  async getAdminAuditLog(page = 1): Promise<any> {
    return this.request(`/admin/audit-log?page=${page}`, { method: 'GET' });
  }

  // Admin analytics
  async getAdminAnalytics(): Promise<any> {
    return this.request('/admin/analytics', { method: 'GET' });
  }

  async createPaymentOrder(amount: number, planDurationDays: number): Promise<any> {
    return this.request('/payment/create-order', {
      method: 'POST',
      body: JSON.stringify({ amount, planDurationDays }),
    });
  }

  async verifyPayment(razorpayOrderId: string, razorpayPaymentId: string, razorpaySignature: string): Promise<any> {
    return this.request('/payment/verify', {
      method: 'POST',
      body: JSON.stringify({ razorpayOrderId, razorpayPaymentId, razorpaySignature }),
    });
  }

  // Admin
  async getAdminStats(): Promise<any> {
    return this.request('/admin/stats', { method: 'GET' });
  }

  async getAdminUsers(params: { search?: string; plan?: string; module?: string; activity?: string; page?: number; limit?: number } = {}): Promise<any> {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') query.set(key, String(value));
    });
    const qs = query.toString();
    return this.request(`/admin/users${qs ? `?${qs}` : ''}`, { method: 'GET' });
  }

  async getAdminUserDetail(id: string): Promise<any> {
    return this.request(`/admin/users/${id}`, { method: 'GET' });
  }

  async updateUserPlan(id: string, isPro: boolean): Promise<any> {
    return this.request(`/admin/users/${id}/plan`, {
      method: 'PATCH',
      body: JSON.stringify({ isPro }),
    });
  }

  async sendBroadcastEmail(subject: string, message: string, target: 'all' | 'inactive' | 'pro' | 'free'): Promise<any> {
    return this.request('/admin/broadcast-email', {
      method: 'POST',
      body: JSON.stringify({ subject, message, target }),
    });
  }

  // Alerts
  async getAlerts(params?: { status?: string; severity?: string }): Promise<any> {
    const queryParams = new URLSearchParams(params as any).toString();
    const endpoint = queryParams ? `/alerts?${queryParams}` : '/alerts';
    return this.request(endpoint, { method: 'GET' });
  }

  async createAlert(data: any) {
    return this.request('/alerts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAlert(id: string, data: any) {
    return this.request(`/alerts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteAlert(id: string) {
    return this.request(`/alerts/${id}`, { method: 'DELETE' });
  }

  // Tickets
  async getTickets(): Promise<any> {
    return this.request('/tickets', { method: 'GET' });
  }

  async createTicket(data: any) {
    return this.request('/tickets', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTicket(id: string, data: any) {
    return this.request(`/tickets/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteTicket(id: string) {
    return this.request(`/tickets/${id}`, { method: 'DELETE' });
  }

  // Game State
  async getGameState(): Promise<any> {
    return this.request('/game-state', { method: 'GET' });
  }

  async saveGameState(data: any) {
    return this.request('/game-state', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateGameState(data: any) {
    return this.request('/game-state', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }
}

export const apiClient = new ApiClient();
