<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { settingsStore } from "$lib/stores/index.js";
    import type {
        AppSettings,
        UISettings,
        EventSettings,
        AutoRefreshSettings,
        SSLSettings,
    } from "$lib/types/settings.js";
    import type { KimaiProfile } from "$lib/types/kimai.js";
    import {
        X,
        Save,
        RotateCcw,
        Download,
        Upload,
        User,
        Monitor,
        Bell,
        RefreshCw,
        Shield,
        Palette,
        Globe,
        Smartphone,
        Clock,
        AlertTriangle,
        Settings,
    } from "lucide-svelte";

    const dispatch = createEventDispatcher<{
        close: void;
        save: AppSettings;
    }>();

    // Local state for form data
    let settings = $state<AppSettings>({ ...settingsStore.settings });
    let activeTab = $state<
        "profiles" | "ui" | "events" | "autoRefresh" | "ssl"
    >("profiles");
    let showImportDialog = $state(false);
    let importData = $state("");
    let importError = $state("");
    let trustedCertsText = $state(settings.ssl.trustedCertificates.join("\n"));

    // Profile management
    let editingProfile: KimaiProfile | null = $state(null);
    let showProfileForm = $state(false);

    // Form validation
    let errors = $state<Record<string, string>>({});

    // Tab configuration
    const tabs = [
        { id: "profiles", label: "Profiles", icon: User },
        { id: "ui", label: "Interface", icon: Monitor },
        { id: "events", label: "Events", icon: Bell },
        { id: "autoRefresh", label: "Auto-refresh", icon: RefreshCw },
        { id: "ssl", label: "SSL", icon: Shield },
    ] as const;

    // Profile form data
    let profileForm = $state({
        name: "",
        url: "",
        username: "",
        apiToken: "",
        legacyAuth: false,
    });

    function handleClose() {
        dispatch("close");
    }

    function handleSave() {
        if (validateSettings()) {
            settingsStore.update(settings);
            dispatch("save", settings);
            handleClose();
        }
    }

    function handleReset() {
        if (
            confirm(
                "Are you sure you want to reset all settings to defaults? This cannot be undone.",
            )
        ) {
            settingsStore.reset();
            settings = { ...settingsStore.settings };
        }
    }

    function handleExport() {
        const data = settingsStore.export();
        const blob = new Blob([data], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `tikker-settings-${new Date().toISOString().split("T")[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    function handleImport() {
        if (!importData.trim()) {
            importError = "Please enter settings data";
            return;
        }

        if (settingsStore.import(importData)) {
            settings = { ...settingsStore.settings };
            showImportDialog = false;
            importData = "";
            importError = "";
        } else {
            importError = "Invalid settings format";
        }
    }

    function validateSettings(): boolean {
        errors = {};

        // Validate profiles
        if (settings.profiles.length === 0) {
            errors.profiles = "At least one profile is required";
        }

        // Validate current profile
        if (
            settings.currentProfileId &&
            !settings.profiles.find((p) => p.id === settings.currentProfileId)
        ) {
            errors.currentProfile = "Current profile is invalid";
        }

        // Validate UI settings
        if (settings.ui.idleTimeout < 1) {
            errors.idleTimeout = "Idle timeout must be at least 1 minute";
        }

        if (settings.ui.idleWarningTime >= settings.ui.idleTimeout) {
            errors.idleWarningTime =
                "Warning time must be less than idle timeout";
        }

        // Validate auto-refresh
        if (settings.autoRefresh.enabled && settings.autoRefresh.interval < 5) {
            errors.refreshInterval =
                "Refresh interval must be at least 5 seconds";
        }

        return Object.keys(errors).length === 0;
    }

    // Profile management functions
    function addProfile() {
        editingProfile = null;
        profileForm = {
            name: "",
            url: "",
            username: "",
            apiToken: "",
            legacyAuth: false,
        };
        showProfileForm = true;
    }

    function editProfile(profile: KimaiProfile) {
        editingProfile = profile;
        profileForm = {
            name: profile.name,
            url: profile.url,
            username: profile.username,
            apiToken: profile.apiToken,
            legacyAuth: profile.legacyAuth,
        };
        showProfileForm = true;
    }

    function saveProfile() {
        if (!profileForm.name.trim() || !profileForm.url.trim()) {
            return;
        }

        if (editingProfile) {
            settingsStore.updateProfile(editingProfile.id, profileForm);
        } else {
            settingsStore.addProfile(profileForm);
        }

        settings = { ...settingsStore.settings };
        showProfileForm = false;
    }

    function deleteProfile(id: string) {
        if (confirm("Are you sure you want to delete this profile?")) {
            settingsStore.deleteProfile(id);
            settings = { ...settingsStore.settings };
        }
    }

    function setCurrentProfile(id: string) {
        settingsStore.setCurrentProfile(id);
        settings = { ...settingsStore.settings };
    }
</script>

<div class="settings-dialog">
    <div class="dialog-header">
        <h2>Settings</h2>
        <button class="close-btn" onclick={handleClose}>
            <X size={20} />
        </button>
    </div>

    <div class="dialog-content">
        <!-- Tab Navigation -->
        <div class="tab-nav">
            {#each tabs as tab}
                <button
                    class="tab-btn {activeTab === tab.id ? 'active' : ''}"
                    onclick={() => (activeTab = tab.id)}
                >
                    {#if tab.icon === User}
                        <User size={16} />
                    {:else if tab.icon === Settings}
                        <Settings size={16} />
                    {:else if tab.icon === Monitor}
                        <Monitor size={16} />
                    {:else if tab.icon === Bell}
                        <Bell size={16} />
                    {/if}
                    {tab.label}
                </button>
            {/each}
        </div>

        <!-- Tab Content -->
        <div class="tab-content">
            {#if activeTab === "profiles"}
                <div class="profile-section">
                    <div class="section-header">
                        <h3>Kimai Profiles</h3>
                        <button class="btn btn-primary" onclick={addProfile}>
                            <User size={16} />
                            Add Profile
                        </button>
                    </div>

                    {#if errors.profiles}
                        <div class="error-message">{errors.profiles}</div>
                    {/if}

                    <div class="profile-list">
                        {#each settings.profiles as profile}
                            <div
                                class="profile-item {settings.currentProfileId ===
                                profile.id
                                    ? 'current'
                                    : ''}"
                            >
                                <div class="profile-info">
                                    <div class="profile-name">
                                        {profile.name}
                                    </div>
                                    <div class="profile-url">{profile.url}</div>
                                    <div class="profile-user">
                                        {profile.username}
                                    </div>
                                </div>
                                <div class="profile-actions">
                                    {#if settings.currentProfileId !== profile.id}
                                        <button
                                            class="btn btn-sm btn-secondary"
                                            onclick={() =>
                                                setCurrentProfile(profile.id)}
                                        >
                                            Set Active
                                        </button>
                                    {/if}
                                    <button
                                        class="btn btn-sm btn-secondary"
                                        onclick={() => editProfile(profile)}
                                    >
                                        Edit
                                    </button>
                                    <button
                                        class="btn btn-sm btn-danger"
                                        onclick={() =>
                                            deleteProfile(profile.id)}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        {/each}
                    </div>
                </div>
            {:else if activeTab === "ui"}
                <div class="ui-section">
                    <h3>Interface Settings</h3>

                    <div class="form-group">
                        <label for="language">Language</label>
                        <select id="language" bind:value={settings.ui.language}>
                            <option value="en">English</option>
                            <option value="de">Deutsch</option>
                            <option value="fr">Français</option>
                            <option value="es">Español</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label for="theme">Theme</label>
                        <select id="theme" bind:value={settings.ui.theme}>
                            <option value="system">System</option>
                            <option value="light">Light</option>
                            <option value="dark">Dark</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label for="fontSize">Font Size</label>
                        <select id="fontSize" bind:value={settings.ui.fontSize}>
                            <option value="small">Small</option>
                            <option value="medium">Medium</option>
                            <option value="large">Large</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label class="checkbox-label">
                            <input
                                type="checkbox"
                                bind:checked={settings.ui.showNotifications}
                            />
                            Show notifications
                        </label>
                    </div>

                    <h4>Tray Behavior</h4>
                    <div class="form-group">
                        <label class="checkbox-label">
                            <input
                                type="checkbox"
                                bind:checked={
                                    settings.ui.trayBehavior.minimizeToTray
                                }
                            />
                            Minimize to tray
                        </label>
                    </div>

                    <div class="form-group">
                        <label class="checkbox-label">
                            <input
                                type="checkbox"
                                bind:checked={
                                    settings.ui.trayBehavior.startMinimized
                                }
                            />
                            Start minimized
                        </label>
                    </div>

                    <div class="form-group">
                        <label class="checkbox-label">
                            <input
                                type="checkbox"
                                bind:checked={
                                    settings.ui.trayBehavior.closeToTray
                                }
                            />
                            Close to tray
                        </label>
                    </div>

                    <div class="form-group">
                        <label class="checkbox-label">
                            <input
                                type="checkbox"
                                bind:checked={
                                    settings.ui.trayBehavior.showTrayIcon
                                }
                            />
                            Show tray icon
                        </label>
                    </div>
                </div>
            {:else if activeTab === "events"}
                <div class="events-section">
                    <h3>Event Settings</h3>

                    <div class="form-group">
                        <label class="checkbox-label">
                            <input
                                type="checkbox"
                                bind:checked={
                                    settings.events.enableIdleDetection
                                }
                            />
                            Enable idle detection
                        </label>
                    </div>

                    <div class="form-group">
                        <label for="idleTimeout">Idle timeout (minutes)</label>
                        <input
                            type="number"
                            id="idleTimeout"
                            bind:value={settings.events.idleTimeout}
                            min="1"
                            max="60"
                            disabled={!settings.events.enableIdleDetection}
                        />
                        {#if errors.idleTimeout}
                            <div class="error-message">
                                {errors.idleTimeout}
                            </div>
                        {/if}
                    </div>

                    <div class="form-group">
                        <label class="checkbox-label">
                            <input
                                type="checkbox"
                                bind:checked={settings.events.autoStopOnIdle}
                            />
                            Auto-stop timer on idle
                        </label>
                    </div>

                    <div class="form-group">
                        <label class="checkbox-label">
                            <input
                                type="checkbox"
                                bind:checked={settings.events.showIdleWarning}
                            />
                            Show idle warning
                        </label>
                    </div>

                    <div class="form-group">
                        <label for="idleWarningTime"
                            >Warning time (minutes)</label
                        >
                        <input
                            type="number"
                            id="idleWarningTime"
                            bind:value={settings.events.idleWarningTime}
                            min="1"
                            max="10"
                            disabled={!settings.events.showIdleWarning}
                        />
                        {#if errors.idleWarningTime}
                            <div class="error-message">
                                {errors.idleWarningTime}
                            </div>
                        {/if}
                    </div>

                    <div class="form-group">
                        <label class="checkbox-label">
                            <input
                                type="checkbox"
                                bind:checked={
                                    settings.events.enableLockDetection
                                }
                            />
                            Enable lock detection
                        </label>
                    </div>

                    <div class="form-group">
                        <label class="checkbox-label">
                            <input
                                type="checkbox"
                                bind:checked={settings.events.autoStopOnLock}
                            />
                            Auto-stop timer on lock
                        </label>
                    </div>
                </div>
            {:else if activeTab === "autoRefresh"}
                <div class="auto-refresh-section">
                    <h3>Auto-refresh Settings</h3>

                    <div class="form-group">
                        <label class="checkbox-label">
                            <input
                                type="checkbox"
                                bind:checked={settings.autoRefresh.enabled}
                            />
                            Enable auto-refresh
                        </label>
                    </div>

                    <div class="form-group">
                        <label for="refreshInterval"
                            >Refresh interval (seconds)</label
                        >
                        <input
                            type="number"
                            id="refreshInterval"
                            bind:value={settings.autoRefresh.interval}
                            min="5"
                            max="300"
                            disabled={!settings.autoRefresh.enabled}
                        />
                        {#if errors.refreshInterval}
                            <div class="error-message">
                                {errors.refreshInterval}
                            </div>
                        {/if}
                    </div>

                    <div class="form-group">
                        <label class="checkbox-label">
                            <input
                                type="checkbox"
                                bind:checked={
                                    settings.autoRefresh.syncOnStartup
                                }
                            />
                            Sync on startup
                        </label>
                    </div>

                    <div class="form-group">
                        <label class="checkbox-label">
                            <input
                                type="checkbox"
                                bind:checked={settings.autoRefresh.syncOnResume}
                            />
                            Sync on resume
                        </label>
                    </div>
                </div>
            {:else if activeTab === "ssl"}
                <div class="ssl-section">
                    <h3>SSL Settings</h3>

                    <div class="form-group">
                        <label class="checkbox-label">
                            <input
                                type="checkbox"
                                bind:checked={settings.ssl.ignoreSslErrors}
                            />
                            Ignore SSL errors
                        </label>
                    </div>

                    <div class="form-group">
                        <label class="checkbox-label">
                            <input
                                type="checkbox"
                                bind:checked={settings.ssl.verifyHostname}
                            />
                            Verify hostname
                        </label>
                    </div>

                    <div class="form-group">
                        <label for="trustedCerts"
                            >Trusted certificates (one per line)</label
                        >
                        <textarea
                            id="trustedCerts"
                            bind:value={trustedCertsText}
                            placeholder="Enter trusted certificate paths..."
                            rows="4"
                        ></textarea>
                    </div>
                </div>
            {/if}
        </div>
    </div>

    <!-- Action Buttons -->
    <div class="dialog-actions">
        <div class="action-group">
            <button class="btn btn-secondary" onclick={handleReset}>
                <RotateCcw size={16} />
                Reset
            </button>
            <button class="btn btn-secondary" onclick={handleExport}>
                <Download size={16} />
                Export
            </button>
            <button
                class="btn btn-secondary"
                onclick={() => (showImportDialog = true)}
            >
                <Upload size={16} />
                Import
            </button>
        </div>
        <div class="action-group">
            <button class="btn btn-secondary" onclick={handleClose}
                >Cancel</button
            >
            <button class="btn btn-primary" onclick={handleSave}>
                <Save size={16} />
                Save
            </button>
        </div>
    </div>

    <!-- Profile Form Modal -->
    {#if showProfileForm}
        <div class="modal-overlay" onclick={() => (showProfileForm = false)}>
            <div class="modal-content" onclick={(e) => e.stopPropagation()}>
                <div class="modal-header">
                    <h3>{editingProfile ? "Edit Profile" : "Add Profile"}</h3>
                    <button
                        class="close-btn"
                        onclick={() => (showProfileForm = false)}
                    >
                        <X size={20} />
                    </button>
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
                            bind:value={profileForm.url}
                            placeholder="https://kimai.example.com"
                        />
                    </div>
                    <div class="form-group">
                        <label for="profileUsername">Username</label>
                        <input
                            type="text"
                            id="profileUsername"
                            bind:value={profileForm.username}
                            placeholder="username"
                        />
                    </div>
                    <div class="form-group">
                        <label for="profileApiToken">API Token</label>
                        <input
                            type="password"
                            id="profileApiToken"
                            bind:value={profileForm.apiToken}
                            placeholder="API token"
                        />
                    </div>
                    <div class="form-group">
                        <label class="checkbox-label">
                            <input
                                type="checkbox"
                                bind:checked={profileForm.legacyAuth}
                            />
                            Use legacy authentication
                        </label>
                    </div>
                </div>
                <div class="modal-actions">
                    <button
                        class="btn btn-secondary"
                        onclick={() => (showProfileForm = false)}>Cancel</button
                    >
                    <button class="btn btn-primary" onclick={saveProfile}
                        >Save</button
                    >
                </div>
            </div>
        </div>
    {/if}

    <!-- Import Dialog -->
    {#if showImportDialog}
        <div class="modal-overlay" onclick={() => (showImportDialog = false)}>
            <div class="modal-content" onclick={(e) => e.stopPropagation()}>
                <div class="modal-header">
                    <h3>Import Settings</h3>
                    <button
                        class="close-btn"
                        onclick={() => (showImportDialog = false)}
                    >
                        <X size={20} />
                    </button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label for="importData">Settings JSON</label>
                        <textarea
                            id="importData"
                            bind:value={importData}
                            placeholder="Paste settings JSON here..."
                            rows="10"
                        ></textarea>
                    </div>
                    {#if importError}
                        <div class="error-message">{importError}</div>
                    {/if}
                </div>
                <div class="modal-actions">
                    <button
                        class="btn btn-secondary"
                        onclick={() => (showImportDialog = false)}
                        >Cancel</button
                    >
                    <button class="btn btn-primary" onclick={handleImport}
                        >Import</button
                    >
                </div>
            </div>
        </div>
    {/if}
</div>

<style>
    .settings-dialog {
        background: var(--bg-primary);
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        max-width: 800px;
        width: 100%;
        max-height: 80vh;
        display: flex;
        flex-direction: column;
    }

    .dialog-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem 1.5rem;
        border-bottom: 1px solid var(--border-color);
    }

    .dialog-header h2 {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 600;
    }

    .close-btn {
        background: none;
        border: none;
        color: var(--text-secondary);
        cursor: pointer;
        padding: 0.25rem;
        border-radius: 4px;
        transition: all 0.2s;
    }

    .close-btn:hover {
        background: var(--bg-secondary);
        color: var(--text-primary);
    }

    .dialog-content {
        flex: 1;
        display: flex;
        overflow: hidden;
    }

    .tab-nav {
        width: 200px;
        background: var(--bg-secondary);
        border-right: 1px solid var(--border-color);
        padding: 1rem 0;
    }

    .tab-btn {
        width: 100%;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem 1rem;
        background: none;
        border: none;
        color: var(--text-secondary);
        cursor: pointer;
        transition: all 0.2s;
        text-align: left;
    }

    .tab-btn:hover {
        background: var(--bg-hover);
        color: var(--text-primary);
    }

    .tab-btn.active {
        background: var(--primary-color);
        color: white;
    }

    .tab-content {
        flex: 1;
        padding: 1.5rem;
        overflow-y: auto;
    }

    .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
    }

    .section-header h3 {
        margin: 0;
        font-size: 1.1rem;
        font-weight: 600;
    }

    .form-group {
        margin-bottom: 1rem;
    }

    .form-group label {
        display: block;
        margin-bottom: 0.25rem;
        font-weight: 500;
        color: var(--text-primary);
    }

    .form-group input,
    .form-group select,
    .form-group textarea {
        width: 100%;
        padding: 0.5rem;
        border: 1px solid var(--border-color);
        border-radius: 4px;
        background: var(--bg-primary);
        color: var(--text-primary);
        font-size: 0.875rem;
    }

    .form-group input:focus,
    .form-group select:focus,
    .form-group textarea:focus {
        outline: none;
        border-color: var(--primary-color);
        box-shadow: 0 0 0 2px var(--primary-color-alpha);
    }

    .form-group input:disabled,
    .form-group select:disabled,
    .form-group textarea:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .checkbox-label {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        cursor: pointer;
        font-weight: normal;
    }

    .checkbox-label input[type="checkbox"] {
        width: auto;
        margin: 0;
    }

    .profile-list {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }

    .profile-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem;
        border: 1px solid var(--border-color);
        border-radius: 6px;
        background: var(--bg-secondary);
    }

    .profile-item.current {
        border-color: var(--primary-color);
        background: var(--primary-color-alpha);
    }

    .profile-info {
        flex: 1;
    }

    .profile-name {
        font-weight: 600;
        color: var(--text-primary);
        margin-bottom: 0.25rem;
    }

    .profile-url {
        font-size: 0.875rem;
        color: var(--text-secondary);
        margin-bottom: 0.25rem;
    }

    .profile-user {
        font-size: 0.875rem;
        color: var(--text-secondary);
    }

    .profile-actions {
        display: flex;
        gap: 0.5rem;
    }

    .dialog-actions {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem 1.5rem;
        border-top: 1px solid var(--border-color);
        background: var(--bg-secondary);
    }

    .action-group {
        display: flex;
        gap: 0.5rem;
    }

    .btn {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 1rem;
        border: 1px solid var(--border-color);
        border-radius: 4px;
        background: var(--bg-primary);
        color: var(--text-primary);
        cursor: pointer;
        font-size: 0.875rem;
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

    .error-message {
        color: var(--danger-color);
        font-size: 0.875rem;
        margin-top: 0.25rem;
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
        max-width: 500px;
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

    h4 {
        margin: 1.5rem 0 1rem 0;
        font-size: 1rem;
        font-weight: 600;
        color: var(--text-primary);
    }
</style>
