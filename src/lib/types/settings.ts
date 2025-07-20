// Application Settings Types
import type { KimaiProfile } from './kimai.js';

export interface AppSettings {
    // Profile Management
    profiles: KimaiProfile[];
    currentProfileId?: string;

    // UI Preferences
    ui: UISettings;

    // Event Settings
    events: EventSettings;

    // Auto-refresh Settings
    autoRefresh: AutoRefreshSettings;

    // SSL Settings
    ssl: SSLSettings;
}

export interface UISettings {
    language: string;
    geometry: WindowGeometry;
    trayBehavior: TrayBehavior;
    theme: 'light' | 'dark' | 'system';
    fontSize: 'small' | 'medium' | 'large';
    showNotifications: boolean;
}

export interface WindowGeometry {
    x: number;
    y: number;
    width: number;
    height: number;
    maximized: boolean;
}

export interface TrayBehavior {
    minimizeToTray: boolean;
    startMinimized: boolean;
    closeToTray: boolean;
    showTrayIcon: boolean;
}

export interface EventSettings {
    enableIdleDetection: boolean;
    idleTimeout: number; // minutes
    enableLockDetection: boolean;
    autoStopOnIdle: boolean;
    autoStopOnLock: boolean;
    showIdleWarning: boolean;
    idleWarningTime: number; // minutes
}

export interface AutoRefreshSettings {
    enabled: boolean;
    interval: number; // seconds
    syncOnStartup: boolean;
    syncOnResume: boolean;
}

export interface SSLSettings {
    ignoreSslErrors: boolean;
    trustedCertificates: string[];
    verifyHostname: boolean;
}

// Default Settings
export const DEFAULT_SETTINGS: AppSettings = {
    profiles: [],
    ui: {
        language: 'en',
        geometry: {
            x: 100,
            y: 100,
            width: 400,
            height: 600,
            maximized: false
        },
        trayBehavior: {
            minimizeToTray: true,
            startMinimized: false,
            closeToTray: true,
            showTrayIcon: true
        },
        theme: 'system',
        fontSize: 'medium',
        showNotifications: true
    },
    events: {
        enableIdleDetection: true,
        idleTimeout: 5,
        enableLockDetection: true,
        autoStopOnIdle: true,
        autoStopOnLock: true,
        showIdleWarning: true,
        idleWarningTime: 1
    },
    autoRefresh: {
        enabled: true,
        interval: 30,
        syncOnStartup: true,
        syncOnResume: true
    },
    ssl: {
        ignoreSslErrors: false,
        trustedCertificates: [],
        verifyHostname: true
    }
}; 