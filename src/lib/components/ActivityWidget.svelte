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
        try {
            await loadData();
        } catch (err) {
            error = "Failed to load data";
            console.error("ActivityWidget load error:", err);
        }
    });

    async function loadData() {
        isLoading = true;
        try {
            await Promise.all([
                kimaiStore.loadCustomers(),
                kimaiStore.loadProjects(),
                kimaiStore.loadActivities(),
                kimaiStore.loadTimeSheets(),
            ]);
        } finally {
            isLoading = false;
        }
    }

    async function handleStart() {
        if (!canStart) return;

        isStarting = true;
        error = null;

        try {
            const timeSheet = await kimaiStore.createTimeSheet({
                customer: selectedCustomer!.id,
                project: selectedProject!.id,
                activity: selectedActivity!.id,
                description: description.trim() || undefined,
                billable,
            });

            // Convert KimaiTimeSheet to CurrentTimeSheet
            const currentTimeSheet: CurrentTimeSheet = {
                id: timeSheet.id,
                begin: timeSheet.begin,
                duration: timeSheet.duration || 0,
                description: timeSheet.description,
                customer: timeSheet.customer,
                project: timeSheet.project,
                activity: timeSheet.activity,
                billable: timeSheet.billable,
                tags: timeSheet.tags,
            };

            sessionStore.startTimeSheet(currentTimeSheet);
        } catch (err) {
            error = "Failed to start time tracking";
            console.error("Start error:", err);
        } finally {
            isStarting = false;
        }
    }

    async function handleStop() {
        if (!canStop) return;

        isStopping = true;
        error = null;

        try {
            const currentTimeSheet = sessionStore.currentTimeSheet;
            if (!currentTimeSheet?.id) {
                throw new Error("No active time sheet");
            }

            await kimaiStore.updateTimeSheet(currentTimeSheet.id, {
                end: new Date().toISOString(),
            });
            sessionStore.stopTimeSheet();
        } catch (err) {
            error = "Failed to stop time tracking";
            console.error("Stop error:", err);
        } finally {
            isStopping = false;
        }
    }

    function formatDateTime(date: Date | string): string {
        const d = typeof date === "string" ? new Date(date) : date;
        return format(d, "MMM d, yyyy 'at' h:mm a");
    }

    function formatDuration(seconds: number): string {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${hours}h ${minutes}m`;
    }
</script>

<div
    class="flex flex-col gap-3 p-3 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700"
>
    <h3 class="text-base font-semibold text-gray-900 dark:text-gray-100">
        Activity Tracking
    </h3>

    {#if error}
        <div
            class="p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md text-red-700 dark:text-red-400 text-xs relative"
        >
            {error}
            <button
                onclick={() => (error = null)}
                class="absolute top-1 right-1 text-red-500 hover:text-red-700 dark:hover:text-red-300"
                >×</button
            >
        </div>
    {/if}

    {#if isLoading}
        <div class="flex items-center justify-center py-4">
            <div
                class="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"
            ></div>
            <span class="ml-2 text-gray-600 dark:text-gray-400 text-sm"
                >Loading...</span
            >
        </div>
    {:else}
        <!-- Selection Form -->
        <div class="space-y-2">
            <!-- Customer Selection -->
            <div>
                <label
                    class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                    <Building size={12} class="inline mr-1" />
                    Customer
                </label>
                <select
                    bind:value={selectedCustomer}
                    class="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                    <option value={null}>Select a customer</option>
                    {#each kimaiStore.customers as customer}
                        <option value={customer}>{customer.name}</option>
                    {/each}
                </select>
            </div>

            <!-- Project Selection -->
            <div>
                <label
                    class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                    <FolderOpen size={12} class="inline mr-1" />
                    Project
                </label>
                <select
                    bind:value={selectedProject}
                    disabled={!selectedCustomer}
                    class="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                    <option value={null}>Select a project</option>
                    {#each availableProjects as project}
                        <option value={project}>{project.name}</option>
                    {/each}
                </select>
            </div>

            <!-- Activity Selection -->
            <div>
                <label
                    class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                    <Activity size={12} class="inline mr-1" />
                    Activity
                </label>
                <select
                    bind:value={selectedActivity}
                    disabled={!selectedProject}
                    class="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                    <option value={null}>Select an activity</option>
                    {#each availableActivities as activity}
                        <option value={activity}>{activity.name}</option>
                    {/each}
                </select>
            </div>

            <!-- Description -->
            <div>
                <label
                    class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                    Description (optional)
                </label>
                <textarea
                    bind:value={description}
                    placeholder="What are you working on?"
                    rows="2"
                    class="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-sm"
                ></textarea>
            </div>

            <!-- Billable Toggle -->
            <div class="flex items-center">
                <input
                    type="checkbox"
                    id="billable"
                    bind:checked={billable}
                    class="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label
                    for="billable"
                    class="ml-2 block text-xs text-gray-700 dark:text-gray-300"
                >
                    Billable
                </label>
            </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex justify-center items-center min-h-[40px]">
            {#if isRunning}
                <button
                    class="inline-flex items-center gap-1 px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    onclick={handleStop}
                    disabled={isStopping}
                >
                    <Square size={14} />
                    {isStopping ? "Stopping..." : "Stop"}
                </button>
            {:else}
                <button
                    class="inline-flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    onclick={handleStart}
                    disabled={!canStart || isStarting}
                >
                    <Play size={14} />
                    {isStarting ? "Starting..." : "Start"}
                </button>
            {/if}
        </div>
    {/if}

    <!-- Current Session Display -->
    {#if isRunning && sessionStore.currentTimeSheet}
        <div
            class="mt-3 p-2 border border-green-200 dark:border-green-800 rounded-md bg-green-50 dark:bg-green-900/20"
        >
            <h3
                class="text-sm font-semibold text-green-800 dark:text-green-200 mb-2"
            >
                Currently Tracking
            </h3>
            <div class="space-y-1 text-xs">
                <div class="flex justify-between">
                    <span class="font-medium text-gray-700 dark:text-gray-300"
                        >Customer:</span
                    >
                    <span class="text-gray-900 dark:text-gray-100"
                        >{selectedCustomer?.name}</span
                    >
                </div>
                <div class="flex justify-between">
                    <span class="font-medium text-gray-700 dark:text-gray-300"
                        >Project:</span
                    >
                    <span class="text-gray-900 dark:text-gray-100"
                        >{selectedProject?.name}</span
                    >
                </div>
                <div class="flex justify-between">
                    <span class="font-medium text-gray-700 dark:text-gray-300"
                        >Activity:</span
                    >
                    <span class="text-gray-900 dark:text-gray-100"
                        >{selectedActivity?.name}</span
                    >
                </div>
                <div class="flex justify-between">
                    <span class="font-medium text-gray-700 dark:text-gray-300"
                        >Started:</span
                    >
                    <span class="text-gray-900 dark:text-gray-100"
                        >{formatDateTime(
                            sessionStore.currentTimeSheet.begin,
                        )}</span
                    >
                </div>
                {#if sessionStore.currentTimeSheet.description}
                    <div class="flex justify-between">
                        <span
                            class="font-medium text-gray-700 dark:text-gray-300"
                            >Description:</span
                        >
                        <span class="text-gray-900 dark:text-gray-100"
                            >{sessionStore.currentTimeSheet.description}</span
                        >
                    </div>
                {/if}
            </div>
        </div>
    {/if}

    <!-- Recent Time Sheets -->
    {#if recentTimeSheets.length > 0}
        <div class="mt-3">
            <h3
                class="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2"
            >
                Recent Sessions
            </h3>
            <div class="space-y-1 max-h-32 overflow-y-auto">
                {#each recentTimeSheets as timeSheet}
                    <div
                        class="p-2 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700"
                    >
                        <div class="flex justify-between items-start mb-1">
                            <span
                                class="font-medium text-gray-900 dark:text-gray-100 text-xs"
                            >
                                {timeSheet.activityName}
                            </span>
                            <span
                                class="text-xs text-gray-500 dark:text-gray-400"
                            >
                                {formatDuration(timeSheet.duration || 0)}
                            </span>
                        </div>
                        <div class="text-xs text-gray-600 dark:text-gray-400">
                            {timeSheet.projectName} • {timeSheet.customerName}
                        </div>
                        <div
                            class="text-xs text-gray-500 dark:text-gray-500 mt-1"
                        >
                            {formatDateTime(timeSheet.begin)}
                        </div>
                    </div>
                {/each}
            </div>
        </div>
    {/if}
</div>
