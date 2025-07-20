# Kemai to Tikker Migration Plan

## Overview

This document outlines the plan to replicate the functionality of Kemai (a Qt6-based Kimai desktop client) into Tikker (a SvelteKit-Tauri application). Kemai is a time tracking desktop application that connects to Kimai instances via API for time sheet management, project tracking, and activity monitoring.

## Core Kemai Functionality Analysis

### 1. **Kimai API Integration**
- **Purpose**: Connects to Kimai time tracking server instances
- **Key Features**:
  - Authentication (legacy username/token and API token)
  - Version checking and compatibility
  - User profile management
  - Time sheet operations (start, stop, update)
  - Project, customer, and activity management
  - Task management (start, close)
  - Cache synchronization

### 2. **Time Tracking Interface**
- **Activity Widget**: Main time tracking interface
  - Customer/Project/Activity selection dropdowns
  - Start/Stop timer controls
  - Duration display and editing
  - Recent time sheets history
  - Add new customers/projects/activities
- **Task Widget**: Task-based time tracking
  - Task list with filtering
  - Start/stop tasks
  - Close completed tasks

### 3. **System Integration**
- **System Tray**: Minimize to tray, quick access
- **Desktop Events Monitor**: 
  - Screen lock detection
  - Idle time detection
  - Automatic time sheet stopping
- **Auto-refresh**: Periodic synchronization with server

### 4. **Settings & Configuration**
- **Profile Management**: Multiple Kimai server connections
- **UI Preferences**: Language, geometry, tray behavior
- **Event Settings**: Lock/idle detection preferences
- **Trusted Certificates**: SSL certificate management

### 5. **Logging & Debugging**
- **Logging System**: Console and file logging
- **Logger Widget**: Real-time log viewing
- **Error Handling**: SSL errors, network issues

## Migration Architecture

### Frontend (SvelteKit)
```
src/
├── lib/
│   ├── components/
│   │   ├── ActivityWidget.svelte      # Main time tracking interface
│   │   ├── TaskWidget.svelte          # Task management interface
│   │   ├── SettingsDialog.svelte      # Settings configuration
│   │   ├── LoggerWidget.svelte        # Log viewing component
│   │   ├── CustomerDialog.svelte      # Add/edit customers
│   │   ├── ProjectDialog.svelte       # Add/edit projects
│   │   ├── ActivityDialog.svelte      # Add/edit activities
│   │   └── ui/                        # Reusable UI components
│   ├── stores/
│   │   ├── kimai.ts                   # Kimai API state management
│   │   ├── settings.ts                # Application settings
│   │   ├── session.ts                 # Current session state
│   │   └── logger.ts                  # Logging state
│   ├── types/
│   │   ├── kimai.ts                   # Kimai API types
│   │   ├── settings.ts                # Settings types
│   │   └── session.ts                 # Session types
│   └── utils/
│       ├── kimai-api.ts               # Kimai API client
│       ├── settings-manager.ts        # Settings persistence
│       └── logger.ts                  # Logging utilities
├── routes/
│   ├── +layout.svelte                 # Main layout with tray
│   ├── +page.svelte                   # Main activity view
│   ├── tasks/+page.svelte             # Task management view
│   ├── settings/+page.svelte          # Settings view
│   └── logs/+page.svelte              # Log viewer
```

### Backend (Tauri/Rust)
```
src-tauri/src/
├── kimai/
│   ├── client.rs                      # Kimai API client
│   ├── models.rs                      # Data structures
│   ├── auth.rs                        # Authentication handling
│   └── cache.rs                       # Cache management
├── settings/
│   ├── manager.rs                     # Settings persistence
│   └── models.rs                      # Settings structures
├── events/
│   ├── desktop_monitor.rs             # Desktop events monitoring
│   ├── idle_detector.rs               # Idle time detection
│   └── lock_detector.rs               # Screen lock detection
├── tray/
│   └── mod.rs                         # System tray management
├── commands.rs                        # Tauri commands
└── lib.rs                             # Main application logic
```

## Implementation Checklist

### Phase 1: Foundation & Core Infrastructure
- [ ] **1.1 Project Setup**
  - [ ] Update package.json with required dependencies
  - [ ] Configure Tauri capabilities for network access
  - [ ] Set up TypeScript types for Kimai API
  - [ ] Create basic project structure

- [ ] **1.2 Settings System**
  - [ ] Implement settings storage in Rust backend
  - [ ] Create settings management commands
  - [ ] Build settings UI components
  - [ ] Add profile management functionality

- [ ] **1.3 Logging System**
  - [ ] Implement logging in Rust backend
  - [ ] Create log viewer component
  - [ ] Add log persistence and rotation
  - [ ] Connect frontend logging display

### Phase 2: Kimai API Integration
- [ ] **2.1 API Client**
  - [ ] Implement Kimai API client in Rust
  - [ ] Add authentication methods (legacy + API token)
  - [ ] Create API response models
  - [ ] Add error handling and SSL support

- [ ] **2.2 Core API Operations**
  - [ ] Version checking and compatibility
  - [ ] User authentication and profile
  - [ ] Customer management (list, add)
  - [ ] Project management (list, add)
  - [ ] Activity management (list, add)
  - [ ] Time sheet operations (start, stop, update)
  - [ ] Task management (list, start, close)

