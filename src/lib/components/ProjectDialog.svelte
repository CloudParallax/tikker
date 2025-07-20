<!-- ProjectDialog.svelte -->
<!-- Dialog for adding/editing projects -->

<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import {
        X,
        Save,
        FolderOpen,
        Calendar,
        DollarSign,
        Clock,
    } from "lucide-svelte";

    import type { KimaiProject, KimaiCustomer } from "$lib/types/kimai.js";
    import { kimaiStore } from "$lib/stores/index.js";

    const dispatch = createEventDispatcher<{
        save: KimaiProject;
        cancel: void;
    }>();

    // Props
    export let project: KimaiProject | null = null;
    export let isOpen = false;

    // Form state
    let formData: Partial<KimaiProject> = {
        name: "",
        comment: "",
        orderNumber: "",
        orderDate: "",
        start: "",
        end: "",
        color: "",
        visible: true,
        budget: undefined,
        timeBudget: undefined,
        customer: 0,
    };

    // Loading and error states
    let isLoading = false;
    let error: string | null = null;

    // Computed values
    $: isEditing = !!project;
    $: title = isEditing ? "Edit Project" : "Add Project";
    $: selectedCustomer = kimaiStore.customers.find(
        (c) => c.id === formData.customer,
    );

    // Initialize form when project changes
    $: if (project) {
        formData = { ...project };
    } else {
        formData = {
            name: "",
            comment: "",
            orderNumber: "",
            orderDate: "",
            start: "",
            end: "",
            color: "",
            visible: true,
            budget: undefined,
            timeBudget: undefined,
            customer: 0,
        };
    }

    // Event handlers
    async function handleSave() {
        if (!formData.name?.trim()) {
            error = "Project name is required";
            return;
        }

        if (!formData.customer) {
            error = "Customer is required";
            return;
        }

        try {
            isLoading = true;
            error = null;

            let savedProject: KimaiProject;

            if (isEditing && project) {
                savedProject = await kimaiStore.updateProject(
                    project.id,
                    formData,
                );
            } else {
                savedProject = await kimaiStore.createProject(formData);
            }

            dispatch("save", savedProject);
            handleClose();
        } catch (err) {
            error =
                err instanceof Error ? err.message : "Failed to save project";
        } finally {
            isLoading = false;
        }
    }

    function handleCancel() {
        dispatch("cancel");
        handleClose();
    }

    function handleClose() {
        isOpen = false;
        error = null;
    }

    function handleKeydown(event: KeyboardEvent) {
        if (event.key === "Escape") {
            handleCancel();
        } else if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
            handleSave();
        }
    }

    function formatDate(dateString: string): string {
        if (!dateString) return "";
        return new Date(dateString).toISOString().split("T")[0];
    }
</script>

