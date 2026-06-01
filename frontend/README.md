# FaceChat Frontend

## Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Build for production:
```bash
npm run build
```

## Features

- Modern React.js frontend with Vite
- TailwindCSS for styling
- Socket.io for real-time communication
- Zustand for state management
- Responsive design with mobile support
- Dark mode support

## Pages

### Public
- Login

### User (Protected)
- Feed - Social media feed with posts
- Messages - Real-time chat
- Friends - Friend management
- Profile - User profile
- Notifications - Notification center
- Settings - Account and app settings

### Admin (Protected)
- Dashboard - Admin analytics
- Users - User management
- Settings - System settings

## Components

### UI Components
- Button
- Input
- Textarea
- Card
- Modal
- Avatar

### Layout Components
- Layout - Main app layout with sidebar navigation

## State Management

- `authStore` - Authentication state
- `chatStore` - Chat state

## API Configuration

API requests are proxied through Vite to the backend server running on port 5000.

## Environment

The frontend runs on port 3000 by default and proxies API requests to the backend.
