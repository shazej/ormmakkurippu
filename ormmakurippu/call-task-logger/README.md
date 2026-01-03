# Call Task Logger

A full-stack application for logging call tasks.

## Project Structure
- `client`: React frontend (Vite)
- `server`: Node.js/Express backend (SQLite)

## Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- npm

### Installation
Install dependencies for both client and server:
```bash
npm run install:all
```

## Production Deployment

To run the application in production mode (server serving client files):

1.  **Build the Client**:
    ```bash
    npm run build
    ```
    This generates static files in `client/dist`.

2.  **Start the Server**:
    ```bash
    npm run start
    ```
    The server will start on port 3001 (default) and serve the client app.

    Open [http://localhost:3001](http://localhost:3001) in your browser.

## Development

To run client and server separately for development:

1.  Start Server:
    ```bash
    cd server
    npm start
    ```
2.  Start Client:
    ```bash
    cd client
    npm run dev
    ```
