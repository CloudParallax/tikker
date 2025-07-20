<script lang="ts">
    import { timerStore, sessionStore } from "$lib/stores/index.js";
    import { Play, Square, RotateCcw } from "lucide-svelte";

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
        } else if (timerState.canStop) {
            // Stop timer
            timerStore.stop();

            // If there's a current task running, also stop it
            if (sessionStore.currentTask) {
                // Dispatch a custom event to notify TaskWidget to stop the task
                window.dispatchEvent(
                    new CustomEvent("stop-task-requested", {
                        detail: { taskId: sessionStore.currentTask.id },
                    }),
                );
            }
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
        } else if (timerState.canStop) {
            return Square;
        }
        return Play;
    }

    // Get button color classes
    function getButtonColorClasses(): string {
        if (timerState.status === "running") {
            return "text-red-600 dark:text-red-400";
        } else if (timerState.status === "stopped") {
            return "text-green-600 dark:text-green-400";
        }
        return "text-blue-600 dark:text-blue-400";
    }

    // Get button title
    function getButtonTitle(): string {
        if (timerState.canStart) {
            return "Start Timer";
        } else if (timerState.canStop) {
            return "Stop Timer";
        }
        return "Start Timer";
    }

    const ButtonIcon = getButtonIcon();
</script>

<div class="flex items-center gap-2 {className}">
    <button
        class="flex items-center justify-center rounded-full border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95 {getButtonColorClasses()} {size ===
        'small'
            ? 'w-8 h-8'
            : size === 'medium'
              ? 'w-10 h-10'
              : 'w-12 h-12'}"
        onclick={handleClick}
        title={getButtonTitle()}
    >
        <ButtonIcon
            size={size === "small" ? 16 : size === "medium" ? 20 : 24}
        />
    </button>

    {#if showReset && timerState.status !== "idle"}
        <button
            class="flex items-center justify-center rounded-full border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-400 dark:hover:border-gray-500 {size ===
            'small'
                ? 'w-8 h-8'
                : size === 'medium'
                  ? 'w-10 h-10'
                  : 'w-12 h-12'}"
            onclick={handleReset}
            title="Reset Timer"
        >
            <RotateCcw
                size={size === "small" ? 14 : size === "medium" ? 16 : 18}
            />
        </button>
    {/if}
</div>
