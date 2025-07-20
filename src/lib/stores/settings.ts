// Settings Store
// Manages application settings with localStorage persistence

import type { AppSettings } from '$lib/types/settings.js';
import type { KimaiProfile, KimaiAuthConfig } from '$lib/types/kimai.js';
import { DEFAULT_SETTINGS } from '$lib/types/settings.js';

// Settings state
let settings = $state<AppSettings>(loadSettings());

// Settings store functions
export const settingsStore = {
    // Get current settings
    get settings() {
        return settings;
    },

    // Update entire settings object
    update(newSettings: Partial<AppSettings>) {
        settings = { ...settings, ...newSettings };
        saveSettings(settings);
    },

    // Profile Management
    get profiles() {
        return settings.profiles;
    },

    get currentProfile() {
        if (!settings.currentProfileId) return null;
        return settings.profiles.find(p => p.id === settings.currentProfileId) || null;
    },

    addProfile(profile: Omit<KimaiProfile, 'id'>) {
        const newProfile: KimaiProfile = {
            ...profile,
            id: generateProfileId()
        };
        settings.profiles = [...settings.profiles, newProfile];
        saveSettings(settings);
        return newProfile;
    },

    updateProfile(id: string, updates: Partial<KimaiProfile>) {
        settings.profiles = settings.profiles.map(profile =>
            profile.id === id ? { ...profile, ...updates } : profile
        );
        saveSettings(settings);
    },

    deleteProfile(id: string) {
        settings.profiles = settings.profiles.filter(profile => profile.id !== id);
        if (settings.currentProfileId === id) {
            settings.currentProfileId = settings.profiles[0]?.id;
        }
        saveSettings(settings);
    },

    setCurrentProfile(id: string) {
        if (settings.profiles.some(p => p.id === id)) {
            settings.currentProfileId = id;
            settings.profiles = settings.profiles.map(profile =>
                profile.id === id
                    ? { ...profile, lastUsed: new Date().toISOString() }
                    : profile
            );
            saveSettings(settings);
        }
    },

    // UI Settings
    get ui() {
        return settings.ui;
    },

    updateUI(updates: Partial<AppSettings['ui']>) {
        settings.ui = { ...settings.ui, ...updates };
        saveSettings(settings);
    },

    // Event Settings
    get events() {
        return settings.events;
    },

    updateEvents(updates: Partial<AppSettings['events']>) {
        settings.events = { ...settings.events, ...updates };
        saveSettings(settings);
    },

    // Auto-refresh Settings
    get autoRefresh() {
        return settings.autoRefresh;
    },

    updateAutoRefresh(updates: Partial<AppSettings['autoRefresh']>) {
        settings.autoRefresh = { ...settings.autoRefresh, ...updates };
        saveSettings(settings);
    },

    // SSL Settings
    get ssl() {
        return settings.ssl;
    },

    updateSSL(updates: Partial<AppSettings['ssl']>) {
        settings.ssl = { ...settings.ssl, ...updates };
        saveSettings(settings);
    },

    // Reset to defaults
    reset() {
        settings = { ...DEFAULT_SETTINGS };
        saveSettings(settings);
    },

    // Export/Import
    export() {
        return JSON.stringify(settings, null, 2);
    },

    import(settingsJson: string) {
        try {
            const importedSettings = JSON.parse(settingsJson) as AppSettings;
            // Validate imported settings
            if (isValidSettings(importedSettings)) {
                settings = importedSettings;
                saveSettings(settings);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Failed to import settings:', error);
            return false;
        }
    }
};

// Local Storage Functions
function loadSettings(): AppSettings {
    try {
        const stored = localStorage.getItem('tikker-settings');
        if (stored) {
            const parsed = JSON.parse(stored) as AppSettings;
            // Merge with defaults to handle missing properties
            return mergeWithDefaults(parsed);
        }
    } catch (error) {
        console.error('Failed to load settings:', error);
    }
    return { ...DEFAULT_SETTINGS };
}

function saveSettings(settings: AppSettings) {
    try {
        localStorage.setItem('tikker-settings', JSON.stringify(settings));
    } catch (error) {
        console.error('Failed to save settings:', error);
    }
}

function mergeWithDefaults(partial: Partial<AppSettings>): AppSettings {
    return {
        ...DEFAULT_SETTINGS,
        ...partial,
        ui: { ...DEFAULT_SETTINGS.ui, ...partial.ui },
        events: { ...DEFAULT_SETTINGS.events, ...partial.events },
        autoRefresh: { ...DEFAULT_SETTINGS.autoRefresh, ...partial.autoRefresh },
        ssl: { ...DEFAULT_SETTINGS.ssl, ...partial.ssl }
    };
}

function isValidSettings(settings: any): settings is AppSettings {
    return (
        settings &&
        typeof settings === 'object' &&
        Array.isArray(settings.profiles) &&
        typeof settings.ui === 'object' &&
        typeof settings.events === 'object' &&
        typeof settings.autoRefresh === 'object' &&
        typeof settings.ssl === 'object'
    );
}

function generateProfileId(): string {
    return `profile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Export the store
export default settingsStore; 