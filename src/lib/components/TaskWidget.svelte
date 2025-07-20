<!-- TaskWidget.svelte -->
<!-- Task management interface component -->

<script lang="ts">
    import { onMount } from "svelte";
    import { format } from "date-fns";
    import {
        Plus,
        Filter,
        Search,
        Clock,
        CheckCircle,
        Circle,
        AlertTriangle,
        Calendar,
        User,
        Activity,
        FolderOpen,
        Building,
    } from "lucide-svelte";

    import type {
        KimaiTask,
        KimaiCustomer,
        KimaiProject,
        KimaiActivity,
    } from "$lib/types/kimai.js";
    import { kimaiStore } from "$lib/stores/index.js";

    // Component state
    let tasks: KimaiTask[] = [];
    let filteredTasks: KimaiTask[] = [];
    let isLoading = false;
    let error: string | null = null;

    // Filter state
    let searchTerm = "";
    let statusFilter: "all" | "open" | "closed" = "all";
    let priorityFilter: "all" | "low" | "medium" | "high" | "urgent" = "all";
    let customerFilter = 0;
    let projectFilter = 0;
    let activityFilter = 0;

    // Sort state
    let sortBy:
        | "title"
        | "priority"
        | "dueDate"
        | "estimatedDuration"
        | "actualDuration" = "title";
    let sortOrder: "asc" | "desc" = "asc";

    // Computed values
    $: availableCustomers = kimaiStore.customers;
    $: availableProjects = customerFilter
        ? kimaiStore.getProjectsByCustomer(customerFilter)
        : kimaiStore.projects;
    $: availableActivities = projectFilter
        ? kimaiStore.getActivitiesByProject(projectFilter)
        : kimaiStore.activities;

    // Apply filters and sorting
    $: filteredTasks = tasks
        .filter((task) => {
            // Search filter
            if (
                searchTerm &&
                !task.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
                !task.description
                    ?.toLowerCase()
                    .includes(searchTerm.toLowerCase())
            ) {
                return false;
            }

            // Status filter
            if (statusFilter !== "all" && task.status !== statusFilter) {
                return false;
            }

            // Priority filter
            if (priorityFilter !== "all" && task.priority !== priorityFilter) {
                return false;
            }

            // Customer filter
            if (customerFilter && task.customer !== customerFilter) {
                return false;
            }

            // Project filter
            if (projectFilter && task.project !== projectFilter) {
                return false;
            }

            // Activity filter
            if (activityFilter && task.activity !== activityFilter) {
                return false;
            }

            return true;
        })
        .sort((a, b) => {
            let aValue: any;
            let bValue: any;

            switch (sortBy) {
                case "title":
                    aValue = a.title.toLowerCase();
                    bValue = b.title.toLowerCase();
                    break;
                case "priority":
                    const priorityOrder = {
                        low: 1,
                        medium: 2,
                        high: 3,
                        urgent: 4,
                    };
                    aValue =
                        priorityOrder[a.priority as keyof typeof priorityOrder];
                    bValue =
                        priorityOrder[b.priority as keyof typeof priorityOrder];
                    break;
                case "dueDate":
                    aValue = a.dueDate ? new Date(a.dueDate).getTime() : 0;
                    bValue = b.dueDate ? new Date(b.dueDate).getTime() : 0;
                    break;
                case "estimatedDuration":
                    aValue = a.estimatedDuration || 0;
                    bValue = b.estimatedDuration || 0;
                    break;
                case "actualDuration":
                    aValue = a.actualDuration || 0;
                    bValue = b.actualDuration || 0;
                    break;
                default:
                    return 0;
            }

            if (sortOrder === "asc") {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });

    // Initialize component
    onMount(async () => {
        await loadTasks();
    });

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

    function handleSort(field: typeof sortBy) {
        if (sortBy === field) {
            sortOrder = sortOrder === "asc" ? "desc" : "asc";
        } else {
            sortBy = field;
            sortOrder = "asc";
        }
    }

    function clearFilters() {
        searchTerm = "";
        statusFilter = "all";
        priorityFilter = "all";
        customerFilter = 0;
        projectFilter = 0;
        activityFilter = 0;
    }

    function formatDuration(minutes: number): string {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins}m`;
    }

    function formatDate(dateString: string): string {
        return format(new Date(dateString), "MMM dd, yyyy");
    }

    function getPriorityIcon(priority: string) {
        switch (priority) {
            case "urgent":
                return AlertTriangle;
            case "high":
                return AlertTriangle;
            case "medium":
                return Circle;
            case "low":
                return Circle;
            default:
                return Circle;
        }
    }

    function getPriorityColor(priority: string): string {
        switch (priority) {
            case "urgent":
                return "#dc2626";
            case "high":
                return "#ea580c";
            case "medium":
                return "#d97706";
            case "low":
                return "#059669";
            default:
                return "#6b7280";
        }
    }

    function getStatusIcon(status: string) {
        return status === "closed" ? CheckCircle : Circle;
    }

    function getStatusColor(status: string): string {
        return status === "closed" ? "#059669" : "#6b7280";
    }

    function isOverdue(task: KimaiTask): boolean {
        if (!task.dueDate || task.status === "closed") return false;
        return new Date(task.dueDate) < new Date();
    }
</script>

<div class="task-widget">
    <!-- Header -->
    <div class="widget-header">
        <h2>Tasks</h2>
        <div class="header-actions">
            <button class="btn btn-primary" on:click={() => {}}>
                <Plus size={16} />
                Add Task
            </button>
            <button
                class="btn btn-secondary"
                on:click={loadTasks}
                disabled={isLoading}
            >
                Refresh
            </button>
        </div>
    </div>

    <!-- Error Display -->
    {#if error}
        <div class="error-message">
            {error}
            <button on:click={() => (error = null)} class="error-close"
                >×</button
            >
        </div>
    {/if}

    <!-- Filters -->
    <div class="filters-section">
        <div class="filters-header">
            <h3>
                <Filter size={16} />
                Filters
            </h3>
            <button class="btn-link" on:click={clearFilters}>Clear All</button>
        </div>

        <div class="filters-grid">
            <!-- Search -->
            <div class="filter-group">
                <label for="search">Search</label>
                <div class="input-with-icon">
                    <Search size={16} />
                    <input
                        id="search"
                        type="text"
                        bind:value={searchTerm}
                        placeholder="Search tasks..."
                    />
                </div>
            </div>

            <!-- Status Filter -->
            <div class="filter-group">
                <label for="status-filter">Status</label>
                <select id="status-filter" bind:value={statusFilter}>
                    <option value="all">All Status</option>
                    <option value="open">Open</option>
                    <option value="closed">Closed</option>
                </select>
            </div>

            <!-- Priority Filter -->
            <div class="filter-group">
                <label for="priority-filter">Priority</label>
                <select id="priority-filter" bind:value={priorityFilter}>
                    <option value="all">All Priorities</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                </select>
            </div>

            <!-- Customer Filter -->
            <div class="filter-group">
                <label for="customer-filter">Customer</label>
                <select id="customer-filter" bind:value={customerFilter}>
                    <option value={0}>All Customers</option>
                    {#each availableCustomers as customer}
                        <option value={customer.id}>{customer.name}</option>
                    {/each}
                </select>
            </div>

            <!-- Project Filter -->
            <div class="filter-group">
                <label for="project-filter">Project</label>
                <select id="project-filter" bind:value={projectFilter}>
                    <option value={0}>All Projects</option>
                    {#each availableProjects as project}
                        <option value={project.id}>{project.name}</option>
                    {/each}
                </select>
            </div>

            <!-- Activity Filter -->
            <div class="filter-group">
                <label for="activity-filter">Activity</label>
                <select id="activity-filter" bind:value={activityFilter}>
                    <option value={0}>All Activities</option>
                    {#each availableActivities as activity}
                        <option value={activity.id}>{activity.name}</option>
                    {/each}
                </select>
            </div>
        </div>
    </div>

    <!-- Task List -->
    <div class="task-list-section">
        <div class="list-header">
            <h3>Tasks ({filteredTasks.length})</h3>
            {#if isLoading}
                <span class="loading">Loading...</span>
            {/if}
        </div>

        {#if filteredTasks.length > 0}
            <div class="task-list">
                <div class="task-list-header">
                    <button
                        class="sort-button"
                        on:click={() => handleSort("title")}
                    >
                        Title
                        {#if sortBy === "title"}
                            <span class="sort-indicator"
                                >{sortOrder === "asc" ? "↑" : "↓"}</span
                            >
                        {/if}
                    </button>
                    <button
                        class="sort-button"
                        on:click={() => handleSort("priority")}
                    >
                        Priority
                        {#if sortBy === "priority"}
                            <span class="sort-indicator"
                                >{sortOrder === "asc" ? "↑" : "↓"}</span
                            >
                        {/if}
                    </button>
                    <button
                        class="sort-button"
                        on:click={() => handleSort("dueDate")}
                    >
                        Due Date
                        {#if sortBy === "dueDate"}
                            <span class="sort-indicator"
                                >{sortOrder === "asc" ? "↑" : "↓"}</span
                            >
                        {/if}
                    </button>
                    <button
                        class="sort-button"
                        on:click={() => handleSort("estimatedDuration")}
                    >
                        Estimated
                        {#if sortBy === "estimatedDuration"}
                            <span class="sort-indicator"
                                >{sortOrder === "asc" ? "↑" : "↓"}</span
                            >
                        {/if}
                    </button>
                    <button
                        class="sort-button"
                        on:click={() => handleSort("actualDuration")}
                    >
                        Actual
                        {#if sortBy === "actualDuration"}
                            <span class="sort-indicator"
                                >{sortOrder === "asc" ? "↑" : "↓"}</span
                            >
                        {/if}
                    </button>
                    <div class="actions-header">Actions</div>
                </div>

                {#each filteredTasks as task}
                    <div class="task-item" class:overdue={isOverdue(task)}>
                        <div class="task-status">
                            <svelte:component
                                this={getStatusIcon(task.status)}
                                size={16}
                                color={getStatusColor(task.status)}
                            />
                        </div>

                        <div class="task-title">
                            <h4>{task.title}</h4>
                            {#if task.description}
                                <p class="task-description">
                                    {task.description}
                                </p>
                            {/if}
                        </div>

                        <div class="task-priority">
                            <svelte:component
                                this={getPriorityIcon(task.priority)}
                                size={16}
                                color={getPriorityColor(task.priority)}
                            />
                            <span class="priority-text">{task.priority}</span>
                        </div>

                        <div class="task-due-date">
                            {#if task.dueDate}
                                <Calendar size={14} />
                                <span class:overdue={isOverdue(task)}
                                    >{formatDate(task.dueDate)}</span
                                >
                            {:else}
                                <span class="no-date">No due date</span>
                            {/if}
                        </div>

                        <div class="task-duration">
                            <Clock size={14} />
                            <span>{formatDuration(task.actualDuration)}</span>
                            {#if task.estimatedDuration}
                                <span class="estimated"
                                    >/ {formatDuration(
                                        task.estimatedDuration,
                                    )}</span
                                >
                            {/if}
                        </div>

                        <div class="task-actions">
                            <button class="btn-icon" title="Edit task">
                                Edit
                            </button>
                            <button class="btn-icon" title="Delete task">
                                Delete
                            </button>
                        </div>
                    </div>
                {/each}
            </div>
        {:else}
            <div class="empty-state">
                <Activity size={48} />
                <p>{isLoading ? "Loading tasks..." : "No tasks found"}</p>
                {#if !isLoading && tasks.length === 0}
                    <button class="btn btn-primary" on:click={() => {}}>
                        <Plus size={16} />
                        Create your first task
                    </button>
                {/if}
            </div>
        {/if}
    </div>
</div>

<style>
    .task-widget {
        padding: 1rem;
        max-width: 1200px;
        margin: 0 auto;
    }

    .widget-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
    }

    .widget-header h2 {
        margin: 0;
        color: #1f2937;
        font-size: 1.5rem;
        font-weight: 600;
    }

    .header-actions {
        display: flex;
        gap: 0.75rem;
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

    .filters-section {
        background-color: #f9fafb;
        border: 1px solid #e5e7eb;
        border-radius: 0.5rem;
        padding: 1rem;
        margin-bottom: 1.5rem;
    }

    .filters-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
    }

    .filters-header h3 {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin: 0;
        font-size: 1rem;
        font-weight: 600;
        color: #374151;
    }

    .btn-link {
        background: none;
        border: none;
        color: #3b82f6;
        font-size: 0.875rem;
        cursor: pointer;
        text-decoration: underline;
    }

    .filters-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
    }

    .filter-group {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .filter-group label {
        font-size: 0.875rem;
        font-weight: 500;
        color: #374151;
    }

    .input-with-icon {
        position: relative;
        display: flex;
        align-items: center;
    }

    .input-with-icon svg {
        position: absolute;
        left: 0.75rem;
        color: #6b7280;
        z-index: 1;
    }

    .input-with-icon input {
        padding-left: 2.5rem;
    }

    input,
    select {
        padding: 0.5rem;
        border: 1px solid #d1d5db;
        border-radius: 0.375rem;
        font-size: 0.875rem;
        background-color: white;
    }

    input:focus,
    select:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .task-list-section {
        background-color: white;
        border: 1px solid #e5e7eb;
        border-radius: 0.5rem;
        overflow: hidden;
    }

    .list-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem;
        border-bottom: 1px solid #e5e7eb;
    }

    .list-header h3 {
        margin: 0;
        font-size: 1rem;
        font-weight: 600;
        color: #374151;
    }

    .loading {
        font-size: 0.875rem;
        color: #6b7280;
        font-style: italic;
    }

    .task-list {
        max-height: 600px;
        overflow-y: auto;
    }

    .task-list-header {
        display: grid;
        grid-template-columns: 40px 2fr 1fr 1fr 1fr 80px;
        gap: 1rem;
        padding: 0.75rem 1rem;
        background-color: #f9fafb;
        border-bottom: 1px solid #e5e7eb;
        font-size: 0.875rem;
        font-weight: 500;
        color: #374151;
    }

    .sort-button {
        background: none;
        border: none;
        padding: 0;
        font-size: 0.875rem;
        font-weight: 500;
        color: #374151;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 0.25rem;
    }

    .sort-button:hover {
        color: #1f2937;
    }

    .sort-indicator {
        font-size: 0.75rem;
    }

    .task-item {
        display: grid;
        grid-template-columns: 40px 2fr 1fr 1fr 1fr 80px;
        gap: 1rem;
        padding: 1rem;
        border-bottom: 1px solid #f3f4f6;
        align-items: center;
        transition: background-color 0.2s;
    }

    .task-item:hover {
        background-color: #f9fafb;
    }

    .task-item.overdue {
        background-color: #fef2f2;
    }

    .task-status {
        display: flex;
        justify-content: center;
    }

    .task-title h4 {
        margin: 0 0 0.25rem 0;
        font-size: 0.875rem;
        font-weight: 500;
        color: #1f2937;
    }

    .task-description {
        margin: 0;
        font-size: 0.75rem;
        color: #6b7280;
        line-height: 1.4;
    }

    .task-priority {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.875rem;
    }

    .priority-text {
        text-transform: capitalize;
    }

    .task-due-date {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.875rem;
    }

    .task-due-date .overdue {
        color: #dc2626;
        font-weight: 500;
    }

    .no-date {
        color: #9ca3af;
        font-style: italic;
    }

    .task-duration {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.875rem;
    }

    .estimated {
        color: #6b7280;
    }

    .task-actions {
        display: flex;
        gap: 0.5rem;
    }

    .btn-icon {
        background: none;
        border: none;
        padding: 0.25rem 0.5rem;
        font-size: 0.75rem;
        color: #3b82f6;
        cursor: pointer;
        border-radius: 0.25rem;
        transition: background-color 0.2s;
    }

    .btn-icon:hover {
        background-color: #eff6ff;
    }

    .empty-state {
        text-align: center;
        padding: 3rem 1rem;
        color: #9ca3af;
    }

    .empty-state p {
        margin: 0.5rem 0 1rem 0;
        font-size: 0.875rem;
    }

    .btn {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 1rem;
        border: none;
        border-radius: 0.375rem;
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
    }

    .btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .btn-primary {
        background-color: #3b82f6;
        color: white;
    }

    .btn-primary:hover:not(:disabled) {
        background-color: #2563eb;
    }

    .btn-secondary {
        background-color: #f3f4f6;
        color: #374151;
    }

    .btn-secondary:hover:not(:disabled) {
        background-color: #e5e7eb;
    }

    @media (max-width: 768px) {
        .widget-header {
            flex-direction: column;
            gap: 1rem;
            align-items: stretch;
        }

        .header-actions {
            justify-content: center;
        }

        .filters-grid {
            grid-template-columns: 1fr;
        }

        .task-list-header,
        .task-item {
            grid-template-columns: 1fr;
            gap: 0.5rem;
        }

        .task-list-header {
            display: none;
        }

        .task-item {
            padding: 1rem;
            border: 1px solid #e5e7eb;
            border-radius: 0.375rem;
            margin-bottom: 0.5rem;
        }

        .task-status,
        .task-priority,
        .task-due-date,
        .task-duration {
            justify-content: flex-start;
        }

        .task-actions {
            justify-content: flex-end;
        }
    }
</style>
