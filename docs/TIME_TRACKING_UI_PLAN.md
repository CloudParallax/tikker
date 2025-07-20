# Time Tracking UI Implementation Plan

## Overview

This document outlines the plan to implement a clean, minimalist time tracking UI for Tikker, inspired by the reference design. The interface will focus on efficient time tracking with a prominent timer display, status indicators, and quick access to common actions.

## UI Design Analysis

### Reference Design Elements
1. **Time Tracking Controls Section**
   - Large play button (start/stop timer)
   - Status indicator ("No Entry" label)
   - Digital timer display (00:00:00 format)
   - Time range display (start time → now)
   - Action icon for current entry management

2. **Recent Tasks Section**
   - Section heading
   - Empty content area for task history

3. **Global Actions**
   - Add button (+ icon)
   - Settings button (gear icon)

4. **Visual Design**
   - Dark grey color scheme
   - Light grey and white text/icons
   - Green accent for status indicators
   - Clean, minimalist aesthetic

## Implementation Architecture

### Component Structure
```
src/
├── lib/
│   ├── components/
│   │   ├── TimeTracker/
│   │   │   ├── TimeTracker.svelte          # Main time tracking component
│   │   │   ├── TimerDisplay.svelte         # Digital timer display
│   │   │   ├── PlayButton.svelte           # Start/stop button
│   │   │   ├── StatusIndicator.svelte      # Status label
│   │   │   ├── TimeRange.svelte            # Start time → now display
│   │   │   └── EntryActions.svelte         # Current entry management
│   │   ├── TaskList/
│   │   │   ├── TaskList.svelte             # Recent tasks container
│   │   │   ├── TaskItem.svelte             # Individual task item
│   │   │   └── EmptyState.svelte           # Empty state for no tasks
│   │   ├── Actions/
│   │   │   ├── AddButton.svelte            # Add new entry button
│   │   │   └── SettingsButton.svelte       # Settings access button
│   │   └── ui/
│   │       ├── Button.svelte               # Reusable button component
│   │       ├── Icon.svelte                 # Icon component
│   │       └── Card.svelte                 # Card container component
│   ├── stores/
│   │   ├── timer.ts                        # Timer state management
│   │   ├── tasks.ts                        # Tasks state management
│   │   └── settings.ts                     # Settings state
│   ├── types/
│   │   ├── timer.ts                        # Timer-related types
│   │   ├── task.ts                         # Task-related types
│   │   └── settings.ts                     # Settings types
│   └── utils/
│       ├── time.ts                         # Time formatting utilities
│       ├── storage.ts                      # Local storage utilities
│       └── icons.ts                        # Icon definitions
├── routes/
│   ├── +layout.svelte                      # Main layout with tray
│   ├── +page.svelte                        # Main time tracking page
│   ├── settings/+page.svelte               # Settings page
│   └── tasks/+page.svelte                  # Task management page
```

## Implementation Checklist

### Phase 1: Core Timer Functionality
- [ ] **1.1 Timer State Management**
  - [ ] Create timer store with Svelte state
  - [ ] Implement start/stop timer logic
  - [ ] Add timer persistence to local storage
  - [ ] Create timer tick mechanism (1-second intervals)

- [ ] **1.2 Timer Display Component**
  - [ ] Build digital timer display (HH:MM:SS format)
  - [ ] Implement smooth timer updates
  - [ ] Add time formatting utilities
  - [ ] Create responsive timer sizing

- [ ] **1.3 Play Button Component**
  - [ ] Design play/pause button with proper states
  - [ ] Implement button animations and transitions
  - [ ] Add hover and active states
  - [ ] Create icon switching logic (play/pause)

### Phase 2: Status and Information Display
- [ ] **2.1 Status Indicator**
  - [ ] Create status label component
  - [ ] Implement status states (No Entry, Running, Paused)
  - [ ] Add color-coded status indicators
  - [ ] Create status text management

- [ ] **2.2 Time Range Display**
  - [ ] Build time range component (start → now)
  - [ ] Implement start time tracking
  - [ ] Add real-time range updates
  - [ ] Create time formatting for range display

- [ ] **2.3 Entry Actions**
  - [ ] Design entry management icon
  - [ ] Implement entry actions menu
  - [ ] Add quick actions (pause, stop, edit)
  - [ ] Create action confirmation dialogs

### Phase 3: Task Management Interface
- [ ] **3.1 Task List Component**
  - [ ] Create task list container
  - [ ] Implement task item components
  - [ ] Add task filtering and sorting
  - [ ] Create empty state component

- [ ] **3.2 Task Item Design**
  - [ ] Design individual task item layout
  - [ ] Add task information display (name, duration, time)
  - [ ] Implement task actions (resume, edit, delete)
  - [ ] Create task item animations

- [ ] **3.3 Task Data Management**
  - [ ] Create task data structure
  - [ ] Implement task storage and retrieval
  - [ ] Add task CRUD operations
  - [ ] Create task synchronization

