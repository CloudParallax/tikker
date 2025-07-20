<!-- ActivityWidget.svelte -->
<!-- Main time tracking interface component -->

<script lang="ts">
    import { onMount } from "svelte";
    import { format } from "date-fns";
    import {
        Play,
        Pause,
        Square,
        Clock,
        User,
        Building,
        FolderOpen,
        Activity,
    } from "lucide-svelte";

    import type {
        KimaiCustomer,
        KimaiProject,
        KimaiActivity,
        KimaiTimeSheet,
    } from "$lib/types/kimai.js";
    import type { CurrentTimeSheet } from "$lib/types/session.js";
    import {
        kimaiStore,
        sessionStore,
        settingsStore,
    } from "$lib/stores/index.js";

    // Component state
    let selectedCustomer: KimaiCustomer | null = null;
    let selectedProject: KimaiProject | null = null;
    let selectedActivity: KimaiActivity | null = null;
    let description = "";
    let billable = true;

    // Loading states
    let isLoading = false;
    let isStarting = false;
    let isStopping = false;

    // Error state
    let error: string | null = null;

    // Computed values
    $: availableProjects = selectedCustomer
        ? kimaiStore.getProjectsByCustomer(selectedCustomer.id)
        : kimaiStore.projects;

    $: availableActivities = selectedProject
        ? kimaiStore.getActivitiesByProject(selectedProject.id)
        : kimaiStore.activities;

    $: canStart =
        selectedCustomer && selectedProject && selectedActivity && !isStarting;
    $: canStop = sessionStore.currentTimeSheet && !isStopping;
    $: isRunning = !!sessionStore.currentTimeSheet;

    // Recent time sheets (last 10)
    $: recentTimeSheets = kimaiStore.timeSheets.slice(0, 10);

    // Initialize component
    onMount(async () => {
        if (!kimaiStore.isConnected && settingsStore.currentProfile) {
            try {
                await kimaiStore.connect();
            } catch (err) {
                error =
                    err instanceof Error ? err.message : "Failed to connect";
            }
        }
    });

    // Event handlers
    async function handleStart() {
        if (!canStart) return;

        try {
            isStarting = true;
            error = null;

            const timeSheet: CurrentTimeSheet = {
                begin: new Date().toISOString(),
                duration: 0,
                description,
                customer: selectedCustomer!.id,
                project: selectedProject!.id,
                activity: selectedActivity!.id,
                billable,
            };

            // Create time sheet on server
            const createdTimeSheet =
                await kimaiStore.createTimeSheet(timeSheet);

            // Start local session
            sessionStore.startTimeSheet({
                ...timeSheet,
                id: createdTimeSheet.id,
            });

            // Clear form
            description = "";
        } catch (err) {
            error =
                err instanceof Error
                    ? err.message
                    : "Failed to start time tracking";
        } finally {
            isStarting = false;
        }
    }

    async function handleStop() {
        if (!canStop) return;

        try {
            isStopping = true;
            error = null;

            const currentTimeSheet = sessionStore.currentTimeSheet;
            if (!currentTimeSheet?.id) return;

            // Calculate duration
            const startTime = new Date(currentTimeSheet.begin);
            const endTime = new Date();
            const duration = Math.floor(
                (endTime.getTime() - startTime.getTime()) / 1000,
            );

            // Update time sheet on server
            await kimaiStore.updateTimeSheet(currentTimeSheet.id, {
                end: endTime.toISOString(),
                duration,
                description: currentTimeSheet.description,
            });

            // Stop local session
            sessionStore.stopTimeSheet();

            // Refresh time sheets
            await kimaiStore.loadTimeSheets();
        } catch (err) {
            error =
                err instanceof Error
                    ? err.message
                    : "Failed to stop time tracking";
        } finally {
            isStopping = false;
        }
    }

    function handleCustomerChange(event: Event) {
        const select = event.target as HTMLSelectElement;
        const customerId = parseInt(select.value);
        selectedCustomer =
            kimaiStore.customers.find(
                (c: KimaiCustomer) => c.id === customerId,
            ) || null;
        selectedProject = null;
        selectedActivity = null;
    }

    function handleProjectChange(event: Event) {
        const select = event.target as HTMLSelectElement;
        const projectId = parseInt(select.value);
        selectedProject =
            availableProjects.find((p: KimaiProject) => p.id === projectId) ||
            null;
        selectedActivity = null;
    }

    function handleActivityChange(event: Event) {
        const select = event.target as HTMLSelectElement;
        const activityId = parseInt(select.value);
        selectedActivity =
            availableActivities.find(
                (a: KimaiActivity) => a.id === activityId,
            ) || null;
    }

    function formatDuration(seconds: number): string {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }

    function formatDateTime(dateString: string): string {
        return format(new Date(dateString), "MMM dd, yyyy HH:mm");
    }
</script>

