// Timer Store
// Manages timer state, controls, and persistence

import type { TimerState, TimerEntry, TimerSettings, TimerEvent, TimerHistory } from '$lib/types/timer.js';
import type { KimaiTimeSheet } from '$lib/types/kimai.js';
import { kimaiStore } from './index.js';
import { settingsStore } from './index.js';
import { DEFAULT_TIMER_STATE, DEFAULT_TIMER_SETTINGS } from '$lib/types/timer.js';

// Timer state
let timerState = $state<TimerState>(loadTimerState());
let timerSettings = $state<TimerSettings>(loadTimerSettings());
let timerHistory = $state<TimerHistory>({ entries: [], totalTime: 0, billableTime: 0 });

// Timer interval for updates
let timerInterval: ReturnType<typeof setInterval> | null = null;
let notificationInterval: ReturnType<typeof setInterval> | null = null;

// Timer store functions
export const timerStore = {
    // Get current timer state
    get state() {
        return timerState;
    },

    // Get timer settings
    get settings() {
        return timerSettings;
    },

    // Get timer history
    get history() {
        return timerHistory;
    },

    // Timer Controls
    start(entry?: Partial<TimerEntry>) {
        if (!timerState.canStart) return false;

        const now = new Date();
        timerState = {
            ...timerState,
            isRunning: true,
            isPaused: false,
            status: 'running',
            startTime: now,
            pauseTime: null,
            endTime: null,
            elapsedTime: 0,
            totalElapsedTime: 0,
            currentEntry: entry ? {
                ...entry,
                begin: now.toISOString(),
                duration: 0
            } as TimerEntry : undefined,
            canStart: false,
            canPause: true,
            canStop: true,
            canResume: false
        };

        startTimerInterval();
        startNotificationInterval();
        saveTimerState();
        dispatchTimerEvent('start', { entry: timerState.currentEntry });
        return true;
    },

    pause() {
        if (!timerState.canPause) return false;

        const now = new Date();
        timerState = {
            ...timerState,
            isRunning: false,
            isPaused: true,
            status: 'paused',
            pauseTime: now,
            canStart: false,
            canPause: false,
            canStop: true,
            canResume: true
        };

        stopTimerInterval();
        stopNotificationInterval();
        saveTimerState();
        dispatchTimerEvent('pause', { duration: timerState.totalElapsedTime });
        return true;
    },

    resume() {
        if (!timerState.canResume) return false;

        const now = new Date();
        const pauseDuration = timerState.pauseTime ?
            (now.getTime() - timerState.pauseTime.getTime()) / 1000 : 0;

        timerState = {
            ...timerState,
            isRunning: true,
            isPaused: false,
            status: 'running',
            pauseTime: null,
            totalElapsedTime: timerState.totalElapsedTime + pauseDuration,
            canStart: false,
            canPause: true,
            canStop: true,
            canResume: false
        };

        startTimerInterval();
        startNotificationInterval();
        saveTimerState();
        dispatchTimerEvent('resume', { duration: timerState.totalElapsedTime });
        return true;
    },

    stop() {
        if (!timerState.canStop) return false;

        const now = new Date();
        const finalDuration = timerState.totalElapsedTime;

        // Create time sheet entry if we have current entry
        if (timerState.currentEntry) {
            const timeSheet: Partial<KimaiTimeSheet> = {
                begin: timerState.currentEntry.begin,
                end: now.toISOString(),
                duration: Math.round(finalDuration),
                description: timerState.currentEntry.description,
                billable: timerState.currentEntry.billable,
                activity: timerState.currentEntry.activity,
                project: timerState.currentEntry.project,
                customer: timerState.currentEntry.customer
            };

            // Save to Kimai
            kimaiStore.createTimeSheet(timeSheet as KimaiTimeSheet).then(() => {
                // Update history
                updateTimerHistory();
            }).catch(error => {
                console.error('Failed to save time sheet:', error);
            });
        }

        timerState = {
            ...DEFAULT_TIMER_STATE,
            endTime: now
        };

        stopTimerInterval();
        stopNotificationInterval();
        saveTimerState();
        dispatchTimerEvent('stop', { duration: finalDuration });
        return true;
    },

    reset() {
        timerState = { ...DEFAULT_TIMER_STATE };
        stopTimerInterval();
        stopNotificationInterval();
        saveTimerState();
        dispatchTimerEvent('stop', { duration: 0 });
    },

    // Timer Updates
    updateElapsedTime() {
        if (!timerState.isRunning || !timerState.startTime) return;

        const now = new Date();
        const elapsed = (now.getTime() - timerState.startTime.getTime()) / 1000;

        timerState = {
            ...timerState,
            elapsedTime: elapsed,
            totalElapsedTime: timerState.totalElapsedTime + elapsed
        };

        // Update current entry duration
        if (timerState.currentEntry) {
            timerState.currentEntry.duration = Math.round(timerState.totalElapsedTime);
        }

        dispatchTimerEvent('tick', { elapsed: timerState.totalElapsedTime });
    },

    // Settings Management
    updateSettings(newSettings: Partial<TimerSettings>) {
        timerSettings = { ...timerSettings, ...newSettings };
        saveTimerSettings();
    },

    // Entry Management
    updateCurrentEntry(updates: Partial<TimerEntry>) {
        if (timerState.currentEntry) {
            timerState.currentEntry = { ...timerState.currentEntry, ...updates };
            saveTimerState();
        }
    },

    // History Management
    loadHistory() {
        updateTimerHistory();
    },

    clearHistory() {
        timerHistory = { entries: [], totalTime: 0, billableTime: 0 };
        saveTimerHistory();
    },

    // Utility Functions
    formatTime(seconds: number): string {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);

        if (timerSettings.showSeconds) {
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        } else {
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        }
    },

    getCurrentDuration(): number {
        return timerState.totalElapsedTime;
    },

    isIdle(): boolean {
        // Simple idle detection - can be enhanced with user activity monitoring
        return false;
    }
};

