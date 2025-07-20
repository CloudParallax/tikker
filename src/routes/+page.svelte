<script lang="ts">
  import { onMount } from "svelte";
  import {
    kimaiStore,
    sessionStore,
    settingsStore,
    timerStore,
  } from "$lib/stores/index.js";
  import ActivityWidget from "$lib/components/ActivityWidget.svelte";
  import TaskWidget from "$lib/components/TaskWidget.svelte";
  import SettingsDialog from "$lib/components/SettingsDialog.svelte";
  import ProfileSelector from "$lib/components/ProfileSelector.svelte";
  import TimerDisplay from "$lib/components/TimerDisplay.svelte";
  import PlayButton from "$lib/components/PlayButton.svelte";
  import StatusIndicator from "$lib/components/StatusIndicator.svelte";
  import { Settings, User, Clock, ListTodo } from "lucide-svelte";

  // Application state
  let showSettings = $state(false);
  let showTasks = $state(false);
  let currentTab = $state<"timer" | "tasks">("timer");
  let isLoading = $state(true);

  // Get store states
  let connectionState = $derived(kimaiStore.connectionState);
  let currentProfile = $derived(settingsStore.currentProfile);
  let timerState = $derived(timerStore.state);

  // Initialize application
  onMount(async () => {
    try {
      // Load settings and initialize
      await initializeApp();
    } catch (error) {
      console.error("Failed to initialize app:", error);
    } finally {
      isLoading = false;
    }
  });

  async function initializeApp() {
    // Check if we have a current profile
    if (currentProfile) {
      // Try to connect to Kimai
      await kimaiStore.connect(currentProfile.auth);
    }
  }

  function handleProfileSelect() {
    // Reconnect when profile changes
    if (currentProfile) {
      kimaiStore.connect(currentProfile.auth);
    }
  }

  function handleSettingsSave() {
    showSettings = false;
    // Reconnect if profile changed
    if (currentProfile) {
      kimaiStore.connect(currentProfile.auth);
    }
  }

  function toggleTasks() {
    showTasks = !showTasks;
    if (showTasks) {
      currentTab = "tasks";
    } else {
      currentTab = "timer";
    }
  }
</script>

<svelte:head>
  <title>Tikker - Time Tracking</title>