<div class="activity-widget">
    <!-- Error Display -->
    {#if error}
        <div class="error-message">
            {error}
            <button onclick={() => (error = null)} class="error-close">×</button
            >
        </div>
    {/if}

    <!-- Connection Status -->
    <div class="connection-status">
        {#if kimaiStore.isConnecting}
            <span class="status connecting">Connecting...</span>
        {:else if kimaiStore.isConnected}
            <span class="status connected">Connected</span>
        {:else}
            <span class="status disconnected">Disconnected</span>
        {/if}
    </div>

    <!-- Main Controls -->
    <div class="main-controls">
        <!-- Selection Dropdowns -->
        <div class="selection-group">
            <!-- Customer Selection -->
            <div class="select-group">
                <label for="customer-select">
                    <Building size={16} />
                    Customer
                </label>
                <select
                    id="customer-select"
                    value={selectedCustomer?.id || ""}
                    onchange={handleCustomerChange}
                    disabled={isRunning || kimaiStore.isLoading.customers}
                >
                    <option value="">Select Customer</option>
                    {#each kimaiStore.customers as customer}
                        <option value={customer.id}>{customer.name}</option>
                    {/each}
                </select>
                {#if kimaiStore.isLoading.customers}
                    <span class="loading">Loading...</span>
                {/if}
            </div>

            <!-- Project Selection -->
            <div class="select-group">
                <label for="project-select">
                    <FolderOpen size={16} />
                    Project
                </label>
                <select
                    id="project-select"
                    value={selectedProject?.id || ""}
                    onchange={handleProjectChange}
                    disabled={isRunning ||
                        !selectedCustomer ||
                        kimaiStore.isLoading.projects}
                >
                    <option value="">Select Project</option>
                    {#each availableProjects as project}
                        <option value={project.id}>{project.name}</option>
                    {/each}
                </select>
                {#if kimaiStore.isLoading.projects}
                    <span class="loading">Loading...</span>
                {/if}
            </div>

            <!-- Activity Selection -->
            <div class="select-group">
                <label for="activity-select">
                    <Activity size={16} />
                    Activity
                </label>
                <select
                    id="activity-select"
                    value={selectedActivity?.id || ""}
                    onchange={handleActivityChange}
                    disabled={isRunning ||
                        !selectedProject ||
                        kimaiStore.isLoading.activities}
                >
                    <option value="">Select Activity</option>
                    {#each availableActivities as activity}
                        <option value={activity.id}>{activity.name}</option>
                    {/each}
                </select>
                {#if kimaiStore.isLoading.activities}
                    <span class="loading">Loading...</span>
                {/if}
            </div>
        </div>

        <!-- Description Input -->
        <div class="description-group">
            <label for="description-input">
                <Clock size={16} />
                Description
            </label>
            <input
                id="description-input"
                type="text"
                bind:value={description}
                placeholder="What are you working on?"
                disabled={isRunning}
            />
        </div>

        <!-- Options -->
        <div class="options-group">
            <label class="checkbox-label">
                <input
                    type="checkbox"
                    bind:checked={billable}
                    disabled={isRunning}
                />
                Billable
            </label>
        </div>

        <!-- Action Buttons -->
        <div class="action-buttons">
            {#if isRunning}
                <button
                    class="btn btn-stop"
                    onclick={handleStop}
                    disabled={isStopping}
                >
                    <Square size={16} />
                    {isStopping ? "Stopping..." : "Stop"}
                </button>
            {:else}
                <button
                    class="btn btn-start"
                    onclick={handleStart}
                    disabled={!canStart || isStarting}
                >
                    <Play size={16} />
                    {isStarting ? "Starting..." : "Start"}
                </button>
            {/if}
        </div>
    </div>

    <!-- Current Session Display -->
    {#if isRunning && sessionStore.currentTimeSheet}
        <div class="current-session">
            <h3>Currently Tracking</h3>
            <div class="session-info">
                <div class="session-item">
                    <strong>Customer:</strong>
                    {selectedCustomer?.name}
                </div>
                <div class="session-item">
                    <strong>Project:</strong>
                    {selectedProject?.name}
                </div>
                <div class="session-item">
                    <strong>Activity:</strong>
                    {selectedActivity?.name}
                </div>
                <div class="session-item">
                    <strong>Started:</strong>
                    {formatDateTime(sessionStore.currentTimeSheet.begin)}
                </div>
                {#if sessionStore.currentTimeSheet.description}
                    <div class="session-item">
                        <strong>Description:</strong>
                        {sessionStore.currentTimeSheet.description}
                    </div>
                {/if}
            </div>
        </div>
    {/if}

    <!-- Recent Time Sheets -->
    <div class="recent-timesheets">
        <h3>Recent Time Sheets</h3>
        {#if recentTimeSheets.length > 0}
            <div class="timesheet-list">
                {#each recentTimeSheets as timeSheet}
                    <div class="timesheet-item">
                        <div class="timesheet-header">
                            <span class="timesheet-date"
                                >{formatDateTime(timeSheet.begin)}</span
                            >
                            {#if timeSheet.duration}
                                <span class="timesheet-duration"
                                    >{formatDuration(timeSheet.duration)}</span
                                >
                            {/if}
                        </div>
                        <div class="timesheet-details">
                            <span class="customer"
                                >{timeSheet.customerName}</span
                            >
                            <span class="separator">→</span>
                            <span class="project">{timeSheet.projectName}</span>
                            <span class="separator">→</span>
                            <span class="activity"
                                >{timeSheet.activityName}</span
                            >
                        </div>
                        {#if timeSheet.description}
                            <div class="timesheet-description">
                                {timeSheet.description}
                            </div>
                        {/if}
                    </div>
                {/each}
            </div>
        {:else}
            <div class="empty-state">
                <Clock size={48} />
                <p>No recent time sheets</p>
            </div>
        {/if}
    </div>
</div>

<style>
    .activity-widget {
        padding: 1rem;
        max-width: 600px;
        margin: 0 auto;
    }

    .error-message {
        background-color: #fee2e2;
        border: 1px solid #fecaca;
        color: #dc2626;
        padding: 0.75rem;
        border-radius: 0.5rem;
        margin-bottom: 1rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .error-close {
        background: none;
        border: none;
        font-size: 1.25rem;
        cursor: pointer;
        color: #dc2626;
    }

    .connection-status {
        margin-bottom: 1rem;
    }

    .status {
        padding: 0.25rem 0.75rem;
        border-radius: 0.25rem;
        font-size: 0.875rem;
        font-weight: 500;
    }

    .status.connected {
        background-color: #dcfce7;
        color: #166534;
    }

    .status.connecting {
        background-color: #fef3c7;
        color: #92400e;
    }

    .status.disconnected {
        background-color: #fee2e2;
        color: #dc2626;
    }

    .main-controls {
        background-color: #f9fafb;
        border: 1px solid #e5e7eb;
        border-radius: 0.5rem;
        padding: 1.5rem;
        margin-bottom: 1.5rem;
    }

    .selection-group {
        display: grid;
        grid-template-columns: 1fr;
        gap: 1rem;
        margin-bottom: 1rem;
    }

    .select-group {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .select-group label {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-weight: 500;
        color: #374151;
    }

    select {
        padding: 0.5rem;
        border: 1px solid #d1d5db;
        border-radius: 0.375rem;
        background-color: white;
        font-size: 0.875rem;
    }

    select:disabled {
        background-color: #f3f4f6;
        color: #9ca3af;
    }

    .loading {
        font-size: 0.75rem;
        color: #6b7280;
        font-style: italic;
    }

    .description-group {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        margin-bottom: 1rem;
    }

    .description-group label {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-weight: 500;
        color: #374151;
    }

    input[type="text"] {
        padding: 0.5rem;
        border: 1px solid #d1d5db;
        border-radius: 0.375rem;
        font-size: 0.875rem;
    }

    input[type="text"]:disabled {
        background-color: #f3f4f6;
        color: #9ca3af;
    }

    .options-group {
        margin-bottom: 1rem;
    }

    .checkbox-label {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.875rem;
        color: #374151;
    }

    .action-buttons {
        display: flex;
        gap: 0.75rem;
    }

    .btn {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem 1.5rem;
        border: none;
        border-radius: 0.375rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
    }

    .btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .btn-start {
        background-color: #10b981;
        color: white;
    }

    .btn-start:hover:not(:disabled) {
        background-color: #059669;
    }

    .btn-stop {
        background-color: #ef4444;
        color: white;
    }

    .btn-stop:hover:not(:disabled) {
        background-color: #dc2626;
    }

    .current-session {
        background-color: #f0f9ff;
        border: 1px solid #bae6fd;
        border-radius: 0.5rem;
        padding: 1rem;
        margin-bottom: 1.5rem;
    }

    .current-session h3 {
        margin: 0 0 0.75rem 0;
        color: #0369a1;
        font-size: 1rem;
    }

    .session-info {
        display: grid;
        gap: 0.5rem;
    }

    .session-item {
        font-size: 0.875rem;
    }

    .session-item strong {
        color: #374151;
    }

    .recent-timesheets h3 {
        margin: 0 0 1rem 0;
        color: #374151;
        font-size: 1.125rem;
    }

    .timesheet-list {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }

    .timesheet-item {
        background-color: white;
        border: 1px solid #e5e7eb;
        border-radius: 0.375rem;
        padding: 0.75rem;
    }

    .timesheet-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.5rem;
    }

    .timesheet-date {
        font-size: 0.875rem;
        color: #6b7280;
    }

    .timesheet-duration {
        font-size: 0.875rem;
        font-weight: 500;
        color: #059669;
    }

    .timesheet-details {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.5rem;
        font-size: 0.875rem;
    }

    .customer {
        color: #1f2937;
        font-weight: 500;
    }

    .project {
        color: #374151;
    }

    .activity {
        color: #6b7280;
    }

    .separator {
        color: #9ca3af;
    }

    .timesheet-description {
        font-size: 0.875rem;
        color: #6b7280;
        font-style: italic;
    }

    .empty-state {
        text-align: center;
        padding: 2rem;
        color: #9ca3af;
    }

    .empty-state p {
        margin: 0.5rem 0 0 0;
        font-size: 0.875rem;
    }

    @media (min-width: 640px) {
        .selection-group {
            grid-template-columns: repeat(3, 1fr);
        }
    }
</style>
