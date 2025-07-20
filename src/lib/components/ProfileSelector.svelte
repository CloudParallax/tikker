<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { settingsStore } from "$lib/stores/index.js";
    import type { KimaiProfile } from "$lib/types/kimai.js";
    import { User, Plus, Settings, Check } from "lucide-svelte";

    const dispatch = createEventDispatcher<{
        select: KimaiProfile;
        add: void;
        edit: KimaiProfile;
        delete: string;
    }>();

    let showDropdown = $state(false);
    let showAddForm = $state(false);
    let showEditForm = $state(false);
    let editingProfile: KimaiProfile | null = $state(null);

    // Form data for adding/editing profiles
    let profileForm = $state({
        name: "",
        auth: {
            type: "api_token" as const,
            username: "",
            apiToken: "",
            baseUrl: "",
        },
        autoConnect: true,
    } as Omit<KimaiProfile, "id">);

    // Get current profile and all profiles
    let currentProfile = $derived(settingsStore.currentProfile);
    let profiles = $derived(settingsStore.profiles);

    function toggleDropdown(event: MouseEvent) {
        event.stopPropagation();
        showDropdown = !showDropdown;
    }

    function selectProfile(profile: KimaiProfile) {
        settingsStore.setCurrentProfile(profile.id);
        dispatch("select", profile);
        showDropdown = false;
    }

    function addProfile() {
        profileForm = {
            name: "",
            auth: {
                type: "api_token" as const,
                username: "",
                apiToken: "",
                baseUrl: "",
            },
            autoConnect: true,
        };
        showAddForm = true;
        showDropdown = false;
    }

    function editProfile(profile: KimaiProfile) {
        editingProfile = profile;
        profileForm = {
            name: profile.name,
            auth: { ...profile.auth },
            autoConnect: profile.autoConnect,
        };
        showEditForm = true;
        showDropdown = false;
    }

    function deleteProfile(id: string) {
        if (confirm("Are you sure you want to delete this profile?")) {
            settingsStore.deleteProfile(id);
            dispatch("delete", id);
        }
    }

    function saveProfile() {
        console.log("saveProfile function called");
        console.log("Saving profile:", profileForm);

        // Validate required fields
        if (!profileForm.name.trim()) {
            console.log("Profile name validation failed");
            alert("Profile name is required");
            return;
        }

        if (!profileForm.auth.baseUrl.trim()) {
            console.log("Server URL validation failed");
            alert("Server URL is required");
            return;
        }

        if (!profileForm.auth.username?.trim()) {
            console.log("Username validation failed");
            alert("Username is required");
            return;
        }

        if (!profileForm.auth.apiToken?.trim()) {
            console.log("API Token validation failed");
            alert("API Token is required");
            return;
        }

        console.log("All validations passed, attempting to save...");

        try {
            if (editingProfile) {
                console.log("Updating existing profile");
                settingsStore.updateProfile(editingProfile.id, profileForm);
                dispatch("edit", { ...editingProfile, ...profileForm });
            } else {
                console.log("Adding new profile");
                const newProfile = settingsStore.addProfile(profileForm);
                console.log("New profile created:", newProfile);
                dispatch("select", newProfile);
            }

            console.log("Profile saved successfully, closing modal");
            showAddForm = false;
            showEditForm = false;
            editingProfile = null;
        } catch (error) {
            console.error("Failed to save profile:", error);
            alert("Failed to save profile. Please try again.");
        }
    }

    function cancelForm() {
        showAddForm = false;
        showEditForm = false;
        editingProfile = null;
    }

    // Close dropdown when clicking outside
    function handleClickOutside(event: MouseEvent) {
        const target = event.target as HTMLElement;
        if (!target.closest(".profile-selector")) {
            showDropdown = false;
        }
    }
</script>

<svelte:window onclick={handleClickOutside} />

