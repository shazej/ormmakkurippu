# Production Deployment Plan (IIS)

This plan covers the deployment of the Ormmakkurippu application to a Windows IIS server.

## Proposed Changes

### Build Local
- Build the React client: `npm run build` in `client/`.
- Prepare the server: Ensure `server/` is ready for deployment (Prisma client generated).

### Remote Server Configuration
- **IIS Site**: Create/Verify `ok.lumen-path.com`.
- **Bindings**: Port 80 (and 443 if SSL is ready).
- **App Pool**: Dedicated Integrated App Pool.
- **URL Rewrite & ARR**: Ensure installed for reverse proxy.
- **Node.js**: Ensure Node.js is installed on the server to run the backend.
- **Backend Persistence**: Used Windows Scheduled Task (via PowerShell script) to manage the backend process instead of PM2, ensuring it survives session termination and restarts on reboot.

## Step-by-Step Execution

1. **Build Client**: Run `npm run build` locally.
2. **SSH Connection**: Connect to `38.247.138.151`.
3. **IIS Inspection**:
   - `Get-Website` to find `ok.lumen-path.com`.
   - `Get-WebBinding` to check host headers.
   - `Get-ItemProperty` to find physical path.
4. **Site Preparation**:
   - Create directories if missing.
   - Configure App Pool permissions.
5. **Backup**: Zip/Rename existing folder on server.
6. **Upload**:
   - Upload `client/dist/` contents to web root.
   - Upload `server/` contents to a backend folder (e.g., `C:\apps\ormmakurippu-server`).
   - Upload root `web.config` to web root.
7. **Environment**:
   - Create/Update `.env` on server with production values.
8. **Process Management**:
   - Start Node.js backend using a Windows Scheduled Task (`OrmmakurippuBackend`).
9. **IIS Configuration**:
   - Enable Reverse Proxy in ARR.
   - Apply `web.config`.
10. **Verification**:
    - Test locally on server: `Invoke-WebRequest http://localhost`.
    - Test accessibility via `ok.lumen-path.com`.

## Verification Plan

### Manual Verification
- Verify homepage loads.
- Verify API health check: `http://ok.lumen-path.com/api/health`.
- Verify login page and demo auth.
