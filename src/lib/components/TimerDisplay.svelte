<script lang="ts">
    import { timerStore } from "$lib/stores/index.js";
    import type { TimerSettings } from "$lib/types/timer.js";

    // Props
    interface Props {
        showSeconds?: boolean;
        showMilliseconds?: boolean;
        timeFormat?: "12h" | "24h";
        size?: "small" | "medium" | "large";
        className?: string;
    }

    let {
        showSeconds = true,
        showMilliseconds = false,
        timeFormat = "24h",
        size = "medium",
        className = "",
    }: Props = $props();

    // Get timer state and settings
    let timerState = $derived(timerStore.state);
    let timerSettings = $derived(timerStore.settings);

    // Format time display
    function formatTimeDisplay(seconds: number): string {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);

        if (showSeconds) {
            return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
        } else {
            return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
        }
    }

    // Get current time to display
    let currentTime = $derived(formatTimeDisplay(timerState.totalElapsedTime));

    // Get status color
    function getStatusColor(): string {
        switch (timerState.status) {
            case "running":
                return "var(--success-color)";
            case "paused":
                return "var(--warning-color)";
            case "stopped":
                return "var(--danger-color)";
            default:
                return "var(--text-secondary)";
        }
    }
</script>

<div class="timer-display {size} {className}" style="color: {getStatusColor()}">
    <span class="time-value">{currentTime}</span>
    {#if timerState.status === "paused"}
        <span class="status-indicator">PAUSED</span>
    {/if}
</div>

<style>
    .timer-display {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-family: "Courier New", monospace;
        font-weight: 600;
        user-select: none;
    }

    .time-value {
        font-variant-numeric: tabular-nums;
        letter-spacing: 0.05em;
    }

    .status-indicator {
        font-size: 0.75em;
        opacity: 0.7;
        font-weight: normal;
        text-transform: uppercase;
        letter-spacing: 0.1em;
    }

    /* Size variants */
    .small .time-value {
        font-size: 1rem;
    }

    .medium .time-value {
        font-size: 1.5rem;
    }

    .large .time-value {
        font-size: 2rem;
    }

    .small .status-indicator {
        font-size: 0.625rem;
    }

    .medium .status-indicator {
        font-size: 0.75rem;
    }

    .large .status-indicator {
        font-size: 0.875rem;
    }
</style>