<div class="profile-selector">
    <!-- Current Profile Display -->
    <button class="profile-display" onclick={toggleDropdown}>
        <div class="profile-info">
            {#if currentProfile}
                <div class="profile-name">{currentProfile.name}</div>
                <div class="profile-url">{currentProfile.auth.baseUrl}</div>
            {:else}
                <div class="profile-name">No Profile Selected</div>
                <div class="profile-url">Click to select a profile</div>
            {/if}
        </div>
        <User size={16} />
    </button>

    <!-- Quick Add Profile Button (when no profile selected) -->
    {#if !currentProfile}
        <button class="quick-add-btn" onclick={addProfile}>
            <Plus size={16} />
            Add Profile
        </button>
    {/if}

    <!-- Dropdown Menu -->
    {#if showDropdown}
        <div class="dropdown-menu">
            <div class="dropdown-header">
                <h4>Profiles</h4>
                <button class="btn btn-sm btn-primary" onclick={addProfile}>
                    <Plus size={14} />
                    Add Profile
                </button>
            </div>

            <div class="profile-list">
                {#each profiles as profile}
                    <div
                        class="profile-item {currentProfile?.id === profile.id
                            ? 'active'
                            : ''}"
                    >
                        <div
                            class="profile-details"
                            role="button"
                            tabindex="0"
                            onclick={() => selectProfile(profile)}
                            onkeydown={(e) =>
                                e.key === "Enter" && selectProfile(profile)}
                        >
                            <div class="profile-name">{profile.name}</div>
                            <div class="profile-url">
                                {profile.auth.baseUrl}
                            </div>
                            <div class="profile-user">
                                {profile.auth.username}
                            </div>
                        </div>
                        <div class="profile-actions">
                            {#if currentProfile?.id === profile.id}
                                <Check size={14} class="active-indicator" />
                            {/if}
                            <button
                                class="btn btn-sm btn-secondary"
                                onclick={() => editProfile(profile)}
                            >
                                <Settings size={14} />
                            </button>
                            {#if profiles.length > 1}
                                <button
                                    class="btn btn-sm btn-danger"
                                    onclick={() => deleteProfile(profile.id)}
                                >
                                    Delete
                                </button>
                            {/if}
                        </div>
                    </div>
                {/each}
            </div>

            {#if profiles.length === 0}
                <div class="empty-state">
                    <User size={32} />
                    <p>No profiles configured</p>
                    <button class="btn btn-primary" onclick={addProfile}>
                        <Plus size={16} />
                        Add Your First Profile
                    </button>
                </div>
            {/if}
        </div>
    {/if}

    <!-- Add Profile Modal -->
    {#if showAddForm}
        <div class="modal-overlay" onclick={cancelForm}>
            <div class="modal-content" onclick={(e) => e.stopPropagation()}>
                <div class="modal-header">
                    <h3>Add Profile</h3>
                    <button class="close-btn" onclick={cancelForm}> × </button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label for="profileName">Profile Name</label>
                        <input
                            type="text"
                            id="profileName"
                            bind:value={profileForm.name}
                            placeholder="My Kimai Server"
                        />
                    </div>
                    <div class="form-group">
                        <label for="profileUrl">Server URL</label>
                        <input
                            type="url"
                            id="profileUrl"
                            bind:value={profileForm.auth.baseUrl}
                            placeholder="https://kimai.example.com"
                        />
                    </div>
                    <div class="form-group">
                        <label for="profileUsername">Username</label>
                        <input
                            type="text"
                            id="profileUsername"
                            bind:value={profileForm.auth.username}
                            placeholder="username"
                        />
                    </div>
                    <div class="form-group">
                        <label for="profileApiToken">API Token</label>
                        <input
                            type="password"
                            id="profileApiToken"
                            bind:value={profileForm.auth.apiToken}
                            placeholder="API token"
                        />
                    </div>
                    <div class="form-group">
                        <label class="checkbox-label">
                            <input
                                type="radio"
                                bind:group={profileForm.auth.type}
                                value="api_token"
                            />
                            Use API token authentication
                        </label>
                        <label class="checkbox-label">
                            <input
                                type="radio"
                                bind:group={profileForm.auth.type}
                                value="legacy"
                            />
                            Use legacy authentication
                        </label>
                    </div>
                    <div class="form-group">
                        <label class="checkbox-label">
                            <input
                                type="checkbox"
                                bind:checked={profileForm.autoConnect}
                            />
                            Auto-connect on startup
                        </label>
                    </div>
                </div>
                <div class="modal-actions">
                    <button class="btn btn-secondary" onclick={cancelForm}
                        >Cancel</button
                    >
                    <button
                        class="btn btn-primary"
                        onclick={() => {
                            console.log("Add Profile button clicked");
                            saveProfile();
                        }}
                        type="button">Add Profile</button
                    >
                </div>
            </div>
        </div>
    {/if}

    <!-- Edit Profile Modal -->
    {#if showEditForm}
        <div class="modal-overlay" onclick={cancelForm}>
            <div class="modal-content" onclick={(e) => e.stopPropagation()}>
                <div class="modal-header">
                    <h3>Edit Profile</h3>
                    <button class="close-btn" onclick={cancelForm}> × </button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label for="editProfileName">Profile Name</label>
                        <input
                            type="text"
                            id="editProfileName"
                            bind:value={profileForm.name}
                            placeholder="My Kimai Server"
                        />
                    </div>
                    <div class="form-group">
                        <label for="editProfileUrl">Server URL</label>
                        <input
                            type="url"
                            id="editProfileUrl"
                            bind:value={profileForm.auth.baseUrl}
                            placeholder="https://kimai.example.com"
                        />
                    </div>
                    <div class="form-group">
                        <label for="editProfileUsername">Username</label>
                        <input
                            type="text"
                            id="editProfileUsername"
                            bind:value={profileForm.auth.username}
                            placeholder="username"
                        />
                    </div>
                    <div class="form-group">
                        <label for="editProfileApiToken">API Token</label>
                        <input
                            type="password"
                            id="editProfileApiToken"
                            bind:value={profileForm.auth.apiToken}
                            placeholder="API token"
                        />
                    </div>
                    <div class="form-group">
                        <label class="checkbox-label">
                            <input
                                type="radio"
                                bind:group={profileForm.auth.type}
                                value="api_token"
                            />
                            Use API token authentication
                        </label>
                        <label class="checkbox-label">
                            <input
                                type="radio"
                                bind:group={profileForm.auth.type}
                                value="legacy"
                            />
                            Use legacy authentication
                        </label>
                    </div>
                    <div class="form-group">
                        <label class="checkbox-label">
                            <input
                                type="checkbox"
                                bind:checked={profileForm.autoConnect}
                            />
                            Auto-connect on startup
                        </label>
                    </div>
                </div>
                <div class="modal-actions">
                    <button class="btn btn-secondary" onclick={cancelForm}
                        >Cancel</button
                    >
                    <button class="btn btn-primary" onclick={saveProfile}
                        >Save Changes</button
                    >
                </div>
            </div>
        </div>
    {/if}
</div>

<style>
    .profile-selector {
        position: relative;
        display: inline-block;
    }

    .profile-display {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem 1rem;
        background: var(--bg-secondary);
        border: 1px solid var(--border-color);
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s;
        min-width: 200px;
    }

    .profile-display:hover {
        background: var(--bg-hover);
        border-color: var(--primary-color);
    }

    .profile-info {
        flex: 1;
        text-align: left;
    }

    .profile-name {
        font-weight: 600;
        color: var(--text-primary);
        font-size: 0.875rem;
        margin-bottom: 0.125rem;
    }

    .profile-url {
        font-size: 0.75rem;
        color: var(--text-secondary);
    }

    .quick-add-btn {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 1rem;
        margin-left: 0.5rem;
        background: var(--primary-color);
        color: white;
        border: 1px solid var(--primary-color);
        border-radius: 6px;
        cursor: pointer;
        font-size: 0.875rem;
        font-weight: 500;
        transition: all 0.2s;
    }

    .quick-add-btn:hover {
        background: var(--primary-hover);
        border-color: var(--primary-hover);
    }

    .dropdown-menu {
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: var(--bg-primary);
        border: 1px solid var(--border-color);
        border-radius: 6px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 1000;
        margin-top: 0.25rem;
        min-width: 300px;
    }

    .dropdown-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem;
        border-bottom: 1px solid var(--border-color);
    }

    .dropdown-header h4 {
        margin: 0;
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--text-primary);
    }

    .profile-list {
        max-height: 300px;
        overflow-y: auto;
    }

    .profile-item {
        display: flex;
        align-items: center;
        padding: 0.75rem 1rem;
        border-bottom: 1px solid var(--border-color);
        transition: all 0.2s;
    }

    .profile-item:last-child {
        border-bottom: none;
    }

    .profile-item:hover {
        background: var(--bg-hover);
    }

    .profile-item.active {
        background: var(--primary-color-alpha);
    }

    .profile-details {
        flex: 1;
        cursor: pointer;
    }

    .profile-details .profile-name {
        font-size: 0.875rem;
        margin-bottom: 0.125rem;
    }

    .profile-details .profile-url {
        font-size: 0.75rem;
        margin-bottom: 0.125rem;
    }

    .profile-details .profile-user {
        font-size: 0.75rem;
        color: var(--text-secondary);
    }

    .profile-actions {
        display: flex;
        align-items: center;
        gap: 0.25rem;
    }

    .empty-state {
        padding: 2rem 1rem;
        text-align: center;
        color: var(--text-secondary);
    }

    .empty-state p {
        margin: 0.5rem 0 1rem 0;
        font-size: 0.875rem;
    }

    .btn {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        padding: 0.375rem 0.75rem;
        border: 1px solid var(--border-color);
        border-radius: 4px;
        background: var(--bg-primary);
        color: var(--text-primary);
        cursor: pointer;
        font-size: 0.75rem;
        transition: all 0.2s;
    }

    .btn:hover {
        background: var(--bg-hover);
    }

    .btn-primary {
        background: var(--primary-color);
        color: white;
        border-color: var(--primary-color);
    }

    .btn-primary:hover {
        background: var(--primary-hover);
    }

    .btn-secondary {
        background: var(--bg-secondary);
        border-color: var(--border-color);
    }

    .btn-secondary:hover {
        background: var(--bg-hover);
    }

    .btn-danger {
        background: var(--danger-color);
        color: white;
        border-color: var(--danger-color);
    }

    .btn-danger:hover {
        background: var(--danger-hover);
    }

    .btn-sm {
        padding: 0.25rem 0.5rem;
        font-size: 0.75rem;
    }

    .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
    }

    .modal-content {
        background: var(--bg-primary);
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        max-width: 400px;
        width: 90%;
        max-height: 80vh;
        display: flex;
        flex-direction: column;
    }

    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem 1.5rem;
        border-bottom: 1px solid var(--border-color);
    }

    .modal-header h3 {
        margin: 0;
        font-size: 1.1rem;
        font-weight: 600;
    }

    .close-btn {
        background: none;
        border: none;
        color: var(--text-secondary);
        cursor: pointer;
        font-size: 1.5rem;
        padding: 0;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
        transition: all 0.2s;
    }

    .close-btn:hover {
        background: var(--bg-secondary);
        color: var(--text-primary);
    }

    .modal-body {
        padding: 1.5rem;
        overflow-y: auto;
    }

    .modal-actions {
        display: flex;
        justify-content: flex-end;
        gap: 0.5rem;
        padding: 1rem 1.5rem;
        border-top: 1px solid var(--border-color);
        background: var(--bg-secondary);
    }

    .form-group {
        margin-bottom: 1rem;
    }

    .form-group label {
        display: block;
        margin-bottom: 0.25rem;
        font-weight: 500;
        color: var(--text-primary);
        font-size: 0.875rem;
    }

    .form-group input {
        width: 100%;
        padding: 0.5rem;
        border: 1px solid var(--border-color);
        border-radius: 4px;
        background: var(--bg-primary);
        color: var(--text-primary);
        font-size: 0.875rem;
    }

    .form-group input:focus {
        outline: none;
        border-color: var(--primary-color);
        box-shadow: 0 0 0 2px var(--primary-color-alpha);
    }

    .checkbox-label {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        cursor: pointer;
        font-weight: normal;
        font-size: 0.875rem;
        margin-bottom: 0.5rem;
    }

    .checkbox-label input[type="checkbox"],
    .checkbox-label input[type="radio"] {
        width: auto;
        margin: 0;
    }
</style>
