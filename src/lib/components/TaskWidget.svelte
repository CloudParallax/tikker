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
    } from "$lib/stores/index.js";

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
                task.customer?.name
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

    let canStart = $derived(
        selectedTask && selectedTask.status === "open" && !isStarting,
    );
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
    $inspect(kimaiStore.isConnected);
    $inspect(kimaiStore.isConnecting);
    $inspect(filteredTasks);
    $inspect(tasks);

    // Event handlers
    async function loadTasks() {
        try {
            isLoading = true;
            error = null;
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
                customer: updatedTask.customer.id,
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
                return "var(--danger-color)";
            case "high":
                return "var(--warning-color)";
            case "medium":
                return "var(--primary-color)";
            case "low":
                return "var(--success-color)";
            default:
                return "var(--text-color)";
        }
    }

    function getStatusColor(status: string): string {
        switch (status) {
            case "open":
                return "var(--success-color)";
            case "closed":
                return "var(--text-muted)";
            default:
                return "var(--text-color)";
        }
    }

    function formatDateTime(dateString: string): string {
        return format(new Date(dateString), "MMM dd, yyyy HH:mm");
    }
</script>

<div class="task-widget">
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

    <!-- Header -->
    <div class="header">
        <h2>Task Management</h2>
        <button
            class="btn btn-refresh"
            onclick={loadTasks}
            disabled={isLoading}
            title="Refresh Tasks"
        >
            <RefreshCw size={16} class={isLoading ? "spinning" : ""} />
        </button>
    </div>

    <!-- Filters -->
    <div class="filters">
        <div class="search-group">
            <Search size={16} />
            <input
                type="text"
                placeholder="Search tasks..."
                value={searchTerm}
                oninput={handleSearchChange}
                disabled={isLoading}
            />
        </div>

        <div class="filter-group">
            <Filter size={16} />
            <select
                value={statusFilter}
                onchange={handleStatusFilterChange}
                disabled={isLoading}
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
    <div class="task-list">
        {#if isLoading}
            <div class="loading">Loading tasks...</div>
        {:else if filteredTasks.length === 0}
            <div class="empty-state">
                <p>No tasks found</p>
                {#if searchTerm || statusFilter !== "all" || priorityFilter !== "all"}
                    <button
                        onclick={() => {
                            searchTerm = "";
                            statusFilter = "all";
                            priorityFilter = "all";
                        }}
                        class="btn btn-clear"
                    >
                        Clear Filters
                    </button>
                {/if}
            </div>
        {:else}
            {#each filteredTasks as task (task.id)}
                <div
                    class="task-item {selectedTask?.id === task.id
                        ? 'selected'
                        : ''} {task.status === 'closed' ? 'closed' : ''}"
                    onclick={() => handleTaskSelect(task)}
                >
                    <div class="task-header">
                        <div class="task-title">
                            {#if task.priority}
                                {@const PriorityIcon = getPriorityIcon(
                                    task.priority,
                                )}
                                <PriorityIcon
                                    size={16}
                                    style="color: {getPriorityColor(
                                        task.priority,
                                    )}"
                                />
                            {/if}
                            <span>{task.title}</span>
                        </div>
                        <div
                            class="task-status"
                            style="color: {getStatusColor(task.status)}"
                        >
                            {task.status}
                        </div>
                    </div>

                    {#if task.description}
                        <div class="task-description">{task.description}</div>
                    {/if}

                    <div class="task-meta">
                        <div class="task-customer">
                            <Building size={12} />
                            {task.project.customer.name}
                        </div>
                        <div class="task-project">
                            <FolderOpen size={12} />
                            {task.project.name}
                        </div>
                        <div class="task-activity">
                            <Activity size={12} />
                            {task.activity.name}
                        </div>
                    </div>

                    {#if task.dueDate}
                        <div class="task-due">
                            <Clock size={12} />
                            Due: {formatDateTime(task.dueDate)}
                        </div>
                    {/if}
                </div>
            {/each}
        {/if}
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
                {isStopping ? "Stopping..." : "Stop Task"}
            </button>
        {:else}
            <button
                class="btn btn-start"
                onclick={handleStart}
                disabled={!canStart || isStarting}
            >
                <Play size={16} />
                {isStarting ? "Starting..." : "Start Task"}
            </button>
        {/if}

        {#if selectedTask && selectedTask.status === "open"}
            <button
                class="btn btn-close"
                onclick={handleClose}
                disabled={isRunning}
            >
                <CheckCircle size={16} />
                Close Task
            </button>
        {/if}
    </div>

    <!-- Current Task Display -->
    {#if isRunning && sessionStore.currentTask}
        <div class="current-task">
            <h3>Currently Working On</h3>
            <div class="task-info">
                <div class="task-item">
                    <strong>Task:</strong>
                    {sessionStore.currentTask.title}
                </div>
                {#if sessionStore.currentTask.description}
                    <div class="task-item">
                        <strong>Description:</strong>
                        {sessionStore.currentTask.description}
                    </div>
                {/if}
                <div class="task-item">
                    <strong>Started:</strong>
                    {formatDateTime(sessionStore.currentTask.begin)}
                </div>
            </div>
        </div>
    {/if}
</div>

<style>
    .task-widget {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        padding: 1rem;
        max-width: 800px;
        margin: 0 auto;
    }

    .error-message {
        background: var(--danger-color);
        color: white;
        padding: 0.75rem;
        border-radius: 0.5rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .error-close {
        background: none;
        border: none;
        color: white;
        font-size: 1.2rem;
        cursor: pointer;
    }

    .connection-status {
        text-align: center;
        font-size: 0.875rem;
    }

    .status {
        padding: 0.25rem 0.5rem;
        border-radius: 0.25rem;
        font-weight: 500;
    }

    .status.connected {
        background: var(--success-color);
        color: white;
    }

    .status.connecting {
        background: var(--warning-color);
        color: white;
    }

    .status.disconnected {
        background: var(--danger-color);
        color: white;
    }

    .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
    }

    .header h2 {
        margin: 0;
        color: var(--text-color);
    }

    .btn-refresh {
        background: var(--primary-color);
        color: white;
        border: none;
        padding: 0.5rem;
        border-radius: 0.5rem;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .btn-refresh:hover {
        background: var(--primary-hover);
    }

    .btn-refresh:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .spinning {
        animation: spin 1s linear infinite;
    }

    @keyframes spin {
        from {
            transform: rotate(0deg);
        }
        to {
            transform: rotate(360deg);
        }
    }

    .filters {
        display: flex;
        gap: 1rem;
        flex-wrap: wrap;
    }

    .search-group {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        flex: 1;
        min-width: 200px;
    }

    .search-group input {
        flex: 1;
        padding: 0.5rem;
        border: 1px solid var(--border-color);
        border-radius: 0.5rem;
        background: var(--bg-color);
        color: var(--text-color);
    }

    .filter-group {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .filter-group select {
        padding: 0.5rem;
        border: 1px solid var(--border-color);
        border-radius: 0.5rem;
        background: var(--bg-color);
        color: var(--text-color);
    }

    .task-list {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        max-height: 400px;
        overflow-y: auto;
    }

    .task-item {
        padding: 1rem;
        border: 1px solid var(--border-color);
        border-radius: 0.5rem;
        background: var(--bg-color);
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .task-item:hover {
        border-color: var(--primary-color);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .task-item.selected {
        border-color: var(--primary-color);
        background: var(--primary-bg);
    }

    .task-item.closed {
        opacity: 0.6;
    }

    .task-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.5rem;
    }

    .task-title {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-weight: 600;
        color: var(--text-color);
    }

    .task-status {
        font-size: 0.875rem;
        font-weight: 500;
        text-transform: uppercase;
    }

    .task-description {
        color: var(--text-muted);
        margin-bottom: 0.75rem;
        font-size: 0.875rem;
    }

    .task-meta {
        display: flex;
        gap: 1rem;
        margin-bottom: 0.5rem;
        font-size: 0.75rem;
        color: var(--text-muted);
    }

    .task-meta > div {
        display: flex;
        align-items: center;
        gap: 0.25rem;
    }

    .task-due {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        font-size: 0.75rem;
        color: var(--warning-color);
    }

    .action-buttons {
        display: flex;
        gap: 0.5rem;
        justify-content: center;
    }

    .btn {
        padding: 0.75rem 1rem;
        border: none;
        border-radius: 0.5rem;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-weight: 500;
        transition: all 0.2s ease;
    }

    .btn-start {
        background: var(--success-color);
        color: white;
    }

    .btn-start:hover:not(:disabled) {
        background: var(--success-hover);
    }

    .btn-stop {
        background: var(--danger-color);
        color: white;
    }

    .btn-stop:hover:not(:disabled) {
        background: var(--danger-hover);
    }

    .btn-close {
        background: var(--warning-color);
        color: white;
    }

    .btn-close:hover:not(:disabled) {
        background: var(--warning-hover);
    }

    .btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .current-task {
        margin-top: 1rem;
        padding: 1rem;
        border: 1px solid var(--success-color);
        border-radius: 0.5rem;
        background: var(--success-bg);
    }

    .current-task h3 {
        margin: 0 0 0.75rem 0;
        color: var(--success-color);
    }

    .task-info {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .task-info .task-item {
        display: flex;
        gap: 0.5rem;
        padding: 0;
        border: none;
        background: none;
        cursor: default;
    }

    .task-info .task-item strong {
        min-width: 80px;
    }

    .loading {
        text-align: center;
        padding: 2rem;
        color: var(--text-muted);
    }

    .empty-state {
        text-align: center;
        padding: 2rem;
        color: var(--text-muted);
    }

    .btn-clear {
        background: var(--primary-color);
        color: white;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 0.5rem;
        cursor: pointer;
        margin-top: 0.5rem;
    }

    .btn-clear:hover {
        background: var(--primary-hover);
    }
</style>
