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
  let showTasks = $state(true);
  let currentTab = $state<"timer" | "tasks">("tasks");
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
{#if isLoading}
  <div class="flex items-center justify-center h-full">
    <div
      class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"
    ></div>
    <p class="ml-3 text-gray-600 dark:text-gray-400">Loading Tikker...</p>
  </div>
{:else}
  <div
    class="flex flex-col h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
  >
    <!-- Header -->
    <header
      class="flex items-center justify-between p-2 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
    >
      <div class="flex items-center gap-2">
        <h1 class="text-lg font-semibold">Tikker</h1>
        <StatusIndicator size="small" />
      </div>

      <div class="flex items-center gap-2">
        <ProfileSelector on:select={handleProfileSelect} />
        <div class="text-sm">
          {#if connectionState.isConnected}
            <span class="text-green-600 dark:text-green-400">Connected</span>
          {:else if connectionState.isConnecting}
            <span class="text-yellow-600 dark:text-yellow-400"
              >Connecting...</span
            >
          {:else}
            <span class="text-red-600 dark:text-red-400">Disconnected</span>
          {/if}
        </div>
        <button
          class="flex items-center justify-center w-8 h-8 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 cursor-pointer transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-blue-500"
          onclick={() => (showSettings = true)}
          title="Settings"
        >
          <Settings size={16} />
        </button>
      </div>
    </header>

    <!-- Main Content -->
    <main class="flex-1 overflow-hidden flex flex-col">
      {#if !currentProfile}
        <!-- Setup Screen -->
        <div class="flex items-center justify-center h-full p-4">
          <div class="text-center max-w-md text-gray-600 dark:text-gray-400">
            <h2
              class="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100"
            >
              Welcome to Tikker
            </h2>
            <p class="mb-4">
              To get started, you need to configure your Kimai connection
              settings.
            </p>
            <button
              class="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
              onclick={() => (showSettings = true)}
            >
              <Settings size={14} />
              Open Settings
            </button>
          </div>
        </div>
      {:else if connectionState.error}
        <!-- Error Screen -->
        <div class="flex items-center justify-center h-full p-4">
          <div class="text-center max-w-md text-gray-600 dark:text-gray-400">
            <h2
              class="text-xl font-semibold mb-2 text-red-600 dark:text-red-400"
            >
              Connection Error
            </h2>
            <p class="mb-4">
              {connectionState.error}
            </p>
            <button
              class="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
              onclick={() => (showSettings = true)}
            >
              <Settings size={14} />
              Check Settings
            </button>
          </div>
        </div>
      {:else}
        <!-- Main Interface -->
        <div class="flex-1 flex flex-col overflow-hidden">
          <!-- Timer Section -->
          <div class="flex-1 flex flex-col overflow-hidden">
            <div
              class="flex items-center gap-3 p-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
            >
              <h2 class="text-base font-semibold">Time Tracking</h2>
              <button
                class="flex items-center gap-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 cursor-pointer transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-600 text-sm {currentTab ===
                'timer'
                  ? 'bg-blue-600 text-blue-50 border-blue-600'
                  : ''}"
                onclick={() => (currentTab = "timer")}
              >
                <Clock size={14} />
                Timer
              </button>
              <button
                class="flex items-center gap-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 cursor-pointer transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-600 text-sm {currentTab ===
                'tasks'
                  ? 'bg-blue-600 text-blue-50 border-blue-600'
                  : ''}"
                onclick={toggleTasks}
              >
                <ListTodo size={14} />
                Tasks
              </button>
            </div>

            {#if currentTab === "timer"}
              <div class="flex-1 flex flex-col gap-4 p-4 overflow-y-auto">
                <!-- Timer Display -->
                <div
                  class="flex flex-col items-center gap-3 p-6 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  <TimerDisplay size="large" />
                  <div class="flex items-center gap-3">
                    <PlayButton size="large" showReset={true} />
                  </div>
                </div>

                <!-- Activity Widget -->
                <div class="flex-1 min-h-0">
                  <ActivityWidget />
                </div>
              </div>
            {:else}
              <div class="flex-1 overflow-hidden flex flex-col">
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
