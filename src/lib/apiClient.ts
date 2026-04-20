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
      throw new ApiError(
        errorData.error || 'Request failed',
        response.status,
        errorData // Pass all error data (includes limit, upgradeUrl, isPro, etc.)
      );
    }

    return response.json();
  }

  // Applications
  async getApplications() {
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
  async getInstances() {
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
  async getContainers() {
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
  async getImages() {
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
  async getProgress(module?: string) {
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
  async getScenarios() {
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
  async getDashboard() {
    return this.request('/dashboard', { method: 'GET' });
  }

  async updateDashboard(data: any) {
    return this.request('/dashboard', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Networking
  async getNetworking() {
    return this.request('/networking', { method: 'GET' });
  }

  async updateNetworking(data: any) {
    return this.request('/networking', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Alerts
  async getAlerts(params?: { status?: string; severity?: string }) {
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
  async getTickets() {
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
  async getGameState() {
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
