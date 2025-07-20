<script lang="ts">
    import { timerStore } from "$lib/stores/index.js";
    import { Play, Pause, Square, RotateCcw } from "lucide-svelte";

    // Props
    interface Props {
        size?: "small" | "medium" | "large";
        showReset?: boolean;
        className?: string;
    }

    let {
        size = "medium",
        showReset = false,
        className = "",
    }: Props = $props();

    // Get timer state
    let timerState = $derived(timerStore.state);

    // Handle button click
    function handleClick() {
        if (timerState.canStart) {
            timerStore.start();
        } else if (timerState.canPause) {
            timerStore.pause();
        } else if (timerState.canResume) {
            timerStore.resume();
        } else if (timerState.canStop) {
            timerStore.stop();
        }
    }

    // Handle reset click
    function handleReset() {
        timerStore.reset();
    }

    // Get button icon
    function getButtonIcon() {
        if (timerState.canStart) {
            return Play;
        } else if (timerState.canPause) {
            return Pause;
        } else if (timerState.canResume) {
            return Play;
        } else if (timerState.canStop) {
            return Square;
        }
        return Play;
    }

    // Get button color
    function getButtonColor(): string {
        if (timerState.status === "running") {
            return "var(--success-color)";
        } else if (timerState.status === "paused") {
            return "var(--warning-color)";
        } else if (timerState.status === "stopped") {
            return "var(--danger-color)";
        }
        return "var(--primary-color)";
    }

    // Get button title
    function getButtonTitle(): string {
        if (timerState.canStart) {
            return "Start Timer";
        } else if (timerState.canPause) {
            return "Pause Timer";
        } else if (timerState.canResume) {
            return "Resume Timer";
        } else if (timerState.canStop) {
            return "Stop Timer";
        }
        return "Start Timer";
    }

    const ButtonIcon = getButtonIcon();
</script>

<div class="play-button-container {className}">
    <button
        class="play-button {size}"
        onclick={handleClick}
        title={getButtonTitle()}
        style="color: {getButtonColor()}"
    >
        <ButtonIcon
            size={size === "small" ? 16 : size === "medium" ? 20 : 24}
        />
    </button>

    {#if showReset && timerState.status !== "idle"}
        <button
            class="reset-button {size}"
            onclick={handleReset}
            title="Reset Timer"
        >
            <RotateCcw
                size={size === "small" ? 14 : size === "medium" ? 16 : 18}
            />
        </button>
    {/if}
</div>

<style>
    .play-button-container {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .play-button,
    .reset-button {
        display: flex;
        align-items: center;
        justify-content: center;
        border: none;
        border-radius: 50%;
        cursor: pointer;
        transition: all 0.2s;
        background: var(--bg-primary);
        border: 2px solid var(--border-color);
    }

    .play-button:hover,
    .reset-button:hover {
        background: var(--bg-hover);
        transform: scale(1.05);
    }

    .play-button:active,
    .reset-button:active {
        transform: scale(0.95);
    }

    .reset-button {
        color: var(--text-secondary);
        border-color: var(--border-color);
    }

    .reset-button:hover {
        color: var(--text-primary);
        border-color: var(--text-primary);
    }

    /* Size variants */
    .small {
        width: 32px;
        height: 32px;
    }

    .medium {
        width: 40px;
        height: 40px;
    }

    .large {
        width: 48px;
        height: 48px;
    }
</style>