{#if isOpen}
    <!-- Backdrop -->
    <div class="dialog-backdrop" onclick={handleCancel} />

    <!-- Dialog -->
    <div
        class="dialog"
        role="dialog"
        aria-labelledby="dialog-title"
        on:keydown={handleKeydown}
    >
        <div class="dialog-header">
            <h2 id="dialog-title" class="dialog-title">
                <FolderOpen size={20} />
                {title}
            </h2>
            <button
                class="close-button"
                onclick={handleCancel}
                aria-label="Close"
            >
                <X size={20} />
            </button>
        </div>

        <div class="dialog-content">
            <!-- Error Display -->
            {#if error}
                <div class="error-message">
                    {error}
                </div>
            {/if}

            <!-- Form -->
            <form on:submit|preventDefault={handleSave} class="project-form">
                <!-- Basic Information -->
                <div class="form-section">
                    <h3>Basic Information</h3>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="name">Name *</label>
                            <input
                                id="name"
                                type="text"
                                bind:value={formData.name}
                                placeholder="Project name"
                                required
                                disabled={isLoading}
                            />
                        </div>

                        <div class="form-group">
                            <label for="customer">Customer *</label>
                            <select
                                id="customer"
                                bind:value={formData.customer}
                                required
                                disabled={isLoading ||
                                    kimaiStore.isLoading.customers}
                            >
                                <option value="">Select Customer</option>
                                {#each kimaiStore.customers as customer}
                                    <option value={customer.id}
                                        >{customer.name}</option
                                    >
                                {/each}
                            </select>
                            {#if kimaiStore.isLoading.customers}
                                <span class="loading">Loading customers...</span
                                >
                            {/if}
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="comment">Description</label>
                        <textarea
                            id="comment"
                            bind:value={formData.comment}
                            placeholder="Project description"
                            rows={3}
                            disabled={isLoading}
                        />
                    </div>
                </div>

                <!-- Order Information -->
                <div class="form-section">
                    <h3>Order Information</h3>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="orderNumber">Order Number</label>
                            <input
                                id="orderNumber"
                                type="text"
                                bind:value={formData.orderNumber}
                                placeholder="Order number"
                                disabled={isLoading}
                            />
                        </div>

                        <div class="form-group">
                            <label for="orderDate">Order Date</label>
                            <input
                                id="orderDate"
                                type="date"
                                value={formatDate(formData.orderDate || "")}
                                onchange={(e) =>
                                    (formData.orderDate = e.target.value)}
                                disabled={isLoading}
                            />
                        </div>
                    </div>
                </div>

                <!-- Project Timeline -->
                <div class="form-section">
                    <h3>Project Timeline</h3>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="start">Start Date</label>
                            <input
                                id="start"
                                type="date"
                                value={formatDate(formData.start || "")}
                                onchange={(e) =>
                                    (formData.start = e.target.value)}
                                disabled={isLoading}
                            />
                        </div>

                        <div class="form-group">
                            <label for="end">End Date</label>
                            <input
                                id="end"
                                type="date"
                                value={formatDate(formData.end || "")}
                                onchange={(e) =>
                                    (formData.end = e.target.value)}
                                disabled={isLoading}
                            />
                        </div>
                    </div>
                </div>

                <!-- Budget and Settings -->
                <div class="form-section">
                    <h3>Budget and Settings</h3>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="budget">Budget</label>
                            <div class="input-with-icon">
                                <DollarSign size={16} />
                                <input
                                    id="budget"
                                    type="number"
                                    bind:value={formData.budget}
                                    placeholder="0.00"
                                    step="0.01"
                                    min="0"
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        <div class="form-group">
                            <label for="timeBudget">Time Budget (hours)</label>
                            <div class="input-with-icon">
                                <Clock size={16} />
                                <input
                                    id="timeBudget"
                                    type="number"
                                    bind:value={formData.timeBudget}
                                    placeholder="0"
                                    step="0.5"
                                    min="0"
                                    disabled={isLoading}
                                />
                            </div>
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="color">Color</label>
                            <input
                                id="color"
                                type="color"
                                bind:value={formData.color}
                                disabled={isLoading}
                            />
                        </div>

                        <div class="form-group">
                            <label class="checkbox-label">
                                <input
                                    type="checkbox"
                                    bind:checked={formData.visible}
                                    disabled={isLoading}
                                />
                                Visible
                            </label>
                        </div>
                    </div>
                </div>
            </form>
        </div>

        <div class="dialog-footer">
            <button
                type="button"
                class="btn btn-secondary"
                onclick={handleCancel}
                disabled={isLoading}
            >
                Cancel
            </button>
            <button
                type="submit"
                class="btn btn-primary"
                onclick={handleSave}
                disabled={isLoading}
            >
                <Save size={16} />
                {isLoading ? "Saving..." : isEditing ? "Update" : "Create"}
            </button>
        </div>
    </div>
{/if}

<style>
    .dialog-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.5);
        z-index: 1000;
    }

    .dialog {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background-color: white;
        border-radius: 0.5rem;
        box-shadow:
            0 20px 25px -5px rgba(0, 0, 0, 0.1),
            0 10px 10px -5px rgba(0, 0, 0, 0.04);
        z-index: 1001;
        max-width: 90vw;
        max-height: 90vh;
        width: 600px;
        display: flex;
        flex-direction: column;
    }

    .dialog-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 1.5rem 1.5rem 0 1.5rem;
    }

    .dialog-title {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin: 0;
        font-size: 1.25rem;
        font-weight: 600;
        color: #1f2937;
    }

    .close-button {
        background: none;
        border: none;
        padding: 0.5rem;
        cursor: pointer;
        border-radius: 0.375rem;
        color: #6b7280;
        transition: all 0.2s;
    }

    .close-button:hover {
        background-color: #f3f4f6;
        color: #374151;
    }

    .dialog-content {
        flex: 1;
        overflow-y: auto;
        padding: 1rem 1.5rem;
    }

    .error-message {
        background-color: #fee2e2;
        border: 1px solid #fecaca;
        color: #dc2626;
        padding: 0.75rem;
        border-radius: 0.375rem;
        margin-bottom: 1rem;
        font-size: 0.875rem;
    }

    .project-form {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }

    .form-section {
        border: 1px solid #e5e7eb;
        border-radius: 0.375rem;
        padding: 1rem;
    }

    .form-section h3 {
        margin: 0 0 1rem 0;
        font-size: 1rem;
        font-weight: 600;
        color: #374151;
    }

    .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
    }

    .form-group {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .form-group label {
        font-size: 0.875rem;
        font-weight: 500;
        color: #374151;
    }

    .form-group input,
    .form-group textarea,
    .form-group select {
        padding: 0.5rem;
        border: 1px solid #d1d5db;
        border-radius: 0.375rem;
        font-size: 0.875rem;
        transition: border-color 0.2s;
    }

    .form-group input:focus,
    .form-group textarea:focus,
    .form-group select:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .form-group input:disabled,
    .form-group textarea:disabled,
    .form-group select:disabled {
        background-color: #f3f4f6;
        color: #9ca3af;
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

    .checkbox-label {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        cursor: pointer;
    }

    .checkbox-label input[type="checkbox"] {
        width: auto;
        margin: 0;
    }

    .loading {
        font-size: 0.75rem;
        color: #6b7280;
        font-style: italic;
    }

    .dialog-footer {
        display: flex;
        justify-content: flex-end;
        gap: 0.75rem;
        padding: 1rem 1.5rem 1.5rem 1.5rem;
        border-top: 1px solid #e5e7eb;
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

    .btn-secondary {
        background-color: #f3f4f6;
        color: #374151;
    }

    .btn-secondary:hover:not(:disabled) {
        background-color: #e5e7eb;
    }

    .btn-primary {
        background-color: #3b82f6;
        color: white;
    }

    .btn-primary:hover:not(:disabled) {
        background-color: #2563eb;
    }

    @media (max-width: 640px) {
        .dialog {
            width: 95vw;
            max-height: 95vh;
        }

        .form-row {
            grid-template-columns: 1fr;
        }

        .dialog-header,
        .dialog-content,
        .dialog-footer {
            padding-left: 1rem;
            padding-right: 1rem;
        }
    }
</style>
