<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { Clock } from "lucide-svelte";

    const dispatch = createEventDispatcher<{
        change: number;
        input: number;
    }>();

    // Props
    interface Props {
        value?: number; // seconds
        showSeconds?: boolean;
        showHours?: boolean;
        disabled?: boolean;
        placeholder?: string;
        className?: string;
    }

    let {
        value = 0,
        showSeconds = true,
        showHours = true,
        disabled = false,
        placeholder = "00:00:00",
        className = "",
    }: Props = $props();

    // Local state for time inputs
    let hours = $state(Math.floor(value / 3600));
    let minutes = $state(Math.floor((value % 3600) / 60));
    let seconds = $state(Math.floor(value % 60));

    // Update local state when value prop changes
    $effect(() => {
        hours = Math.floor(value / 3600);
        minutes = Math.floor((value % 3600) / 60);
        seconds = Math.floor(value % 60);
    });

    // Update value when local state changes
    $effect(() => {
        const newValue = hours * 3600 + minutes * 60 + seconds;
        if (newValue !== value) {
            dispatch("change", newValue);
        }
    });

    // Handle input changes
    function handleHoursChange(event: Event) {
        const target = event.target as HTMLInputElement;
        const newHours = Math.max(0, parseInt(target.value) || 0);
        hours = newHours;
        dispatch("input", hours * 3600 + minutes * 60 + seconds);
    }

    function handleMinutesChange(event: Event) {
        const target = event.target as HTMLInputElement;
        const newMinutes = Math.max(
            0,
            Math.min(59, parseInt(target.value) || 0),
        );
        minutes = newMinutes;
        dispatch("input", hours * 3600 + minutes * 60 + seconds);
    }

    function handleSecondsChange(event: Event) {
        const target = event.target as HTMLInputElement;
        const newSeconds = Math.max(
            0,
            Math.min(59, parseInt(target.value) || 0),
        );
        seconds = newSeconds;
        dispatch("input", hours * 3600 + minutes * 60 + seconds);
    }

    // Format display value
    function getDisplayValue(): string {
        if (showHours) {
            return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
        } else {
            return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
        }
    }

    // Quick time presets
    function setQuickTime(seconds: number) {
        hours = Math.floor(seconds / 3600);
        minutes = Math.floor((seconds % 3600) / 60);
        seconds = Math.floor(seconds % 60);
        dispatch("change", seconds);
    }
</script>

<div class="time-range {className}">
    <div class="time-inputs">
        {#if showHours}
            <div class="time-input-group">
                <label for="hours">Hours</label>
                <input
                    type="number"
                    id="hours"
                    bind:value={hours}
                    on:input={handleHoursChange}
                    min="0"
                    max="999"
                    {disabled}
                    class="time-input"
                />
            </div>
        {/if}

        <div class="time-input-group">
            <label for="minutes">Minutes</label>
            <input
                type="number"
                id="minutes"
                bind:value={minutes}
                on:input={handleMinutesChange}
                min="0"
                max="59"
                {disabled}
                class="time-input"
            />
        </div>

        {#if showSeconds}
            <div class="time-input-group">
                <label for="seconds">Seconds</label>
                <input
                    type="number"
                    id="seconds"
                    bind:value={seconds}
                    on:input={handleSecondsChange}
                    min="0"
                    max="59"
                    {disabled}
                    class="time-input"
                />
            </div>
        {/if}
    </div>

    <div class="time-display">
        <Clock size={16} />
        <span class="time-value">{getDisplayValue()}</span>
    </div>

    <div class="quick-presets">
        <button
            type="button"
            class="preset-btn"
            onclick={() => setQuickTime(15 * 60)}
            {disabled}
        >
            15m
        </button>
        <button
            type="button"
            class="preset-btn"
            onclick={() => setQuickTime(30 * 60)}
            {disabled}
        >
            30m
        </button>
        <button
            type="button"
            class="preset-btn"
            onclick={() => setQuickTime(60 * 60)}
            {disabled}
        >
            1h
        </button>
        <button
            type="button"
            class="preset-btn"
            onclick={() => setQuickTime(2 * 60 * 60)}
            {disabled}
        >
            2h
        </button>
    </div>
</div>

<style>
    .time-range {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }

    .time-inputs {
        display: flex;
        gap: 0.5rem;
        align-items: end;
    }

    .time-input-group {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }

    .time-input-group label {
        font-size: 0.75rem;
        font-weight: 500;
        color: var(--text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    .time-input {
        width: 60px;
        padding: 0.5rem;
        border: 1px solid var(--border-color);
        border-radius: 4px;
        background: var(--bg-primary);
        color: var(--text-primary);
        font-size: 0.875rem;
        text-align: center;
        font-family: "Courier New", monospace;
    }

    .time-input:focus {
        outline: none;
        border-color: var(--primary-color);
        box-shadow: 0 0 0 2px var(--primary-color-alpha);
    }

    .time-input:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .time-display {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem;
        background: var(--bg-secondary);
        border-radius: 4px;
        font-family: "Courier New", monospace;
        font-weight: 600;
        color: var(--text-primary);
    }

    .time-value {
        font-size: 1.125rem;
        letter-spacing: 0.05em;
    }

    .quick-presets {
        display: flex;
        gap: 0.25rem;
        flex-wrap: wrap;
    }

    .preset-btn {
        padding: 0.25rem 0.5rem;
        border: 1px solid var(--border-color);
        border-radius: 4px;
        background: var(--bg-primary);
        color: var(--text-primary);
        font-size: 0.75rem;
        cursor: pointer;
        transition: all 0.2s;
    }

    .preset-btn:hover:not(:disabled) {
        background: var(--bg-hover);
        border-color: var(--primary-color);
    }

    .preset-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
</style>
