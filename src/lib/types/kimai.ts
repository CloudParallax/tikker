// Kimai API Types
// Based on Kemai's API integration and Kimai's REST API

export interface KimaiUser {
    id: number;
    username: string;
    email: string;
    language: string;
    timezone: string;
    roles: string[];
    preferences: Record<string, any>;
}

export interface KimaiCustomer {
    id: number;
    name: string;
    number?: string;
    comment?: string;
    company?: string;
    contact?: string;
    address?: string;
    country?: string;
    currency?: string;
    phone?: string;
    fax?: string;
    mobile?: string;
    email?: string;
    homepage?: string;
    timezone?: string;
    color?: string;
    visible: boolean;
    budget?: number;
    timeBudget?: number;
    metaFields?: Record<string, any>;
}

export interface KimaiProject {
    id: number;
    name: string;
    comment?: string;
    orderNumber?: string;
    orderDate?: string;
    start?: string;
    end?: string;
    color?: string;
    visible: boolean;
    budget?: number;
    timeBudget?: number;
    customer: number | KimaiCustomer;
    customerName?: string;
    metaFields?: Record<string, any>;
}

export interface KimaiActivity {
    id: number;
    name: string;
    comment?: string;
    visible: boolean;
    color?: string;
    budget?: number;
    timeBudget?: number;
    project?: number;
    projectName?: string;
    metaFields?: Record<string, any>;
}

export interface KimaiTimeSheet {
    id: number;
    begin: string;
    end?: string;
    duration?: number;
    description?: string;
    rate?: number;
    internalRate?: number;
    billable: boolean;
    exported: boolean;
    tags?: string[];
    user: number;
    userName?: string;
    activity: number;
    activityName?: string;
    project: number;
    projectName?: string;
    customer: number;
    customerName?: string;
    metaFields?: Record<string, any>;
}

export interface KimaiTask {
    id: number;
    title: string;
    description?: string;
    status: 'open' | 'closed' | 'pending' | 'progress';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    dueDate?: string;
    estimatedDuration?: number;
    actualDuration?: number;
    user: KimaiUser;
    activity: KimaiActivity;
    project: KimaiProject;
    tags?: string[];
    metaFields?: Record<string, any>;
    activeTimesheets?: KimaiTimeSheet[];
}

export interface KimaiVersion {
    version: string;
    versionId: number;
    semanticVersion: string;
    cgit: string;
    copyright: string;
    license: string;
    features: string[];
}

export interface KimaiConfig {
    timesheet: {
        defaultBeginTime: string;
        defaultEndTime: string;
        defaultDuration: number;
        allowFutureTimes: boolean;
        allowOverlapping: boolean;
        lockdownPeriodStart: string;
        lockdownPeriodEnd: string;
        lockdownGracePeriod: number;
    };
    calendar: {
        businessHoursBegin: string;
        businessHoursEnd: string;
        businessDays: number[];
        dayLimit: number;
        weekHours: number;
        monthHours: number;
    };
    theme: {
        colorChoices: string[];
        showChoice: boolean;
        allowUserThemes: boolean;
        selectRandomColors: boolean;
    };
    defaults: {
        customer: number;
        project: number;
        activity: number;
        user: number;
    };
}

// Authentication Types
export interface KimaiAuthConfig {
    type: 'api_token' | 'legacy';
    username?: string;
    password?: string;
    apiToken?: string;
    baseUrl: string;
}

export interface KimaiAuthResponse {
    token?: string;
    refresh_token?: string;
    expires_in?: number;
    user: KimaiUser;
}

// API Response Types
export interface KimaiApiResponse<T> {
    data: T;
    message?: string;
    status: 'success' | 'error';
}

export interface KimaiPaginationResponse<T> {
    data: T[];
    total: number;
    page: number;
    size: number;
    pages: number;
}

// Error Types
export interface KimaiApiError {
    code: number;
    message: string;
    details?: any;
}

// Connection State
export interface KimaiConnectionState {
    isConnected: boolean;
    isConnecting: boolean;
    lastConnected?: string;
    error?: string;
    version?: KimaiVersion;
}

// Profile Management
export interface KimaiProfile {
    id: string;
    name: string;
    auth: KimaiAuthConfig;
    autoConnect: boolean;
    lastUsed?: string;
}

// Cache Types
export interface KimaiCache {
    customers: KimaiCustomer[];
    projects: KimaiProject[];
    activities: KimaiActivity[];
    timeSheets: KimaiTimeSheet[];
    tasks: KimaiTask[];
    lastUpdated: Record<string, string>;
    version: string;
} 