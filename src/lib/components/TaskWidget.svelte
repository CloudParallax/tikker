<!-- TaskWidget.svelte -->
<!-- Task-based time tracking interface component -->

<script lang="ts">
    import { format } from "date-fns";
    import {
        Play,
        Square,
        Clock,
        User,
        Building,
        FolderOpen,
        Activity,
        Search,
        Filter,
        RefreshCw,
        CheckCircle,
        Circle,
        AlertCircle,
    } from "lucide-svelte";

    import type {
        KimaiTask,
        KimaiCustomer,
        KimaiProject,
        KimaiActivity,
    } from "$lib/types/kimai.js";
    import type { CurrentTask } from "$lib/types/session.js";
    import {
        kimaiStore,
        sessionStore,
        settingsStore,
        timerStore,
    } from "$lib/stores/index.js";
    import TimerDisplay from "$lib/components/TimerDisplay.svelte";
    import PlayButton from "$lib/components/PlayButton.svelte";

    // Component state using Svelte 5 runes
    let tasks = $state<KimaiTask[]>([]);
    let selectedTask = $state<KimaiTask | null>(null);
    let searchTerm = $state("");
    let statusFilter = $state<
        "all" | "open" | "closed" | "pending" | "progress"
    >("all");
    let priorityFilter = $state<"all" | "low" | "medium" | "high" | "urgent">(
        "all",
    );

    // Loading states
    let isLoading = $state(false);
    let isStarting = $state(false);
    let isStopping = $state(false);

    // Error state
    let error = $state<string | null>(null);

    // Computed values using $derived
    let filteredTasks = $derived(
        (tasks || []).filter((task) => {
            const matchesSearch =
                !searchTerm ||
                task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                task.description
                    ?.toLowerCase()
                    .includes(searchTerm.toLowerCase()) ||
                (typeof task.project.customer === "object"
                    ? task.project.customer.name
                    : ""
                )
                    ?.toLowerCase()
                    .includes(searchTerm.toLowerCase()) ||
                task.project?.name
                    ?.toLowerCase()
                    .includes(searchTerm.toLowerCase()) ||
                task.activity?.name
                    ?.toLowerCase()
                    .includes(searchTerm.toLowerCase());

            const matchesStatus =
                statusFilter === "all" || task.status === statusFilter;
            const matchesPriority =
                priorityFilter === "all" || task.priority === priorityFilter;

            return matchesSearch && matchesStatus && matchesPriority;
        }),
    );

    let canStart = $derived(selectedTask && !isStarting);
    let canStop = $derived(sessionStore.currentTask && !isStopping);
    let isRunning = $derived(!!sessionStore.currentTask);

    // Initialize component using $effect
    $effect(() => {
        if (!kimaiStore.isConnected && settingsStore.currentProfile) {
            (async () => {
                try {
                    await kimaiStore.connect();
                } catch (err) {
                    error =
                        err instanceof Error
                            ? err.message
                            : "Failed to connect";
                }
                await loadTasks();
            })();
        } else if (kimaiStore.isConnected) {
            loadTasks();
        }
    });

    // Event handlers
    async function loadTasks() {
        try {
            isLoading = true;
            error = null;
            // Load all tasks including those with 'progress' status
            tasks = await kimaiStore.loadTasks();
        } catch (err) {
            error = err instanceof Error ? err.message : "Failed to load tasks";
        } finally {
            isLoading = false;
        }
    }

    async function handleStart() {
        if (!canStart || !selectedTask) return;

        try {
            isStarting = true;
            error = null;

            // Start task on server
            const updatedTask = await kimaiStore.startTask(selectedTask.id);

            // Start local session
            const currentTask: CurrentTask = {
                id: updatedTask.id,
                title: updatedTask.title,
                description: updatedTask.description,
                status: updatedTask.status,
                priority: updatedTask.priority,
                customer:
                    typeof updatedTask.project.customer === "object"
                        ? updatedTask.project.customer.id
                        : updatedTask.project.customer,
                project: updatedTask.project.id,
                activity: updatedTask.activity.id,
                actualDuration: updatedTask.actualDuration || 0,
                begin: new Date().toISOString(),
            };

            sessionStore.startTask(currentTask);

            // Update local task list
            tasks = tasks.map((task) =>
                task.id === updatedTask.id ? updatedTask : task,
            );
        } catch (err) {
            error = err instanceof Error ? err.message : "Failed to start task";
        } finally {
            isStarting = false;
        }
    }

    async function handleStop() {
        if (!canStop || !sessionStore.currentTask) return;

        try {
            isStopping = true;
            error = null;

            const currentTask = sessionStore.currentTask;

            // Stop task on server
            const updatedTask = await kimaiStore.stopTask(currentTask.id);

            // Stop local session
            sessionStore.stopTask();

            // Update local task list
            tasks = tasks.map((task) =>
                task.id === updatedTask.id ? updatedTask : task,
            );

            // Refresh tasks to get latest data
            await loadTasks();
        } catch (err) {
            error = err instanceof Error ? err.message : "Failed to stop task";
        } finally {
            isStopping = false;
        }
    }

    async function handleClose() {
        if (!selectedTask) return;

        try {
            error = null;
            const updatedTask = await kimaiStore.closeTask(selectedTask.id);

            // Update local task list
            tasks = tasks.map((task) =>
                task.id === updatedTask.id ? updatedTask : task,
            );
        } catch (err) {
            error = err instanceof Error ? err.message : "Failed to close task";
        }
    }

    function handleTaskSelect(task: KimaiTask) {
        selectedTask = task;
    }

    function handleSearchChange(event: Event) {
        const input = event.target as HTMLInputElement;
        searchTerm = input.value;
    }

    function handleStatusFilterChange(event: Event) {
        const select = event.target as HTMLSelectElement;
        statusFilter = select.value as
            | "all"
            | "open"
            | "closed"
            | "pending"
            | "progress";
    }

    function handlePriorityFilterChange(event: Event) {
        const select = event.target as HTMLSelectElement;
        priorityFilter = select.value as
            | "all"
            | "low"
            | "medium"
            | "high"
            | "urgent";
    }

    function getPriorityIcon(priority: string) {
        switch (priority) {
            case "urgent":
                return AlertCircle;
            case "high":
                return AlertCircle;
            case "medium":
                return Circle;
            case "low":
                return CheckCircle;
            default:
                return Circle;
        }
    }

    function getPriorityColor(priority: string): string {
        switch (priority) {
            case "urgent":
                return "text-red-600 dark:text-red-400";
            case "high":
                return "text-orange-600 dark:text-orange-400";
            case "medium":
                return "text-blue-600 dark:text-blue-400";
            case "low":
                return "text-green-600 dark:text-green-400";
            default:
                return "text-gray-600 dark:text-gray-400";
        }
    }

    function getStatusColor(status: string): string {
        switch (status) {
            case "open":
                return "text-green-600 dark:text-green-400";
            case "progress":
                return "text-blue-600 dark:text-blue-400";
            case "closed":
                return "text-gray-500 dark:text-gray-400";
            case "pending":
                return "text-yellow-600 dark:text-yellow-400";
            default:
                return "text-gray-700 dark:text-gray-300";
        }
    }

    function formatDateTime(dateString: string): string {
        return format(new Date(dateString), "MMM dd, yyyy HH:mm");
    }

    function isTaskActive(task: KimaiTask): boolean {
        return task.status === "progress";
    }
