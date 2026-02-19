# Deployment Guide

This document outlines the steps to deploy the `ormmakkurippu` backend and frontend to a Windows Server with IIS and PM2.

## Prerequisites

- **Node.js** (v18+)
- **PM2** (`npm install -g pm2`)
- **IIS** with URL Rewrite Module and ARR (Application Request Routing)
- **Git**

## Environment Variables

Ensure the `.env` file is present in `server/` with the following production values:

```env
NODE_ENV=production
PORT=4000
CLIENT_ORIGIN=https://ok.lumen-path.com
# Database
USE_LOCAL_DB=false (or true for specific use cases)
LOCAL_DB_PATH=C:\ProgramData\Ormmakurippu\Data
# Firebase / Google
GOOGLE_PROJECT_ID=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

## Backend Deployment (Node/Express)

1. **Pull Latest Code**:
   ```powershell
   cd C:\inetpub\wwwroot\ormmakkurippu
   git pull origin main
   ```

2. **Install Dependencies**:
   ```powershell
   cd server
   npm ci --omit=dev
   ```

3. **Start/Restart with PM2**:
   ```powershell
   # If starting for the first time:
   pm2 start src/index.js --name "ormmakurippu-api" --time
   
   # If updating:
   pm2 reload ormmakurippu-api
   ```

4. **Persist PM2 on Reboot**:
   ```powershell
   pm2 save
   # Generate startup script (run as Admin if needed, or use pm2-service-install on Windows)
   npm install -g pm2-windows-startup
   pm2-startup install
   ```

## Frontend Deployment (IIS Static Site)

1. **Build Frontend**:
   ```powershell
   cd client
   npm ci
   npm run build
   ```

2. **Copy to Web Root**:
   Copy the contents of `client/dist` to the IIS website folder (e.g., `C:\inetpub\wwwroot\ok.lumen-path.com`).

3. **Web.config (Important)**:
   Ensure `web.config` is present in the root to handle client-side routing and proxy API requests.

   ```xml
   <?xml version="1.0" encoding="UTF-8"?>
   <configuration>
     <system.webServer>
       <rewrite>
         <rules>
           <!-- API Proxy: Forward /api requests to Node.js on port 4000 -->
           <rule name="ReverseProxyInboundRule1" stopProcessing="true">
             <match url="^api/(.*)" />
             <action type="Rewrite" url="http://localhost:4000/api/{R:1}" />
           </rule>
           
           <!-- SPA Routing: Redirect all other requests to index.html -->
           <rule name="React Routes" stopProcessing="true">
             <match url=".*" />
             <conditions logicalGrouping="MatchAll">
               <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
               <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
               <add input="{REQUEST_URI}" pattern="^/api/" negate="true" />
             </conditions>
             <action type="Rewrite" url="/" />
           </rule>
         </rules>
       </rewrite>
     </system.webServer>
   </configuration>
   ```

## Verification

1. Check PM2 status: `pm2 status`
2. check logs: `pm2 logs ormmakurippu-api`
3. Visit `https://ok.lumen-path.com/health` (proxies to `http://localhost:4000/health`) - should return JSON.

## Troubleshooting

- **502 Bad Gateway**: Check if Node process is running on port 4000.
- **500 Internal Server Error**: Check PM2 logs for exceptions.
- **CORS Errors**: Verify `CLIENT_ORIGIN` matches the browser URL.
