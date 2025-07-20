// Kimai API Client
// Handles all API operations to Kimai server instances

import type {
    KimaiUser,
    KimaiCustomer,
    KimaiProject,
    KimaiActivity,
    KimaiTimeSheet,
    KimaiTask,
    KimaiVersion,
    KimaiConfig,
    KimaiAuthConfig,
    KimaiApiResponse,
    KimaiPaginationResponse,
    KimaiConnectionState
} from '$lib/types/kimai.js';

export class KimaiApiClient {
    private baseUrl: string;
    private authConfig: KimaiAuthConfig;
    private connectionState: KimaiConnectionState;

    constructor(authConfig: KimaiAuthConfig) {
        this.authConfig = authConfig;
        this.baseUrl = authConfig.baseUrl.replace(/\/$/, ''); // Remove trailing slash
        this.connectionState = {
            isConnected: false,
            isConnecting: false
        };
    }

    // Connection Management
    async connect(): Promise<KimaiConnectionState> {
        this.connectionState.isConnecting = true;

        try {
            // Check version and compatibility
            const version = await this.getVersion();
            const config = await this.getConfig();

            // Test authentication
            const user = await this.getCurrentUser();

            this.connectionState = {
                isConnected: true,
                isConnecting: false,
                lastConnected: new Date().toISOString(),
                version,
                config
            };

            return this.connectionState;
        } catch (error) {
            this.connectionState = {
                isConnected: false,
                isConnecting: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
            throw error;
        }
    }

    getConnectionState(): KimaiConnectionState {
        return { ...this.connectionState };
    }

    // Version and Configuration
    async getVersion(): Promise<KimaiVersion> {
        return this.request<KimaiVersion>('/api/version');
    }

    async getConfig(): Promise<KimaiConfig> {
        return this.request<KimaiConfig>('/api/config');
    }

    // Authentication
    async getCurrentUser(): Promise<KimaiUser> {
        return this.request<KimaiUser>('/api/user/me');
    }

    // Customer Management
    async getCustomers(): Promise<KimaiCustomer[]> {
        return this.request<KimaiCustomer[]>('/api/customers');
    }

    async getCustomer(id: number): Promise<KimaiCustomer> {
        return this.request<KimaiCustomer>(`/api/customers/${id}`);
    }

    async createCustomer(customer: Partial<KimaiCustomer>): Promise<KimaiCustomer> {
        return this.request<KimaiCustomer>('/api/customers', {
            method: 'POST',
            body: JSON.stringify(customer)
        });
    }

    async updateCustomer(id: number, customer: Partial<KimaiCustomer>): Promise<KimaiCustomer> {
        return this.request<KimaiCustomer>(`/api/customers/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(customer)
        });
    }

    async deleteCustomer(id: number): Promise<void> {
        return this.request<void>(`/api/customers/${id}`, {
            method: 'DELETE'
        });
    }

    // Project Management
    async getProjects(customerId?: number): Promise<KimaiProject[]> {
        const params = customerId ? `?customer=${customerId}` : '';
        return this.request<KimaiProject[]>(`/api/projects${params}`);
    }

    async getProject(id: number): Promise<KimaiProject> {
        return this.request<KimaiProject>(`/api/projects/${id}`);
    }

    async createProject(project: Partial<KimaiProject>): Promise<KimaiProject> {
        return this.request<KimaiProject>('/api/projects', {
            method: 'POST',
            body: JSON.stringify(project)
        });
    }

    async updateProject(id: number, project: Partial<KimaiProject>): Promise<KimaiProject> {
        return this.request<KimaiProject>(`/api/projects/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(project)
        });
    }

    async deleteProject(id: number): Promise<void> {
        return this.request<void>(`/api/projects/${id}`, {
            method: 'DELETE'
        });
    }

    // Activity Management
    async getActivities(projectId?: number): Promise<KimaiActivity[]> {
        const params = projectId ? `?project=${projectId}` : '';
        return this.request<KimaiActivity[]>(`/api/activities${params}`);
    }

    async getActivity(id: number): Promise<KimaiActivity> {
        return this.request<KimaiActivity>(`/api/activities/${id}`);
    }

    async createActivity(activity: Partial<KimaiActivity>): Promise<KimaiActivity> {
        return this.request<KimaiActivity>('/api/activities', {
            method: 'POST',
            body: JSON.stringify(activity)
        });
    }

