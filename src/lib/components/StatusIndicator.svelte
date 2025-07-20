<script lang="ts">
    import { timerStore } from "$lib/stores/index.js";
    import { Clock, Play, Pause, Square, AlertCircle } from "lucide-svelte";

    // Props
    interface Props {
        showText?: boolean;
        showIcon?: boolean;
        size?: "small" | "medium" | "large";
        className?: string;
    }

    let {
        showText = true,
        showIcon = true,
        size = "medium",
        className = "",
    }: Props = $props();

    // Get timer state
    let timerState = $derived(timerStore.state);

    // Get status info
    function getStatusInfo() {
        switch (timerState.status) {
            case "idle":
                return {
                    text: "Ready",
                    icon: Clock,
                    color: "var(--text-secondary)",
                    bgColor: "var(--bg-secondary)",
                };
            case "running":
                return {
                    text: "Running",
                    icon: Play,
                    color: "var(--success-color)",
                    bgColor: "var(--success-color-alpha)",
                };
            case "paused":
                return {
                    text: "Paused",
                    icon: Pause,
                    color: "var(--warning-color)",
                    bgColor: "var(--warning-color-alpha)",
                };
            case "stopped":
                return {
                    text: "Stopped",
                    icon: Square,
                    color: "var(--danger-color)",
                    bgColor: "var(--danger-color-alpha)",
                };
            default:
                return {
                    text: "Unknown",
                    icon: AlertCircle,
                    color: "var(--text-secondary)",
                    bgColor: "var(--bg-secondary)",
                };
        }
    }

    const statusInfo = getStatusInfo();
    const StatusIcon = statusInfo.icon;
</script>

<div
    class="status-indicator {size} {className}"
    style="color: {statusInfo.color}; background-color: {statusInfo.bgColor}"
>
    {#if showIcon}
        <StatusIcon
            size={size === "small" ? 12 : size === "medium" ? 14 : 16}
        />
    {/if}
    {#if showText}
        <span class="status-text">{statusInfo.text}</span>
    {/if}
</div>

<style>
    .status-indicator {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-size: 0.75rem;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        user-select: none;
    }

    .status-text {
        font-size: inherit;
        font-weight: inherit;
    }

    /* Size variants */
    .small {
        padding: 0.125rem 0.375rem;
        font-size: 0.625rem;
    }

    .medium {
        padding: 0.25rem 0.5rem;
        font-size: 0.75rem;
    }

    .large {
        padding: 0.375rem 0.75rem;
        font-size: 0.875rem;
    }
</style>
