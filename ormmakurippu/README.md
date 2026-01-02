# ormmakurippu

Call Task Logger application.

## Structure

- **/server**: Node.js + Express + SQLite API.
- **/client**: React + Vite + Tailwind CSS Frontend.

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- npm

### Installation & Running

#### Server
1. Navigate to the server directory:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the server:
   - Development (with nodemon):
     ```bash
     npm run dev
     ```
   - Production:
     ```bash
     npm start
     ```
   The server runs on **http://localhost:4000**.

#### Client
1. Open a new terminal and navigate to the client directory:
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
   The client runs on **http://localhost:5173** (default Vite port).

## Features
- Create tasks with title and description.
- View list of recent tasks.
- Data persistence using SQLite (`server/data/tasks.db`).