// Timer Interval Management
function startTimerInterval() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timerStore.updateElapsedTime();
    }, 1000);
}

function stopTimerInterval() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

function startNotificationInterval() {
    if (!timerSettings.showNotifications) return;

    if (notificationInterval) clearInterval(notificationInterval);
    notificationInterval = setInterval(() => {
        if (timerState.isRunning) {
            showTimerNotification();
        }
    }, timerSettings.notificationInterval * 60 * 1000);
}

function stopNotificationInterval() {
    if (notificationInterval) {
        clearInterval(notificationInterval);
        notificationInterval = null;
    }
}

// Notification Management
function showTimerNotification() {
    if (!timerSettings.showNotifications) return;

    const duration = timerStore.formatTime(timerState.totalElapsedTime);
    const title = 'Tikker Timer';
    const message = `Timer running for ${duration}`;

    // Use browser notifications if available
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, {
            body: message,
            icon: '/favicon.png'
        });
    }
}

// Event Dispatching
function dispatchTimerEvent(type: TimerEvent['type'], details?: any) {
    const event: TimerEvent = {
        type,
        timestamp: new Date().toISOString(),
        details
    };

    // Dispatch custom event for components to listen to
    window.dispatchEvent(new CustomEvent('timer-event', { detail: event }));
}

// History Management
async function updateTimerHistory() {
    try {
        const timeSheets = await kimaiStore.timeSheets;
        const entries = timeSheets.map((ts: KimaiTimeSheet) => ({
            id: ts.id,
            description: ts.description,
            customer: ts.customer,
            project: ts.project,
            activity: ts.activity,
            billable: ts.billable,
            tags: ts.tags,
            begin: ts.begin,
            end: ts.end,
            duration: ts.duration || 0
        }));

        const totalTime = entries.reduce((sum: number, entry: any) => sum + entry.duration, 0);
        const billableTime = entries
            .filter((entry: any) => entry.billable)
            .reduce((sum: number, entry: any) => sum + entry.duration, 0);

        timerHistory = {
            entries,
            totalTime,
            billableTime,
            lastEntry: entries[entries.length - 1]
        };

        saveTimerHistory();
    } catch (error) {
        console.error('Failed to update timer history:', error);
    }
}

// Persistence Functions
function loadTimerState(): TimerState {
    try {
        const stored = localStorage.getItem('tikker-timer-state');
        if (stored) {
            const parsed = JSON.parse(stored);
            // Reset running state on load to prevent issues
            return {
                ...parsed,
                isRunning: false,
                isPaused: false,
                status: 'idle',
                canStart: true,
                canPause: false,
                canStop: false,
                canResume: false
            };
        }
    } catch (error) {
        console.error('Failed to load timer state:', error);
    }
    return { ...DEFAULT_TIMER_STATE };
}

function saveTimerState() {
    try {
        localStorage.setItem('tikker-timer-state', JSON.stringify(timerState));
    } catch (error) {
        console.error('Failed to save timer state:', error);
    }
}

function loadTimerSettings(): TimerSettings {
    try {
        const stored = localStorage.getItem('tikker-timer-settings');
        if (stored) {
            return { ...DEFAULT_TIMER_SETTINGS, ...JSON.parse(stored) };
        }
    } catch (error) {
        console.error('Failed to load timer settings:', error);
    }
    return { ...DEFAULT_TIMER_SETTINGS };
}

function saveTimerSettings() {
    try {
        localStorage.setItem('tikker-timer-settings', JSON.stringify(timerSettings));
    } catch (error) {
        console.error('Failed to save timer settings:', error);
    }
}

function saveTimerHistory() {
    try {
        localStorage.setItem('tikker-timer-history', JSON.stringify(timerHistory));
    } catch (error) {
        console.error('Failed to save timer history:', error);
    }
}

// Initialize timer history on load
updateTimerHistory();

// Export the store
export default timerStore; 