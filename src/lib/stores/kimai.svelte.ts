// Kimai Store
// Manages Kimai API connection state and data caching

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
    KimaiConnectionState,
    KimaiCache
} from '$lib/types/kimai.js';
import { KimaiApiClient, createKimaiClient, validateAuthConfig } from '$lib/utils/kimai-api.js';
import settingsStore from './settings.svelte.js';

// Kimai state
let connectionState = $state<KimaiConnectionState>({
    isConnected: false,
    isConnecting: false
});

let currentUser = $state<KimaiUser | null>(null);
let apiClient = $state<KimaiApiClient | null>(null);

// Cache state
let cache = $state<KimaiCache>({
    customers: [],
    projects: [],
    activities: [],
    timeSheets: [],
    tasks: [],
    lastUpdated: {},
    version: '1.0.0'
});

// Loading states
let isLoading = $state({
    customers: false,
    projects: false,
    activities: false,
    timeSheets: false,
    tasks: false
});

// Error state
let error = $state<string | null>(null);

// Kimai store functions
export const kimaiStore = {
    // Connection Management
    get connectionState() {
        return connectionState;
    },

    get currentUser() {
        return currentUser;
    },

    get isConnected() {
        return connectionState.isConnected;
    },

    get isConnecting() {
        return connectionState.isConnecting;
    },

    async connect(authConfig?: KimaiAuthConfig): Promise<KimaiConnectionState> {
        const config = authConfig || settingsStore.currentProfile?.auth;

        if (!config) {
            throw new Error('No authentication configuration provided');
        }

        if (!validateAuthConfig(config)) {
            throw new Error('Invalid authentication configuration');
        }

        try {
            error = null;
            apiClient = createKimaiClient(config);
            connectionState = await apiClient.connect();
            currentUser = await apiClient.getCurrentUser();

            // Load initial data
            await this.loadCustomers();
            await this.loadProjects();
            await this.loadActivities();

            return connectionState;
        } catch (err) {
            error = err instanceof Error ? err.message : 'Connection failed';
            connectionState = {
                isConnected: false,
                isConnecting: false,
                error
            };
            throw err;
        }
    },

    disconnect() {
        connectionState = {
            isConnected: false,
            isConnecting: false
        };
        currentUser = null;
        apiClient = null;
        error = null;
        // Clear cache
        cache = {
            customers: [],
            projects: [],
            activities: [],
            timeSheets: [],
            tasks: [],
            lastUpdated: {},
            version: '1.0.0'
        };
    },

    // Customer Management
    get customers() {
        return cache.customers;
    },

    async loadCustomers(): Promise<KimaiCustomer[]> {
        if (!apiClient) throw new Error('Not connected to Kimai');

        try {
            isLoading.customers = true;
            const customers = await apiClient.getCustomers();
            cache.customers = customers;
            cache.lastUpdated.customers = new Date().toISOString();
            return customers;
        } catch (err) {
            error = err instanceof Error ? err.message : 'Failed to load customers';
            throw err;
        } finally {
            isLoading.customers = false;
        }
    },

    async createCustomer(customer: Partial<KimaiCustomer>): Promise<KimaiCustomer> {
        if (!apiClient) throw new Error('Not connected to Kimai');

        try {
            const newCustomer = await apiClient.createCustomer(customer);
            cache.customers = [...cache.customers, newCustomer];
            return newCustomer;
        } catch (err) {
            error = err instanceof Error ? err.message : 'Failed to create customer';
            throw err;
        }
    },

    async updateCustomer(id: number, updates: Partial<KimaiCustomer>): Promise<KimaiCustomer> {
        if (!apiClient) throw new Error('Not connected to Kimai');

        try {
            const updatedCustomer = await apiClient.updateCustomer(id, updates);
            cache.customers = cache.customers.map(customer =>
                customer.id === id ? updatedCustomer : customer
            );
            return updatedCustomer;
        } catch (err) {
            error = err instanceof Error ? err.message : 'Failed to update customer';
            throw err;
        }
    },

    // Project Management
    get projects() {
        return cache.projects;
    },

    getProjectsByCustomer(customerId: number): KimaiProject[] {
        return cache.projects.filter(project => project.customer === customerId);
    },

    async loadProjects(customerId?: number): Promise<KimaiProject[]> {
        if (!apiClient) throw new Error('Not connected to Kimai');

        try {
            isLoading.projects = true;
            const projects = await apiClient.getProjects(customerId);

            if (customerId) {
                // Filter existing projects for this customer and add new ones
                const existingProjects = cache.projects.filter(p => p.customer !== customerId);
                cache.projects = [...existingProjects, ...projects];
            } else {
                cache.projects = projects;
            }

            cache.lastUpdated.projects = new Date().toISOString();
            return projects;
        } catch (err) {
            error = err instanceof Error ? err.message : 'Failed to load projects';
            throw err;
        } finally {
            isLoading.projects = false;
        }
    },

    async createProject(project: Partial<KimaiProject>): Promise<KimaiProject> {
        if (!apiClient) throw new Error('Not connected to Kimai');

        try {
            const newProject = await apiClient.createProject(project);
            cache.projects = [...cache.projects, newProject];
            return newProject;
        } catch (err) {
            error = err instanceof Error ? err.message : 'Failed to create project';
            throw err;
        }
    },

    async updateProject(id: number, updates: Partial<KimaiProject>): Promise<KimaiProject> {
        if (!apiClient) throw new Error('Not connected to Kimai');

        try {
            const updatedProject = await apiClient.updateProject(id, updates);
            cache.projects = cache.projects.map(project =>
                project.id === id ? updatedProject : project
            );
            return updatedProject;
        } catch (err) {
            error = err instanceof Error ? err.message : 'Failed to update project';
            throw err;
        }
    },

    // Activity Management
    get activities() {
        return cache.activities;
    },

    getActivitiesByProject(projectId: number): KimaiActivity[] {
        return cache.activities.filter(activity => activity.project === projectId);
    },

    async loadActivities(projectId?: number): Promise<KimaiActivity[]> {
        if (!apiClient) throw new Error('Not connected to Kimai');

        try {
            isLoading.activities = true;
            const activities = await apiClient.getActivities(projectId);

            if (projectId) {
                // Filter existing activities for this project and add new ones
                const existingActivities = cache.activities.filter(a => a.project !== projectId);
                cache.activities = [...existingActivities, ...activities];
            } else {
                cache.activities = activities;
            }

            cache.lastUpdated.activities = new Date().toISOString();
            return activities;
        } catch (err) {
            error = err instanceof Error ? err.message : 'Failed to load activities';
            throw err;
        } finally {
            isLoading.activities = false;
        }
    },

    async createActivity(activity: Partial<KimaiActivity>): Promise<KimaiActivity> {
        if (!apiClient) throw new Error('Not connected to Kimai');

        try {
            const newActivity = await apiClient.createActivity(activity);
            cache.activities = [...cache.activities, newActivity];
            return newActivity;
        } catch (err) {
            error = err instanceof Error ? err.message : 'Failed to create activity';
            throw err;
        }
    },

    async updateActivity(id: number, updates: Partial<KimaiActivity>): Promise<KimaiActivity> {
        if (!apiClient) throw new Error('Not connected to Kimai');

        try {
            const updatedActivity = await apiClient.updateActivity(id, updates);
            cache.activities = cache.activities.map(activity =>
                activity.id === id ? updatedActivity : activity
            );
            return updatedActivity;
        } catch (err) {
            error = err instanceof Error ? err.message : 'Failed to update activity';
            throw err;
        }
    },

    // Time Sheet Management
    get timeSheets() {
        return cache.timeSheets;
    },

    async loadTimeSheets(params?: {
        user?: number;
        customer?: number;
        project?: number;
        activity?: number;
        begin?: string;
        end?: string;
        page?: number;
        size?: number;
    }): Promise<KimaiTimeSheet[]> {
        if (!apiClient) throw new Error('Not connected to Kimai');

        try {
            isLoading.timeSheets = true;
            const response = await apiClient.getTimeSheets(params);
            cache.timeSheets = response.data;
            cache.lastUpdated.timeSheets = new Date().toISOString();
            return response.data;
        } catch (err) {
            error = err instanceof Error ? err.message : 'Failed to load time sheets';
            throw err;
        } finally {
            isLoading.timeSheets = false;
        }
    },

    async createTimeSheet(timeSheet: Partial<KimaiTimeSheet>): Promise<KimaiTimeSheet> {
        if (!apiClient) throw new Error('Not connected to Kimai');

        try {
            const newTimeSheet = await apiClient.createTimeSheet(timeSheet);
            cache.timeSheets = [newTimeSheet, ...cache.timeSheets];
            return newTimeSheet;
        } catch (err) {
            error = err instanceof Error ? err.message : 'Failed to create time sheet';
            throw err;
        }
    },

    async updateTimeSheet(id: number, updates: Partial<KimaiTimeSheet>): Promise<KimaiTimeSheet> {
        if (!apiClient) throw new Error('Not connected to Kimai');

        try {
            const updatedTimeSheet = await apiClient.updateTimeSheet(id, updates);
            cache.timeSheets = cache.timeSheets.map(timeSheet =>
                timeSheet.id === id ? updatedTimeSheet : timeSheet
            );
            return updatedTimeSheet;
        } catch (err) {
            error = err instanceof Error ? err.message : 'Failed to update time sheet';
            throw err;
        }
    },

    async deleteTimeSheet(id: number): Promise<void> {
        if (!apiClient) throw new Error('Not connected to Kimai');

        try {
            await apiClient.deleteTimeSheet(id);
            cache.timeSheets = cache.timeSheets.filter(timeSheet => timeSheet.id !== id);
        } catch (err) {
            error = err instanceof Error ? err.message : 'Failed to delete time sheet';
            throw err;
        }
    },

    // Task Management
    get tasks() {
        return cache.tasks;
    },

    async loadTasks(params?: {
        user?: number;
        customer?: number;
        project?: number;
        activity?: number;
        status?: 'open' | 'closed';
        page?: number;
        size?: number;
    }): Promise<KimaiTask[]> {
        if (!apiClient) throw new Error('Not connected to Kimai');

        try {
            isLoading.tasks = true;
            const response = await apiClient.getTasks(params);
            cache.tasks = response.data;
            cache.lastUpdated.tasks = new Date().toISOString();
            return response.data;
        } catch (err) {
            error = err instanceof Error ? err.message : 'Failed to load tasks';
            throw err;
        } finally {
            isLoading.tasks = false;
        }
    },

    async createTask(task: Partial<KimaiTask>): Promise<KimaiTask> {
        if (!apiClient) throw new Error('Not connected to Kimai');

        try {
            const newTask = await apiClient.createTask(task);
            cache.tasks = [newTask, ...cache.tasks];
            return newTask;
        } catch (err) {
            error = err instanceof Error ? err.message : 'Failed to create task';
            throw err;
        }
    },

    async updateTask(id: number, updates: Partial<KimaiTask>): Promise<KimaiTask> {
        if (!apiClient) throw new Error('Not connected to Kimai');

        try {
            const updatedTask = await apiClient.updateTask(id, updates);
            cache.tasks = cache.tasks.map(task =>
                task.id === id ? updatedTask : task
            );
            return updatedTask;
        } catch (err) {
            error = err instanceof Error ? err.message : 'Failed to update task';
            throw err;
        }
    },

    async deleteTask(id: number): Promise<void> {
        if (!apiClient) throw new Error('Not connected to Kimai');

        try {
            await apiClient.deleteTask(id);
            cache.tasks = cache.tasks.filter(task => task.id !== id);
        } catch (err) {
            error = err instanceof Error ? err.message : 'Failed to delete task';
            throw err;
        }
    },

    // Cache Management
    get cache() {
        return cache;
    },

    clearCache() {
        cache = {
            customers: [],
            projects: [],
            activities: [],
            timeSheets: [],
            tasks: [],
            lastUpdated: {},
            version: '1.0.0'
        };
    },

    async refreshCache() {
        if (!connectionState.isConnected) return;

        await Promise.all([
            this.loadCustomers(),
            this.loadProjects(),
            this.loadActivities(),
            this.loadTimeSheets(),
            this.loadTasks()
        ]);
    },

    // Loading States
    get isLoading() {
        return isLoading;
    },

    // Error Management
    get error() {
        return error;
    },

    clearError() {
        error = null;
    }
};

// Export the store
export default kimaiStore; 