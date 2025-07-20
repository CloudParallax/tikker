// Session Store
// Manages user session state and authentication

import type {
    UserSession,
    SessionState,
    SessionEvent,
    CurrentTimeSheet,
    CurrentTask
} from '$lib/types/session.js';
import type { KimaiUser, KimaiAuthConfig } from '$lib/types/kimai.js';
import { DEFAULT_SESSION } from '$lib/types/session.js';
import settingsStore from './settings.svelte.js';
import kimaiStore from './kimai.svelte.js';

// Session state
let sessionState = $state<SessionState>({
    currentSession: { ...DEFAULT_SESSION },
    recentSessions: [],
    autoLogin: false,
    rememberCredentials: false
});

// Session events history
let sessionEvents = $state<SessionEvent[]>([]);

// Session store functions
export const sessionStore = {
    // Current Session
    get currentSession() {
        return sessionState.currentSession;
    },

    get isAuthenticated() {
        return sessionState.currentSession.isAuthenticated;
    },

    get currentUser() {
        return sessionState.currentSession.user;
    },

    get isConnected() {
        return sessionState.currentSession.isConnected;
    },

    get currentTimeSheet() {
        return sessionState.currentSession.currentTimeSheet;
    },

    get currentTask() {
        return sessionState.currentSession.currentTask;
    },

    // Session Management
    async login(authConfig?: KimaiAuthConfig): Promise<UserSession> {
        try {
            // Connect to Kimai
            const connectionState = await kimaiStore.connect(authConfig);
            const user = kimaiStore.currentUser;

            if (!user) {
                throw new Error('Failed to get user information');
            }

            // Create new session
            const session: UserSession = {
                isAuthenticated: true,
                authConfig: authConfig || settingsStore.currentProfile?.auth,
                user,
                sessionStart: new Date().toISOString(),
                lastActivity: new Date().toISOString(),
                isConnected: connectionState.isConnected,
                connectionError: connectionState.error
            };

            // Update session state
            sessionState.currentSession = session;

            // Add to recent sessions
            this.addToRecentSessions(session);

            // Record session event
            this.recordEvent('login', { user: user.username });

            // Update last used for profile
            if (settingsStore.currentProfile) {
                settingsStore.updateProfile(settingsStore.currentProfile.id, {
                    lastUsed: new Date().toISOString()
                });
            }

            return session;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Login failed';
            this.recordEvent('error', { error: errorMessage });
            throw error;
        }
    },

    async logout(): Promise<void> {
        try {
            // Disconnect from Kimai
            kimaiStore.disconnect();

            // Record session event
            this.recordEvent('logout', {});

            // Update session state
            sessionState.currentSession = { ...DEFAULT_SESSION };

            // Clear current time sheet and task
            this.clearCurrentTimeSheet();
            this.clearCurrentTask();
        } catch (error) {
            console.error('Logout error:', error);
        }
    },

    async switchProfile(profileId: string): Promise<UserSession> {
        try {
            // Logout current session
            await this.logout();

            // Switch profile
            settingsStore.setCurrentProfile(profileId);

            // Auto-login if enabled
            if (sessionState.autoLogin) {
                return await this.login();
            }

            return sessionState.currentSession;
        } catch (error) {
            this.recordEvent('error', { error: 'Profile switch failed' });
            throw error;
        }
    },

    // Time Sheet Management
    startTimeSheet(timeSheet: CurrentTimeSheet): void {
        sessionState.currentSession.currentTimeSheet = timeSheet;
        sessionState.currentSession.lastActivity = new Date().toISOString();
        this.recordEvent('start', { timeSheet });
    },

    updateTimeSheet(updates: Partial<CurrentTimeSheet>): void {
        if (sessionState.currentSession.currentTimeSheet) {
            sessionState.currentSession.currentTimeSheet = {
                ...sessionState.currentSession.currentTimeSheet,
                ...updates
            };
            sessionState.currentSession.lastActivity = new Date().toISOString();
        }
    },

    stopTimeSheet(): void {
        if (sessionState.currentSession.currentTimeSheet) {
            this.recordEvent('stop', {
                timeSheet: sessionState.currentSession.currentTimeSheet
            });
            this.clearCurrentTimeSheet();
        }
    },

    clearCurrentTimeSheet(): void {
        sessionState.currentSession.currentTimeSheet = undefined;
    },

    // Task Management
    startTask(task: CurrentTask): void {
        sessionState.currentSession.currentTask = task;
        sessionState.currentSession.lastActivity = new Date().toISOString();
        this.recordEvent('start', { task });
    },

    updateTask(updates: Partial<CurrentTask>): void {
        if (sessionState.currentSession.currentTask) {
            sessionState.currentSession.currentTask = {
                ...sessionState.currentSession.currentTask,
                ...updates
            };
            sessionState.currentSession.lastActivity = new Date().toISOString();
        }
    },

    stopTask(): void {
        if (sessionState.currentSession.currentTask) {
            this.recordEvent('stop', {
                task: sessionState.currentSession.currentTask
            });
            this.clearCurrentTask();
        }
    },

    clearCurrentTask(): void {
        sessionState.currentSession.currentTask = undefined;
    },

    // Session Events
    recordEvent(type: SessionEvent['type'], details?: any): void {
        const event: SessionEvent = {
            type,
            timestamp: new Date().toISOString(),
            details
        };

        sessionEvents = [event, ...sessionEvents.slice(0, 99)]; // Keep last 100 events
    },

    get sessionEvents() {
        return sessionEvents;
    },

    clearSessionEvents(): void {
        sessionEvents = [];
    },

    // Recent Sessions
    get recentSessions() {
        return sessionState.recentSessions;
    },

    addToRecentSessions(session: UserSession): void {
        const existingIndex = sessionState.recentSessions.findIndex(
            s => s.user?.id === session.user?.id
        );

        if (existingIndex >= 0) {
            // Update existing session
            sessionState.recentSessions[existingIndex] = session;
        } else {
            // Add new session
            sessionState.recentSessions = [session, ...sessionState.recentSessions];
        }

        // Keep only last 10 sessions
        sessionState.recentSessions = sessionState.recentSessions.slice(0, 10);
    },

    clearRecentSessions(): void {
        sessionState.recentSessions = [];
    },

    // Auto-login Settings
    get autoLogin() {
        return sessionState.autoLogin;
    },

    setAutoLogin(enabled: boolean): void {
        sessionState.autoLogin = enabled;
    },

    get rememberCredentials() {
        return sessionState.rememberCredentials;
    },

    setRememberCredentials(enabled: boolean): void {
        sessionState.rememberCredentials = enabled;
    },

    // Session State Management
    updateLastActivity(): void {
        sessionState.currentSession.lastActivity = new Date().toISOString();
    },

    updateConnectionState(isConnected: boolean, error?: string): void {
        sessionState.currentSession.isConnected = isConnected;
        sessionState.currentSession.connectionError = error;
    },

    // Session Validation
    isSessionValid(): boolean {
        const session = sessionState.currentSession;

        if (!session.isAuthenticated || !session.user) {
            return false;
        }

        // Check if session has expired (24 hours)
        const sessionStart = new Date(session.sessionStart);
        const now = new Date();
        const hoursSinceStart = (now.getTime() - sessionStart.getTime()) / (1000 * 60 * 60);

        return hoursSinceStart < 24;
    },

    // Session Persistence
    saveSession(): void {
        try {
            const sessionData = {
                currentSession: sessionState.currentSession,
                recentSessions: sessionState.recentSessions,
                autoLogin: sessionState.autoLogin,
                rememberCredentials: sessionState.rememberCredentials
            };

            localStorage.setItem('tikker-session', JSON.stringify(sessionData));
        } catch (error) {
            console.error('Failed to save session:', error);
        }
    },

    loadSession(): void {
        try {
            const stored = localStorage.getItem('tikker-session');
            if (stored) {
                const sessionData = JSON.parse(stored);
                sessionState = { ...sessionState, ...sessionData };
            }
        } catch (error) {
            console.error('Failed to load session:', error);
        }
    },

    clearSession(): void {
        try {
            localStorage.removeItem('tikker-session');
            sessionState = {
                currentSession: { ...DEFAULT_SESSION },
                recentSessions: [],
                autoLogin: false,
                rememberCredentials: false
            };
        } catch (error) {
            console.error('Failed to clear session:', error);
        }
    },

    // Utility Methods
    getSessionDuration(): number {
        const session = sessionState.currentSession;
        if (!session.sessionStart) return 0;

        const start = new Date(session.sessionStart);
        const now = new Date();
        return now.getTime() - start.getTime();
    },

    formatSessionDuration(): string {
        const duration = this.getSessionDuration();
        const hours = Math.floor(duration / (1000 * 60 * 60));
        const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((duration % (1000 * 60)) / 1000);

        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
};

// Initialize session on load
sessionStore.loadSession();

// Export the store
export default sessionStore; 