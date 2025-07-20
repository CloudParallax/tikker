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

<div class="profile-selector relative inline-block">
    <!-- Current Profile Display -->
    <button
        class="profile-display flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md cursor-pointer transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-blue-500 min-w-[200px]"
        onclick={toggleDropdown}
    >
        <div class="profile-info flex-1 text-left">
            {#if currentProfile}
                <div
                    class="profile-name font-semibold text-gray-900 dark:text-gray-100 text-sm mb-0.5"
                >
                    {currentProfile.name}
                </div>
                <div
                    class="profile-url text-xs text-gray-600 dark:text-gray-400"
                >
                    {currentProfile.auth.baseUrl}
                </div>
            {:else}
                <div
                    class="profile-name font-semibold text-gray-900 dark:text-gray-100 text-sm mb-0.5"
                >
                    No Profile Selected
                </div>
                <div
                    class="profile-url text-xs text-gray-600 dark:text-gray-400"
                >
                    Click to select a profile
                </div>
            {/if}
        </div>
        <User size={16} class="text-gray-600 dark:text-gray-400" />
    </button>

    <!-- Quick Add Profile Button (when no profile selected) -->
    {#if !currentProfile}
        <button
            class="quick-add-btn flex items-center gap-2 px-3 py-2 ml-2 bg-blue-600 text-white border border-blue-600 rounded-md cursor-pointer text-sm font-medium transition-all duration-200 hover:bg-blue-700 hover:border-blue-700"
            onclick={addProfile}
        >
            <Plus size={16} />
            Add Profile
        </button>
    {/if}

    <!-- Dropdown Menu -->
    {#if showDropdown}
        <div
            class="dropdown-menu absolute top-full left-0 right-0 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg z-50 mt-1 min-w-[300px]"
        >
            <div
                class="dropdown-header flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700"
            >
                <h4
                    class="m-0 text-sm font-semibold text-gray-900 dark:text-gray-100"
                >
                    Profiles
                </h4>
                <button
                    class="btn btn-sm btn-primary flex items-center gap-1 px-2 py-1 bg-blue-600 text-white border border-blue-600 rounded text-xs transition-all duration-200 hover:bg-blue-700"
                    onclick={addProfile}
                >
                    <Plus size={14} />
                    Add Profile
                </button>
            </div>

            <div class="profile-list max-h-[300px] overflow-y-auto">
                {#each profiles as profile}
                    <div
                        class="profile-item flex items-center p-3 border-b border-gray-200 dark:border-gray-700 transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-700 {currentProfile?.id ===
                        profile.id
                            ? 'bg-blue-50 dark:bg-blue-900/20'
                            : ''}"
                    >
                        <div
                            class="profile-details flex-1 cursor-pointer"
                            role="button"
                            tabindex="0"
                            onclick={() => selectProfile(profile)}
                            onkeydown={(e) =>
                                e.key === "Enter" && selectProfile(profile)}
                        >
                            <div
                                class="profile-name text-sm font-medium text-gray-900 dark:text-gray-100 mb-0.5"
                            >
                                {profile.name}
                            </div>
                            <div
                                class="profile-url text-xs text-gray-600 dark:text-gray-400 mb-0.5"
                            >
                                {profile.auth.baseUrl}
                            </div>
                            <div
                                class="profile-user text-xs text-gray-500 dark:text-gray-400"
                            >
                                {profile.auth.username}
                            </div>
                        </div>
                        <div class="profile-actions flex items-center gap-1">
                            {#if currentProfile?.id === profile.id}
                                <Check
                                    size={14}
                                    class="text-blue-600 dark:text-blue-400"
                                />
                            {/if}
                            <button
                                class="btn btn-sm btn-secondary flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded text-xs transition-all duration-200 hover:bg-gray-200 dark:hover:bg-gray-600"
                                onclick={() => editProfile(profile)}
                            >
                                <Settings size={14} />
                            </button>
                            {#if profiles.length > 1}
                                <button
                                    class="btn btn-sm btn-danger flex items-center gap-1 px-2 py-1 bg-red-600 text-white border border-red-600 rounded text-xs transition-all duration-200 hover:bg-red-700"
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
                <div
                    class="empty-state p-8 text-center text-gray-500 dark:text-gray-400"
                >
                    <User
                        size={32}
                        class="mx-auto mb-2 text-gray-400 dark:text-gray-500"
                    />
                    <p class="m-0 mb-4 text-sm">No profiles configured</p>
                    <button
                        class="btn btn-primary flex items-center gap-2 px-4 py-2 bg-blue-600 text-white border border-blue-600 rounded text-sm transition-all duration-200 hover:bg-blue-700"
                        onclick={addProfile}
                    >
                        <Plus size={16} />
                        Add Your First Profile
                    </button>
                </div>
            {/if}
        </div>
    {/if}

    <!-- Add Profile Modal -->
    {#if showAddForm}
        <div
            class="modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onclick={cancelForm}
        >
            <div
                class="modal-content bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-11/12 max-h-[80vh] flex flex-col"
                onclick={(e) => e.stopPropagation()}
            >
                <div
                    class="modal-header flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700"
                >
                    <h3
                        class="m-0 text-lg font-semibold text-gray-900 dark:text-gray-100"
                    >
                        Add Profile
                    </h3>
                    <button
                        class="close-btn bg-transparent border-none text-gray-500 dark:text-gray-400 cursor-pointer text-2xl p-0 w-6 h-6 flex items-center justify-center rounded transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200"
                        onclick={cancelForm}
                    >
                        ×
                    </button>
                </div>
                <div class="modal-body p-6 overflow-y-auto">
                    <div class="form-group mb-4">
                        <label
                            for="profileName"
                            class="block mb-1 font-medium text-gray-900 dark:text-gray-100 text-sm"
                            >Profile Name</label
                        >
                        <input
                            type="text"
                            id="profileName"
                            bind:value={profileForm.name}
                            placeholder="My Kimai Server"
                            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                        />
                    </div>
                    <div class="form-group mb-4">
                        <label
                            for="profileUrl"
                            class="block mb-1 font-medium text-gray-900 dark:text-gray-100 text-sm"
                            >Server URL</label
                        >
                        <input
                            type="url"
                            id="profileUrl"
                            bind:value={profileForm.auth.baseUrl}
                            placeholder="https://kimai.example.com"
                            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                        />
                    </div>
                    <div class="form-group mb-4">
                        <label
                            for="profileUsername"
                            class="block mb-1 font-medium text-gray-900 dark:text-gray-100 text-sm"
                            >Username</label
                        >
                        <input
                            type="text"
                            id="profileUsername"
                            bind:value={profileForm.auth.username}
                            placeholder="username"
                            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                        />
                    </div>
                    <div class="form-group mb-4">
                        <label
                            for="profileApiToken"
                            class="block mb-1 font-medium text-gray-900 dark:text-gray-100 text-sm"
                            >API Token</label
                        >
                        <input
                            type="password"
                            id="profileApiToken"
                            bind:value={profileForm.auth.apiToken}
                            placeholder="API token"
                            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                        />
                    </div>
                    <div class="form-group mb-4">
                        <label
                            class="checkbox-label flex items-center gap-2 cursor-pointer font-normal text-sm mb-2"
                        >
                            <input
                                type="radio"
                                bind:group={profileForm.auth.type}
                                value="api_token"
                                class="w-auto m-0"
                            />
                            Use API token authentication
                        </label>
                        <label
                            class="checkbox-label flex items-center gap-2 cursor-pointer font-normal text-sm mb-2"
                        >
                            <input
                                type="radio"
                                bind:group={profileForm.auth.type}
                                value="legacy"
                                class="w-auto m-0"
                            />
                            Use legacy authentication
                        </label>
                    </div>
                    <div class="form-group mb-4">
                        <label
                            class="checkbox-label flex items-center gap-2 cursor-pointer font-normal text-sm mb-2"
                        >
                            <input
                                type="checkbox"
                                bind:checked={profileForm.autoConnect}
                                class="w-auto m-0"
                            />
                            Auto-connect on startup
                        </label>
                    </div>
                </div>
                <div
                    class="modal-actions flex justify-end gap-2 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700"
                >
                    <button
                        class="btn btn-secondary flex items-center gap-1 px-4 py-2 bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-500 rounded text-sm transition-all duration-200 hover:bg-gray-200 dark:hover:bg-gray-500"
                        onclick={cancelForm}
                    >
                        Cancel
                    </button>
                    <button
                        class="btn btn-primary flex items-center gap-1 px-4 py-2 bg-blue-600 text-white border border-blue-600 rounded text-sm transition-all duration-200 hover:bg-blue-700"
                        onclick={() => {
                            console.log("Add Profile button clicked");
                            saveProfile();
                        }}
                        type="button"
                    >
                        Add Profile
                    </button>
                </div>
            </div>
        </div>
    {/if}

    <!-- Edit Profile Modal -->
    {#if showEditForm}
        <div
            class="modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onclick={cancelForm}
        >
            <div
                class="modal-content bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-11/12 max-h-[80vh] flex flex-col"
                onclick={(e) => e.stopPropagation()}
            >
                <div
                    class="modal-header flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700"
                >
                    <h3
                        class="m-0 text-lg font-semibold text-gray-900 dark:text-gray-100"
                    >
                        Edit Profile
                    </h3>
                    <button
                        class="close-btn bg-transparent border-none text-gray-500 dark:text-gray-400 cursor-pointer text-2xl p-0 w-6 h-6 flex items-center justify-center rounded transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200"
                        onclick={cancelForm}
                    >
                        ×
                    </button>
                </div>
                <div class="modal-body p-6 overflow-y-auto">
                    <div class="form-group mb-4">
                        <label
                            for="editProfileName"
                            class="block mb-1 font-medium text-gray-900 dark:text-gray-100 text-sm"
                            >Profile Name</label
                        >
                        <input
                            type="text"
                            id="editProfileName"
                            bind:value={profileForm.name}
                            placeholder="My Kimai Server"
                            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                        />
                    </div>
                    <div class="form-group mb-4">
                        <label
                            for="editProfileUrl"
                            class="block mb-1 font-medium text-gray-900 dark:text-gray-100 text-sm"
                            >Server URL</label
                        >
                        <input
                            type="url"
                            id="editProfileUrl"
                            bind:value={profileForm.auth.baseUrl}
                            placeholder="https://kimai.example.com"
                            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                        />
                    </div>
                    <div class="form-group mb-4">
                        <label
                            for="editProfileUsername"
                            class="block mb-1 font-medium text-gray-900 dark:text-gray-100 text-sm"
                            >Username</label
                        >
                        <input
                            type="text"
                            id="editProfileUsername"
                            bind:value={profileForm.auth.username}
                            placeholder="username"
                            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                        />
                    </div>
                    <div class="form-group mb-4">
                        <label
                            for="editProfileApiToken"
                            class="block mb-1 font-medium text-gray-900 dark:text-gray-100 text-sm"
                            >API Token</label
                        >
                        <input
                            type="password"
                            id="editProfileApiToken"
                            bind:value={profileForm.auth.apiToken}
                            placeholder="API token"
                            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                        />
                    </div>
                    <div class="form-group mb-4">
                        <label
                            class="checkbox-label flex items-center gap-2 cursor-pointer font-normal text-sm mb-2"
                        >
                            <input
                                type="radio"
                                bind:group={profileForm.auth.type}
                                value="api_token"
                                class="w-auto m-0"
                            />
                            Use API token authentication
                        </label>
                        <label
                            class="checkbox-label flex items-center gap-2 cursor-pointer font-normal text-sm mb-2"
                        >
                            <input
                                type="radio"
                                bind:group={profileForm.auth.type}
                                value="legacy"
                                class="w-auto m-0"
                            />
                            Use legacy authentication
                        </label>
                    </div>
                    <div class="form-group mb-4">
                        <label
                            class="checkbox-label flex items-center gap-2 cursor-pointer font-normal text-sm mb-2"
                        >
                            <input
                                type="checkbox"
                                bind:checked={profileForm.autoConnect}
                                class="w-auto m-0"
                            />
                            Auto-connect on startup
                        </label>
                    </div>
                </div>
                <div
                    class="modal-actions flex justify-end gap-2 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700"
                >
                    <button
                        class="btn btn-secondary flex items-center gap-1 px-4 py-2 bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-500 rounded text-sm transition-all duration-200 hover:bg-gray-200 dark:hover:bg-gray-500"
                        onclick={cancelForm}
                    >
                        Cancel
                    </button>
                    <button
                        class="btn btn-primary flex items-center gap-1 px-4 py-2 bg-blue-600 text-white border border-blue-600 rounded text-sm transition-all duration-200 hover:bg-blue-700"
                        onclick={saveProfile}
                    >
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    {/if}
</div>