</svelte:head>
Test
{#if isLoading}
  <div class="loading-screen">
    <div class="loading-spinner"></div>
    <p>Loading Tikker...</p>
  </div>
{:else}
  <div class="app-container">
    <!-- Header -->
    <header class="app-header">
      <div class="header-left">
        <h1 class="app-title">Tikker</h1>
        <StatusIndicator size="small" />
      </div>

      <div class="header-center">
        <div class="connection-status">
          {#if connectionState.isConnected}
            <span class="status-connected">Connected</span>
          {:else if connectionState.isConnecting}
            <span class="status-connecting">Connecting...</span>
          {:else}
            <span class="status-disconnected">Disconnected</span>
          {/if}
        </div>
      </div>

      <div class="header-right">
        <ProfileSelector on:select={handleProfileSelect} />
        <button
          class="header-btn"
          onclick={() => (showSettings = true)}
          title="Settings"
        >
          <Settings size={20} />
        </button>
      </div>
    </header>

    <!-- Main Content -->
    <main class="app-main">
      {#if !currentProfile}
        <!-- No Profile Setup -->
        <div class="setup-screen">
          <div class="setup-content">
            <User size={64} />
            <h2>Welcome to Tikker</h2>
            <p>
              Set up your first Kimai profile to get started with time tracking.
            </p>
            <button
              class="btn btn-primary"
              onclick={() => (showSettings = true)}
            >
              <Settings size={16} />
              Configure Profile
            </button>
          </div>
        </div>
      {:else if !connectionState.isConnected}
        <!-- Connection Error -->
        <div class="error-screen">
          <div class="error-content">
            <h2>Connection Error</h2>
            <p>
              {connectionState.error || "Failed to connect to Kimai server"}
            </p>
            <button
              class="btn btn-primary"
              onclick={() => kimaiStore.connect(currentProfile.auth)}
            >
              Retry Connection
            </button>
          </div>
        </div>
      {:else}
        <!-- Main Interface -->
        <div class="main-interface">
          <!-- Timer Section -->
          <div class="timer-section">
            <div class="timer-header">
              <h2>Time Tracking</h2>
              <button
                class="tab-btn {currentTab === 'timer' ? 'active' : ''}"
                onclick={() => (currentTab = "timer")}
              >
                <Clock size={16} />
                Timer
              </button>
              <button
                class="tab-btn {currentTab === 'tasks' ? 'active' : ''}"
                onclick={toggleTasks}
              >
                <ListTodo size={16} />
                Tasks
              </button>
            </div>

            {#if currentTab === "timer"}
              <div class="timer-content">
                <!-- Timer Display -->
                <div class="timer-display-section">
                  <TimerDisplay size="large" />
                  <div class="timer-controls">
                    <PlayButton size="large" showReset={true} />
                  </div>
                </div>

                <!-- Activity Widget -->
                <div class="activity-section">
                  <ActivityWidget />
                </div>
              </div>
            {:else}
              <div class="tasks-content">
                <TaskWidget />
              </div>
            {/if}
          </div>
        </div>
      {/if}
    </main>
  </div>

  <!-- Settings Dialog -->
  {#if showSettings}
    <SettingsDialog
      on:close={() => (showSettings = false)}
      on:save={handleSettingsSave}
    />
  {/if}
{/if}

<style>
  /* Global Styles */
  :root {
    --app-bg: var(--bg-primary);
    --header-bg: var(--bg-secondary);
    --border-color: var(--border-color);
    --text-primary: var(--text-primary);
    --text-secondary: var(--text-secondary);
    --primary-color: var(--primary-color);
    --success-color: var(--success-color);
    --warning-color: var(--warning-color);
    --danger-color: var(--danger-color);
  }

  * {
    box-sizing: border-box;
  }

  body {
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
      sans-serif;
    background: var(--app-bg);
    color: var(--text-primary);
  }

  /* Loading Screen */
  .loading-screen {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
    gap: 1rem;
  }

  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 3px solid var(--border-color);
    border-top: 3px solid var(--primary-color);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }

  /* App Container */
  .app-container {
    display: flex;
    flex-direction: column;
    height: 100vh;
    overflow: hidden;
  }

  /* Header */
  .app-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1.5rem;
    background: var(--header-bg);
    border-bottom: 1px solid var(--border-color);
    min-height: 64px;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .app-title {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--text-primary);
  }

  .header-center {
    display: flex;
    align-items: center;
  }

  .connection-status {
    font-size: 0.875rem;
    font-weight: 500;
  }

  .status-connected {
    color: var(--success-color);
  }

  .status-connecting {
    color: var(--warning-color);
  }

  .status-disconnected {
    color: var(--danger-color);
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .header-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border: 1px solid var(--border-color);
    border-radius: 6px;
    background: var(--bg-primary);
    color: var(--text-primary);
    cursor: pointer;
    transition: all 0.2s;
  }

  .header-btn:hover {
    background: var(--bg-hover);
    border-color: var(--primary-color);
  }

  /* Main Content */
  .app-main {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  /* Setup Screen */
  .setup-screen {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    padding: 2rem;
  }

  .setup-content {
    text-align: center;
    max-width: 400px;
    color: var(--text-secondary);
  }

  .setup-content h2 {
    margin: 1rem 0 0.5rem 0;
    color: var(--text-primary);
  }

  .setup-content p {
    margin: 0 0 1.5rem 0;
    line-height: 1.5;
  }

  /* Error Screen */
  .error-screen {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    padding: 2rem;
  }

  .error-content {
    text-align: center;
    max-width: 400px;
    color: var(--text-secondary);
  }

  .error-content h2 {
    margin: 0 0 0.5rem 0;
    color: var(--danger-color);
  }

  .error-content p {
    margin: 0 0 1.5rem 0;
    line-height: 1.5;
  }

  /* Main Interface */
  .main-interface {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  /* Timer Section */
  .timer-section {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .timer-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem 1.5rem;
    border-bottom: 1px solid var(--border-color);
    background: var(--header-bg);
  }

  .timer-header h2 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
  }

  .tab-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    border: 1px solid var(--border-color);
    border-radius: 6px;
    background: var(--bg-primary);
    color: var(--text-secondary);
    cursor: pointer;
    transition: all 0.2s;
    font-size: 0.875rem;
  }

  .tab-btn:hover {
    background: var(--bg-hover);
    color: var(--text-primary);
  }

  .tab-btn.active {
    background: var(--primary-color);
    color: white;
    border-color: var(--primary-color);
  }

  /* Timer Content */
  .timer-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    padding: 1.5rem;
    overflow-y: auto;
  }

  .timer-display-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    padding: 2rem;
    background: var(--bg-secondary);
    border-radius: 8px;
    border: 1px solid var(--border-color);
  }

  .timer-controls {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .activity-section {
    flex: 1;
    min-height: 0;
  }

  /* Tasks Content */
  .tasks-content {
    flex: 1;
    overflow: hidden;
  }

  /* Buttons */
  .btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    border: 1px solid var(--border-color);
    border-radius: 6px;
    background: var(--bg-primary);
    color: var(--text-primary);
    cursor: pointer;
    font-size: 0.875rem;
    font-weight: 500;
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

  /* Responsive Design */
  @media (max-width: 768px) {
    .app-header {
      padding: 0.75rem 1rem;
    }

    .timer-content {
      padding: 1rem;
    }

    .timer-display-section {
      padding: 1.5rem;
    }

    .header-right {
      gap: 0.5rem;
    }
  }
</style>