</script>

<div class="flex flex-col gap-2 p-2 max-w-4xl mx-auto h-full min-h-0">
    <!-- Error Display -->
    {#if error}
        <div
            class="flex justify-between items-center bg-red-600 text-white p-2 rounded-lg"
        >
            <span class="text-sm">{error}</span>
            <button
                onclick={() => (error = null)}
                class="text-white text-lg hover:text-red-200 transition-colors"
            >
                ×
            </button>
        </div>
    {/if}

    <!-- Header -->
    <div class="flex justify-between items-center mb-2">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100 m-0">
            Task Management
        </h2>
        <button
            class="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white border-none rounded-lg cursor-pointer hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            onclick={loadTasks}
            disabled={isLoading}
            title="Refresh Tasks"
        >
            <RefreshCw size={14} class={isLoading ? "animate-spin" : ""} />
        </button>
    </div>

    <!-- Filters -->
    <div class="flex gap-2 flex-wrap">
        <div class="flex items-center gap-1 flex-1 min-w-40">
            <Search size={14} class="text-gray-500 dark:text-gray-400" />
            <input
                type="text"
                placeholder="Search tasks..."
                value={searchTerm}
                oninput={handleSearchChange}
                disabled={isLoading}
                class="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
        </div>

        <div class="flex items-center gap-1">
            <Filter size={14} class="text-gray-500 dark:text-gray-400" />
            <select
                value={statusFilter}
                onchange={handleStatusFilterChange}
                disabled={isLoading}
                class="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
                <option value="all">All Status</option>
                <option value="open">Open</option>
                <option value="pending">Pending</option>
                <option value="progress">In Progress</option>
                <option value="closed">Closed</option>
            </select>

            <select
                value={priorityFilter}
                onchange={handlePriorityFilterChange}
                disabled={isLoading}
                class="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
                <option value="all">All Priorities</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
            </select>
        </div>
    </div>

    <!-- Task List -->
    <div class="flex flex-col gap-1 flex-1 overflow-y-auto min-h-0">
        {#if isLoading}
            <div class="text-center py-4 text-gray-500 dark:text-gray-400">
                Loading tasks...
            </div>
        {:else if filteredTasks.length === 0}
            <div class="text-center py-4 text-gray-500 dark:text-gray-400">
                <p>No tasks found</p>
                {#if searchTerm || statusFilter !== "all" || priorityFilter !== "all"}
                    <button
                        onclick={() => {
                            searchTerm = "";
                            statusFilter = "all";
                            priorityFilter = "all";
                        }}
                        class="mt-2 px-3 py-1 bg-blue-600 text-white border-none rounded-lg cursor-pointer hover:bg-blue-700 transition-colors text-sm"
                    >
                        Clear Filters
                    </button>
                {/if}
            </div>
        {:else}
            {#each filteredTasks as task (task.id)}
                <div
                    class="p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 cursor-pointer transition-all duration-200 hover:border-blue-500 hover:shadow-md {selectedTask?.id ===
                    task.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : ''} {task.status === 'closed'
                        ? 'opacity-60'
                        : ''} {isTaskActive(task)
                        ? 'border-l-4 border-l-blue-500 bg-blue-50/50 dark:bg-blue-900/10'
                        : ''}"
                    onclick={() => handleTaskSelect(task)}
                >
                    <div class="flex justify-between items-center mb-1">
                        <div
                            class="flex items-center gap-1 font-semibold text-gray-900 dark:text-gray-100 text-sm"
                        >
                            {#if isTaskActive(task)}
                                <div
                                    class="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"
                                ></div>
                            {/if}
                            {#if task.priority}
                                {@const PriorityIcon = getPriorityIcon(
                                    task.priority,
                                )}
                                <PriorityIcon
                                    size={14}
                                    class={getPriorityColor(task.priority)}
                                />
                            {/if}
                            <span>{task.title}</span>
                        </div>
                        <div
                            class={getStatusColor(task.status) +
                                " text-xs font-medium uppercase"}
                        >
                            {task.status}
                        </div>
                    </div>

                    {#if task.description}
                        <div
                            class="text-gray-600 dark:text-gray-400 mb-2 text-xs"
                        >
                            {task.description}
                        </div>
                    {/if}

                    <div
                        class="flex gap-3 mb-1 text-xs text-gray-500 dark:text-gray-400"
                    >
                        <div class="flex items-center gap-1">
                            <Building size={10} />
                            {typeof task.project.customer === "object"
                                ? task.project.customer.name
                                : `Customer ${task.project.customer}`}
                        </div>
                        <div class="flex items-center gap-1">
                            <FolderOpen size={10} />
                            {task.project.name}
                        </div>
                        <div class="flex items-center gap-1">
                            <Activity size={10} />
                            {task.activity.name}
                        </div>
                        {#if task.user}
                            <div class="flex items-center gap-1">
                                <User size={10} />
                                {task.user.username}
                            </div>
                        {/if}
                    </div>

                    {#if task.dueDate}
                        <div
                            class="flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400"
                        >
                            <Clock size={10} />
                            Due: {formatDateTime(task.dueDate)}
                        </div>
                    {/if}
                </div>
            {/each}
        {/if}
    </div>

    <!-- Action Buttons -->
    <div class="flex gap-2 justify-center items-center min-h-12 flex-shrink-0">
        {#if isRunning}
            <button
                class="flex items-center gap-1 px-3 py-2 bg-red-600 text-white border-none rounded-lg cursor-pointer font-medium transition-colors hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                onclick={handleStop}
                disabled={isStopping}
            >
                <Square size={14} />
                {isStopping ? "Stopping..." : "Stop Task"}
            </button>
        {:else if selectedTask}
            <button
                class="flex items-center gap-1 px-3 py-2 bg-green-600 text-white border-none rounded-lg cursor-pointer font-medium transition-colors hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                onclick={handleStart}
                disabled={!canStart || isStarting}
            >
                <Play size={14} />
                {isStarting ? "Starting..." : "Start Task"}
            </button>

            {#if selectedTask.status === "open" && !isRunning}
                <button
                    class="flex items-center gap-1 px-3 py-2 bg-orange-600 text-white border-none rounded-lg cursor-pointer font-medium transition-colors hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    onclick={handleClose}
                    disabled={isRunning}
                >
                    <CheckCircle size={14} />
                    Close Task
                </button>
            {/if}
        {:else}
            <div
                class="text-center text-gray-500 dark:text-gray-400 italic text-sm"
            >
                <p class="m-0">
                    Select a task from the list above to start working
                </p>
            </div>
        {/if}
    </div>

    <!-- Current Task Display -->
    {#if isRunning && sessionStore.currentTask}
        <div
            class="mt-2 p-3 border border-green-600 rounded-lg bg-green-50 dark:bg-green-900/20"
        >
            <h3
                class="text-green-600 dark:text-green-400 m-0 mb-2 font-semibold text-sm"
            >
                Currently Working On
            </h3>
            <div class="flex flex-col gap-1 mb-3">
                <div class="flex gap-2">
                    <strong class="min-w-16 text-xs">Task:</strong>
                    <span class="text-xs">{sessionStore.currentTask.title}</span
                    >
                </div>
                {#if sessionStore.currentTask.description}
                    <div class="flex gap-2">
                        <strong class="min-w-16 text-xs">Description:</strong>
                        <span class="text-xs"
                            >{sessionStore.currentTask.description}</span
                        >
                    </div>
                {/if}
                <div class="flex gap-2">
                    <strong class="min-w-16 text-xs">Started:</strong>
                    <span class="text-xs"
                        >{formatDateTime(sessionStore.currentTask.begin)}</span
                    >
                </div>
            </div>

            <!-- Timer Display -->
            <div
                class="flex flex-col items-center gap-2 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600"
            >
                <div class="flex justify-center">
                    <TimerDisplay size="medium" />
                </div>
                <div class="flex items-center gap-2">
                    <PlayButton size="medium" showReset={true} />
                </div>
            </div>
        </div>
    {/if}
</div>
