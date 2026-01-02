# Ormmakkurippu (Call Task Logger)

## PWA Support
This application is configured as a Progressive Web App (PWA).

### Testing PWA Locally
To test the PWA features (installability, offline caching):
1. Build the client:
    ```bash
    cd call-task-logger/client
    npm run build
    ```
2. Preview the build:
    ```bash
    npm run preview
    ```
3. Open `http://localhost:4173` (or the port shown) in Chrome.
4. Open DevTools -> Application tab.
5. Verify "Manifest" and "Service Workers" sections.


A production-ready application for logging and managing call-related tasks, built with React, Node.js, and SQLite.

# shaz assistant

## Development

### Prerequisites
- Node.js installed

### Setup
1. Install all dependencies:
   ```bash
   npm run install:all
   ```


### Running the App
Start both server and client (concurrently) in development mode:
```bash
npm run dev
```

### Production Deployment
To run the application in production mode (server serving client files):
1. Navigate to the project directory:
   ```bash
   cd call-task-logger
   ```
2. Build and Start:
   ```bash
   npm run build
   npm run start
   ```
   *The server will serve the static client files on http://localhost:3001*


### Directory Structure
- `call-task-logger/server`: Backend API
- `call-task-logger/client`: Frontend React App

## Features
- **Task Management**: Create, read, update, and delete tasks.
- **Filtering**: Filter by search text, category, priority, and status.
- **CSV Export**: Export all tasks to CSV for external analysis.
- **Validation**: Strict input validation with inline error messages.
- **Responsive**: Mobile-friendly UI.

## Prerequisites
- Node.js (v18 or higher recommended)
- npm (v9 or higher)

## Getting Started

### 1. Quick Start
The easiest way to run the application is using the root-level scripts.

```bash
# Install all dependencies (root, server, and client)
npm run install:all

# Start both server and client concurrently
npm run dev
```
*Server runs on http://localhost:3001, Client on http://localhost:5173*

### 2. Manual Setup (Alternative)
If you prefer to run them separately:
**Backend**:
```bash
cd call-task-logger/server
npm install
node seed.js # Initialize database
node index.js
```

**Frontend**:
```bash
cd call-task-logger/client
npm install
npm run dev
```

## Usage Guide
- **Creating Tasks**: Click "New Task" in the top right. Fill in the required fields (Name, Description).
- **Filtering**: Use the dropdowns or search bar to filter the list. Click "Reset" to clear filters.
- **Editing**: Click the pencil icon on any task card.
- **Deleting**: Click the trash icon (requires confirmation).
- **Exporting**: Click "Export CSV" to download a full report of all tasks.

## Troubleshooting
- **Port Conflicts**: Ensure ports 3001 and 5173 are free.
- **Database Errors**: If you encounter DB errors, try deleting `call-task-logger/server/tasks.db` and running `node seed.js` again.
- **Network Issues**: Ensure the frontend proxy in `vite.config.js` matches the backend URL (`http://localhost:3001`).

## Development
- **Backend Tests**: Run `npm test` in the `server` directory.
- **Linting**: Run `npm run lint` in the `client` directory.