### Phase 4: Global Actions and Navigation
- [ ] **4.1 Add Button**
  - [ ] Design add button with plus icon
  - [ ] Implement add task/entry functionality
  - [ ] Create add entry modal/dialog
  - [ ] Add keyboard shortcuts

- [ ] **4.2 Settings Button**
  - [ ] Design settings button with gear icon
  - [ ] Implement settings navigation
  - [ ] Create settings page layout
  - [ ] Add settings persistence

- [ ] **4.3 Navigation and Layout**
  - [ ] Implement main page layout
  - [ ] Add responsive design considerations
  - [ ] Create navigation between views
  - [ ] Implement keyboard navigation

### Phase 5: Visual Design and Polish
- [ ] **5.1 Color Scheme Implementation**
  - [ ] Define CSS custom properties for colors
  - [ ] Implement dark grey theme
  - [ ] Add accent color (green) for status
  - [ ] Create consistent color usage

- [ ] **5.2 Typography and Spacing**
  - [ ] Implement consistent font sizing
  - [ ] Add proper spacing and padding
  - [ ] Create responsive typography
  - [ ] Implement text hierarchy

- [ ] **5.3 Animations and Transitions**
  - [ ] Add smooth button transitions
  - [ ] Implement timer update animations
  - [ ] Create loading states
  - [ ] Add micro-interactions

### Phase 6: Advanced Features
- [ ] **6.1 Keyboard Shortcuts**
  - [ ] Implement spacebar for start/stop
  - [ ] Add escape key for canceling
  - [ ] Create shortcut key combinations
  - [ ] Add keyboard shortcut help

- [ ] **6.2 System Integration**
  - [ ] Integrate with system tray
  - [ ] Add desktop notifications
  - [ ] Implement global hotkeys
  - [ ] Create system menu integration

- [ ] **6.3 Data Persistence**
  - [ ] Implement local storage for tasks
  - [ ] Add timer state persistence
  - [ ] Create data export/import
  - [ ] Add backup and restore functionality

## Technical Implementation Details

### Timer State Management
```typescript
// stores/timer.ts
interface TimerState {
  isRunning: boolean;
  startTime: Date | null;
  elapsedTime: number;
  currentTask: Task | null;
  status: 'idle' | 'running' | 'paused';
}

// Timer store with Svelte state
let timerState = $state<TimerState>({
  isRunning: false,
  startTime: null,
  elapsedTime: 0,
  currentTask: null,
  status: 'idle'
});
```

### Component Structure Example
```svelte
<!-- TimeTracker.svelte -->
<script lang="ts">
  import TimerDisplay from './TimerDisplay.svelte';
  import PlayButton from './PlayButton.svelte';
  import StatusIndicator from './StatusIndicator.svelte';
  import TimeRange from './TimeRange.svelte';
  import EntryActions from './EntryActions.svelte';
  
  // Timer logic and state management
</script>

<div class="time-tracker">
  <div class="timer-controls">
    <PlayButton />
    <div class="timer-info">
      <StatusIndicator />
      <TimerDisplay />
      <TimeRange />
    </div>
    <EntryActions />
  </div>
</div>
```

### CSS Design System
```css
/* Design tokens */
:root {
  --color-bg-primary: #2f2f2f;
  --color-bg-secondary: #3f3f3f;
  --color-text-primary: #ffffff;
  --color-text-secondary: #cccccc;
  --color-accent: #4ade80;
  --color-button: #4f4f4f;
  --color-button-hover: #5f5f5f;
  
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;
  
  --border-radius: 0.5rem;
  --transition: 0.2s ease-in-out;
}
```

## Dependencies to Add

### Frontend Dependencies
```json
{
  "dependencies": {
    "date-fns": "^3.0.0",
    "lucide-svelte": "^0.263.0",
    "svelte-transition": "^1.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.6.3"
  }
}
```

## Success Criteria

- [ ] Timer starts/stops with play button
- [ ] Digital timer displays accurate time in HH:MM:SS format
- [ ] Status indicator shows current state (No Entry, Running, etc.)
- [ ] Time range displays start time → now when running
- [ ] Recent tasks section shows task history
- [ ] Add and settings buttons are functional
- [ ] UI matches reference design aesthetic
- [ ] Responsive design works on different screen sizes
- [ ] Keyboard shortcuts work for common actions
- [ ] Data persists between app sessions

## Timeline Estimate

- **Phase 1**: 1-2 weeks
- **Phase 2**: 1 week
- **Phase 3**: 1-2 weeks
- **Phase 4**: 1 week
- **Phase 5**: 1 week
- **Phase 6**: 1-2 weeks

**Total Estimated Time**: 6-9 weeks

## Next Steps

1. Set up the basic project structure
2. Implement core timer functionality
3. Create the main UI components
4. Add visual design and polish
5. Integrate with system features
6. Test and refine the user experience

---

*This plan focuses on creating a clean, efficient time tracking interface that prioritizes usability and visual appeal while maintaining the minimalist aesthetic of the reference design.* 