// Task Types

import type { KimaiTask } from './kimai.js';

export interface TaskState {
    // Task List
    tasks: KimaiTask[];
    filteredTasks: KimaiTask[];

    // Current Task
    currentTask?: KimaiTask;

    // Task Filters
    filters: TaskFilters;

    // Task Operations
    isLoading: boolean;
    isCreating: boolean;
    isUpdating: boolean;
    isDeleting: boolean;

    // Error State
    error?: string;
}

export interface TaskFilters {
    status: 'all' | 'open' | 'closed';
    priority: 'all' | 'low' | 'medium' | 'high' | 'urgent';
    customer?: number;
    project?: number;
    activity?: number;
    user?: number;
    searchText: string;
    dueDate?: {
        from?: string;
        to?: string;
    };
}

export interface TaskFormData {
    title: string;
    description?: string;
    status: 'open' | 'closed';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    dueDate?: string;
    estimatedDuration?: number;
    customer: number;
    project: number;
    activity: number;
    tags?: string[];
}

export interface TaskStats {
    total: number;
    open: number;
    closed: number;
    overdue: number;
    dueToday: number;
    dueThisWeek: number;
    totalEstimatedTime: number;
    totalActualTime: number;
}

export interface TaskSortOptions {
    field: 'title' | 'status' | 'priority' | 'dueDate' | 'createdAt' | 'estimatedDuration' | 'actualDuration';
    direction: 'asc' | 'desc';
}

// Task Events
export interface TaskEvent {
    type: 'created' | 'updated' | 'deleted' | 'started' | 'stopped' | 'closed';
    taskId: number;
    timestamp: string;
    details?: any;
}

// Task Templates
export interface TaskTemplate {
    id: string;
    name: string;
    description?: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    estimatedDuration?: number;
    customer?: number;
    project?: number;
    activity?: number;
    tags?: string[];
}

// Default Task State
export const DEFAULT_TASK_STATE: TaskState = {
    tasks: [],
    filteredTasks: [],
    filters: {
        status: 'all',
        priority: 'all',
        searchText: ''
    },
    isLoading: false,
    isCreating: false,
    isUpdating: false,
    isDeleting: false
};

// Default Task Filters
export const DEFAULT_TASK_FILTERS: TaskFilters = {
    status: 'all',
    priority: 'all',
    searchText: ''
};

// Task Priority Colors
export const TASK_PRIORITY_COLORS = {
    low: '#10b981', // green
    medium: '#f59e0b', // amber
    high: '#ef4444', // red
    urgent: '#dc2626' // red-600
} as const;

// Task Status Colors
export const TASK_STATUS_COLORS = {
    open: '#3b82f6', // blue
    closed: '#6b7280' // gray
} as const; 