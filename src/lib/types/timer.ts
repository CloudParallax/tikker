// Timer Types

export interface TimerState {
    // Timer Status
    isRunning: boolean;
    isPaused: boolean;
    status: 'idle' | 'running' | 'paused' | 'stopped';

    // Time Tracking
    startTime: Date | null;
    pauseTime: Date | null;
    endTime: Date | null;
    elapsedTime: number; // in seconds
    totalElapsedTime: number; // including paused time

    // Current Entry
    currentEntry?: TimerEntry;

    // Timer Controls
    canStart: boolean;
    canPause: boolean;
    canStop: boolean;
    canResume: boolean;
}

export interface TimerEntry {
    id?: number;
    description?: string;
    customer: number;
    project: number;
    activity: number;
    billable: boolean;
    tags?: string[];
    begin: string;
    end?: string;
    duration: number;
}

export interface TimerSettings {
    // Timer Behavior
    autoStart: boolean;
    autoPause: boolean;
    autoStop: boolean;

    // Time Display
    showSeconds: boolean;
    showMilliseconds: boolean;
    timeFormat: '12h' | '24h';

    // Notifications
    showNotifications: boolean;
    notificationInterval: number; // minutes

    // Idle Detection
    idleThreshold: number; // minutes
    autoPauseOnIdle: boolean;
    showIdleWarning: boolean;
}

export interface TimerEvent {
    type: 'start' | 'pause' | 'resume' | 'stop' | 'tick' | 'idle' | 'lock';
    timestamp: string;
    duration?: number;
    details?: any;
}

export interface TimerHistory {
    entries: TimerEntry[];
    totalTime: number;
    billableTime: number;
    lastEntry?: TimerEntry;
}

// Default Timer State
export const DEFAULT_TIMER_STATE: TimerState = {
    isRunning: false,
    isPaused: false,
    status: 'idle',
    startTime: null,
    pauseTime: null,
    endTime: null,
    elapsedTime: 0,
    totalElapsedTime: 0,
    canStart: true,
    canPause: false,
    canStop: false,
    canResume: false
};

// Default Timer Settings
export const DEFAULT_TIMER_SETTINGS: TimerSettings = {
    autoStart: false,
    autoPause: false,
    autoStop: false,
    showSeconds: true,
    showMilliseconds: false,
    timeFormat: '24h',
    showNotifications: true,
    notificationInterval: 30,
    idleThreshold: 5,
    autoPauseOnIdle: true,
    showIdleWarning: true
}; 