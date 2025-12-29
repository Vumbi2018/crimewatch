# Crimestoppers

## Overview

Crimestoppers is a mobile application for capturing and submitting crime evidence to law enforcement agencies. Built with Expo/React Native, the app allows users to capture photos and videos of incidents, tag them with location data and metadata, and submit reports to various law enforcement agencies. The app prioritizes security and privacy given the sensitive nature of crime evidence handling.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: Expo SDK 54 with React Native 0.81
- **Navigation**: React Navigation v7 with a hybrid navigation pattern
  - Bottom tab navigator (3 tabs: Evidence, Capture, Profile)
  - Native stack navigator for modal screens and detail views
- **State Management**: TanStack React Query for server state, React useState for local state
- **Styling**: React Native StyleSheet with a centralized theme system (Colors, Spacing, Typography constants)
- **Animations**: React Native Reanimated for smooth UI animations
- **Local Storage**: AsyncStorage for persisting evidence data and user profiles locally

### Key Screen Architecture
1. **CaptureScreen**: Full-screen camera interface using expo-camera for photo/video capture
2. **EvidenceScreen**: Gallery view of captured evidence with search/filter capabilities
3. **EvidenceDetailScreen**: Metadata editing for individual evidence items
4. **ProfileScreen**: User profile management and submission history
5. **ReportSubmissionScreen**: Form for submitting evidence to law enforcement agencies
6. **MapViewScreen**: Modal map view using react-native-maps for location visualization

### Backend Architecture
- **Runtime**: Node.js with Express
- **Server Entry**: `server/index.ts` handles CORS, body parsing, and static file serving
- **Routes**: Registered in `server/routes.ts` (currently minimal, prefixed with `/api`)
- **Storage Interface**: `server/storage.ts` defines an `IStorage` interface with in-memory implementation (ready for database migration)

### Data Storage
- **Database Schema**: Drizzle ORM with PostgreSQL configuration
- **Current Tables**: `users` table with id, username, password fields
- **Schema Location**: `shared/schema.ts` with Zod validation via drizzle-zod
- **Client-side**: AsyncStorage for offline evidence storage with structured Evidence and UserProfile types

### Path Aliases
- `@/` maps to `./client/`
- `@shared/` maps to `./shared/`

### Platform Permissions (Native)
- Camera access for evidence capture
- Microphone for video recording
- Location services for geotagging evidence
- Photo library for saving captured media

## External Dependencies

### Core Services
- **PostgreSQL**: Database (configured via DATABASE_URL environment variable)
- **Expo**: React Native development platform and build service

### Key NPM Packages
- `expo-camera`: Camera access for photo/video capture
- `expo-location`: GPS location services for evidence geotagging
- `react-native-maps`: Map display for location visualization
- `@react-native-async-storage/async-storage`: Local data persistence
- `drizzle-orm` + `pg`: PostgreSQL database ORM
- `@tanstack/react-query`: Server state management
- `react-native-reanimated`: Animation library

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string (required for backend)
- `EXPO_PUBLIC_DOMAIN`: API server domain for client-server communication
- `REPLIT_DEV_DOMAIN`: Development domain for Replit environment