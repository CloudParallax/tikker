// Session Management Types

import type { KimaiUser, KimaiAuthConfig } from './kimai.js';

export interface UserSession {
    // Authentication
    isAuthenticated: boolean;
    authConfig?: KimaiAuthConfig;

    // User Information
    user?: KimaiUser;

    // Session State
    sessionStart: string;
    lastActivity: string;
    expiresAt?: string;

    // Connection State
    isConnected: boolean;
    connectionError?: string;

    // Current Working State
    currentTimeSheet?: CurrentTimeSheet;
    currentTask?: CurrentTask;
}

export interface CurrentTimeSheet {
    id?: number;
    begin: string;
    end?: string;
    duration: number;
    description?: string;
    customer: number;
    project: number;
    activity: number;
    billable: boolean;
    tags?: string[];
}

export interface CurrentTask {
    id: number;
    title: string;
    description?: string;
    status: 'open' | 'closed' | 'pending' | 'progress';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    customer: number;
    project: number;
    activity: number;
    estimatedDuration?: number;
    actualDuration: number;
    begin: string;
}

export interface SessionState {
    // Current Session
    currentSession: UserSession;

    // Profile Management
    currentProfileId?: string;

    // Session History
    recentSessions: UserSession[];

    // Auto-login
    autoLogin: boolean;
    rememberCredentials: boolean;
}

// Session Events
export interface SessionEvent {
    type: 'login' | 'logout' | 'timeout' | 'error' | 'idle' | 'lock' | 'start' | 'stop';
    timestamp: string;
    details?: any;
}

// Default Session
export const DEFAULT_SESSION: UserSession = {
    isAuthenticated: false,
    sessionStart: new Date().toISOString(),
    lastActivity: new Date().toISOString(),
    isConnected: false
}; 