- [ ] **2.3 Cache System**
  - [ ] Implement data caching
  - [ ] Add cache synchronization
  - [ ] Create cache invalidation logic

### Phase 3: User Interface
- [ ] **3.1 Main Activity Widget**
  - [ ] Create customer/project/activity dropdowns
  - [ ] Implement start/stop timer controls
  - [ ] Add duration display and editing
  - [ ] Build recent time sheets history
  - [ ] Add new item dialogs (customer, project, activity)

- [ ] **3.2 Task Widget**
  - [ ] Create task list component
  - [ ] Implement task filtering
  - [ ] Add start/stop task controls
  - [ ] Build task completion functionality

- [ ] **3.3 Settings Interface**
  - [ ] Profile management UI
  - [ ] Application preferences
  - [ ] Event settings configuration
  - [ ] SSL certificate management

### Phase 4: System Integration
- [ ] **4.1 System Tray**
  - [ ] Implement tray icon and menu
  - [ ] Add minimize to tray functionality
  - [ ] Create quick actions menu
  - [ ] Handle tray activation events

- [ ] **4.2 Desktop Events Monitor**
  - [ ] Implement screen lock detection
  - [ ] Add idle time detection
  - [ ] Create automatic time sheet stopping
  - [ ] Add configurable event handling

- [ ] **4.3 Auto-refresh System**
  - [ ] Implement periodic synchronization
  - [ ] Add configurable refresh intervals
  - [ ] Create background sync logic

### Phase 5: Advanced Features
- [ ] **5.1 Multi-profile Support**
  - [ ] Profile switching functionality
  - [ ] Profile-specific settings
  - [ ] Auto-connect on startup

- [ ] **5.2 Data Management**
  - [ ] Export/import functionality
  - [ ] Data backup and restore
  - [ ] Cache management tools

- [ ] **5.3 Performance Optimization**
  - [ ] Implement efficient data loading
  - [ ] Add request batching
  - [ ] Optimize UI rendering

### Phase 6: Testing & Polish
- [ ] **6.1 Testing**
  - [ ] Unit tests for API client
  - [ ] Integration tests for UI components
  - [ ] End-to-end testing
  - [ ] Cross-platform testing

- [ ] **6.2 Error Handling**
  - [ ] Comprehensive error messages
  - [ ] Network error recovery
  - [ ] Graceful degradation

- [ ] **6.3 Documentation**
  - [ ] User documentation
  - [ ] API documentation
  - [ ] Development setup guide

## Technical Considerations

### Dependencies to Add

#### Frontend (package.json)
```json
{
  "dependencies": {
    "@tauri-apps/api": "^2.6.0",
    "@tauri-apps/plugin-opener": "^2.4.0",
    "date-fns": "^3.0.0",
    "svelte-stores": "^1.0.0",
    "svelte-spa-router": "^4.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.6.3"
  }
}
```

#### Backend (Cargo.toml)
```toml
[dependencies]
reqwest = { version = "0.11", features = ["json", "rustls-tls"] }
tokio = { version = "1.0", features = ["full"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
chrono = { version = "0.4", features = ["serde"] }
uuid = { version = "1.0", features = ["v4", "serde"] }
log = "0.4"
env_logger = "0.10"
```

### Key Differences from Kemai

1. **Technology Stack**: Qt6/C++ → SvelteKit/TypeScript + Tauri/Rust
2. **Architecture**: Monolithic Qt app → Web frontend + Rust backend
3. **State Management**: Qt signals/slots → Svelte stores + Tauri commands
4. **UI Framework**: Qt Widgets → Svelte components + Tailwind CSS
5. **System Integration**: Qt system tray → Tauri tray API
6. **Desktop Events**: Qt event system → Tauri + platform-specific APIs

### Migration Strategy

1. **Incremental Development**: Build features one by one, starting with core API
2. **Parallel Development**: Frontend and backend can be developed simultaneously
3. **Feature Parity**: Focus on matching Kemai's functionality exactly
4. **Modern UX**: Improve user experience where possible while maintaining familiarity
5. **Cross-platform**: Ensure compatibility with Windows, macOS, and Linux

## Success Criteria

- [ ] All Kemai features replicated with 100% functional parity
- [ ] Improved performance compared to Kemai
- [ ] Modern, responsive UI that works across platforms
- [ ] Comprehensive error handling and user feedback
- [ ] Full system tray integration
- [ ] Robust settings persistence
- [ ] Complete logging and debugging capabilities
- [ ] Automated testing coverage
- [ ] User documentation and setup guides

## Timeline Estimate

- **Phase 1**: 2-3 weeks
- **Phase 2**: 3-4 weeks  
- **Phase 3**: 3-4 weeks
- **Phase 4**: 2-3 weeks
- **Phase 5**: 2-3 weeks
- **Phase 6**: 2-3 weeks

**Total Estimated Time**: 14-20 weeks

## Risk Mitigation

1. **API Compatibility**: Test with multiple Kimai versions
2. **Platform Differences**: Early testing on all target platforms
3. **Performance**: Regular benchmarking against Kemai
4. **User Experience**: Gather feedback from Kemai users
5. **Technical Debt**: Maintain clean architecture throughout development

---

*This plan will be updated as development progresses and new requirements are discovered.* 