    async updateActivity(id: number, activity: Partial<KimaiActivity>): Promise<KimaiActivity> {
        return this.request<KimaiActivity>(`/api/activities/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(activity)
        });
    }

    async deleteActivity(id: number): Promise<void> {
        return this.request<void>(`/api/activities/${id}`, {
            method: 'DELETE'
        });
    }

    // Time Sheet Management
    async getTimeSheets(params?: {
        user?: number;
        customer?: number;
        project?: number;
        activity?: number;
        begin?: string;
        end?: string;
        page?: number;
        size?: number;
    }): Promise<KimaiPaginationResponse<KimaiTimeSheet>> {
        const queryParams = new URLSearchParams();
        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined) {
                    queryParams.append(key, value.toString());
                }
            });
        }

        const queryString = queryParams.toString();
        const url = `/api/timesheets${queryString ? `?${queryString}` : ''}`;
        return this.request<KimaiPaginationResponse<KimaiTimeSheet>>(url);
    }

    async getTimeSheet(id: number): Promise<KimaiTimeSheet> {
        return this.request<KimaiTimeSheet>(`/api/timesheets/${id}`);
    }

    async createTimeSheet(timeSheet: Partial<KimaiTimeSheet>): Promise<KimaiTimeSheet> {
        return this.request<KimaiTimeSheet>('/api/timesheets', {
            method: 'POST',
            body: JSON.stringify(timeSheet)
        });
    }

    async updateTimeSheet(id: number, timeSheet: Partial<KimaiTimeSheet>): Promise<KimaiTimeSheet> {
        return this.request<KimaiTimeSheet>(`/api/timesheets/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(timeSheet)
        });
    }

    async deleteTimeSheet(id: number): Promise<void> {
        return this.request<void>(`/api/timesheets/${id}`, {
            method: 'DELETE'
        });
    }

    // Task Management
    async getTasks(params?: {
        user?: number;
        customer?: number;
        project?: number;
        activity?: number;
        status?: 'open' | 'closed';
        page?: number;
        size?: number;
    }): Promise<KimaiPaginationResponse<KimaiTask>> {
        const queryParams = new URLSearchParams();
        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined) {
                    queryParams.append(key, value.toString());
                }
            });
        }

        const queryString = queryParams.toString();
        const url = `/api/tasks${queryString ? `?${queryString}` : ''}`;
        return this.request<KimaiPaginationResponse<KimaiTask>>(url);
    }

    async getTask(id: number): Promise<KimaiTask> {
        return this.request<KimaiTask>(`/api/tasks/${id}`);
    }

    async createTask(task: Partial<KimaiTask>): Promise<KimaiTask> {
        return this.request<KimaiTask>('/api/tasks', {
            method: 'POST',
            body: JSON.stringify(task)
        });
    }

    async updateTask(id: number, task: Partial<KimaiTask>): Promise<KimaiTask> {
        return this.request<KimaiTask>(`/api/tasks/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(task)
        });
    }

    async deleteTask(id: number): Promise<void> {
        return this.request<void>(`/api/tasks/${id}`, {
            method: 'DELETE'
        });
    }

    // Core HTTP Request Method
    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
        const url = `${this.baseUrl}${endpoint}`;

        // Prepare headers
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };

        // Add custom headers
        if (options.headers) {
            Object.entries(options.headers).forEach(([key, value]) => {
                if (typeof value === 'string') {
                    headers[key] = value;
                }
            });
        }

        // Add authentication
        if (this.authConfig.type === 'api_token' && this.authConfig.apiToken) {
            headers['X-AUTH-TOKEN'] = this.authConfig.apiToken;
        } else if (this.authConfig.type === 'legacy' && this.authConfig.username && this.authConfig.password) {
            const credentials = btoa(`${this.authConfig.username}:${this.authConfig.password}`);
            headers['Authorization'] = `Basic ${credentials}`;
        }

        // Prepare request options
        const requestOptions: RequestInit = {
            method: options.method || 'GET',
            headers,
            ...options
        };

        try {
            const response = await fetch(url, requestOptions);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new KimaiApiError(
                    response.status,
                    errorData.message || `HTTP ${response.status}: ${response.statusText}`,
                    errorData
                );
            }

            // Handle empty responses
            if (response.status === 204 || response.headers.get('content-length') === '0') {
                return {} as T;
            }

            const data = await response.json();
            return data;
        } catch (error) {
            if (error instanceof KimaiApiError) {
                throw error;
            }

            // Network or other errors
            throw new KimaiApiError(
                0,
                error instanceof Error ? error.message : 'Network error',
                { originalError: error }
            );
        }
    }
}

// Custom Error Class
export class KimaiApiError extends Error implements KimaiApiError {
    constructor(
        public code: number,
        message: string,
        public details?: any
    ) {
        super(message);
        this.name = 'KimaiApiError';
    }
}

// Utility Functions
export function createKimaiClient(authConfig: KimaiAuthConfig): KimaiApiClient {
    return new KimaiApiClient(authConfig);
}

export function validateAuthConfig(authConfig: KimaiAuthConfig): boolean {
    if (!authConfig.baseUrl) return false;

    if (authConfig.type === 'api_token') {
        return !!authConfig.apiToken;
    } else if (authConfig.type === 'legacy') {
        return !!(authConfig.username && authConfig.password);
    }

    return false;
} 