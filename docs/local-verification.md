# Local Verification Checklist

**Environment setup:**
1. Ensure `.env.local` is present in the root folder with `DEMO_AUTH=true`.
2. Run `npm run install:all` to install all necessary dependencies.
3. Start the application by running `npm run dev`.
4. Wait for both backend and frontend servers to be ready.

**Required Checks:**

| Step | Test Name | Description | Status |
|---|---|---|---|
| **0** | **Boot + Build** | - `npm run dev` starts correctly.<br>- Client loads at `http://localhost:5173` without console errors.<br>- `npm run build` succeeds (test separately).<br>- `GET http://localhost:4000/health` returns HTTP 200 with `{ok: true, demoAuth: true}`. | [ ] |
| **1** | **Public Landing Page** | - Go to `http://localhost:5173/` while logged out.<br>- Must NOT redirect to `/login` immediately.<br>- Clicking "Start for free" goes to `/login`.<br>- While logged IN, "Start for free" goes to `/app`. | [ ] |
| **2** | **DEMO Login** | - Go to `/login`. Shows "Demo login".<br>- Choose `owner@demo.local`.<br>- Verify token is stored and `GET /api/users/me` returns the profile. | [ ] |
| **3** | **Auto-Provisioning User Record** | - Verify a new user record was created in the database for `owner@demo.local`.<br>- Re-login does not duplicate the record. | [ ] |
| **4** | **Onboarding Wizard** | - Start onboarding.<br>- Verify progress saves after each step.<br>- Refreshing the page resumes on the correct step.<br>- Attempting to go to `/app` directly redirects back to the incomplete step. | [ ] |
| **5** | **Workspace Creation** | - Complete the workspace creation step.<br>- Verify invalid names return a 400 error (readable JSON).<br>- Verify `user.workspace_id` is updated and membership role is `OWNER`. | [ ] |
| **6** | **Workspace Members & RBAC** | - Owner: `GET /api/workspaces/current` works.<br>- Member (`member@demo.local` without invite): `GET /api/workspaces/current` returns 403. | [ ] |
| **7** | **Invite Members by Email** | - Owner invites `member@demo.local` and `newperson@demo.local`.<br>- `member@demo.local` invite is auto-accepted (since it exists).<br>- `newperson@demo.local` stays pending. | [ ] |
| **8** | **Auto-Activate Pending Invites** | - Owner invites `another@demo.local`.<br>- Log in as `another@demo.local` (might need code adjustment for this specific test case or mock login).<br>- The invite should auto-activate upon login. | [ ] |
| **9** | **Use-Case Selection** | - Verify the use-case selection in onboarding persists. | [ ] |
| **10** | **Profile Completion** | - Update display name. Verify `/api/users/me` reflects the change. | [ ] |
| **11** | **Welcome Step** | - "Let's go" marks onboarding as completed (`is_onboarded=true`) and redirects to `/app`.<br>- Onboarding cannot repeat. | [ ] |
| **12** | **Main App Layout** | - Sidebar and main panel load correctly. No Flash of Unstyled Content (FOUC). | [ ] |
| **13** | **Task Creation** | - Create a task.<br>- Verify 201 response, appears instantly in UI, persists after refresh. | [ ] |
| **14** | **Task Edit & Completion** | - Edit title/description/dueDate.<br>- Toggle complete/reopen persists. | [ ] |
| **15** | **Soft Delete** | - Delete a task. Verify `deleted_at` is set, but row exists in DB.<br>- Verify it disappears from the default list. | [ ] |
| **16** | **Task Assignment** | - Assign task to `member@demo.local`.<br>- Verify `assigned_to_user_id` is set appropriately. | [ ] |
| **17** | **Pending Assignment Activation** | - Assign to `pending@demo.local`.<br>- Verify `assigned_to_email` is set.<br>- Upon their first login, it should convert to `assigned_to_user_id`. | [ ] |
| **18** | **Strict Task Visibility** | - Login as member.<br>- Can only view assigned tasks or tasks where member is the owner.<br>- Direct access to other user's task ID returns 403. | [ ] |
| **19** | **Assigned To Me View** | - Member: `GET /api/tasks/assigned-to-me` returns only relevant tasks.<br>- UI matches. | [ ] |
| **20** | **Search Tasks** | - Search works, filters correctly, excludes soft-deleted tasks. | [ ] |
| **21** | **Call Logs** | - Add manual call log (E.164 verification).<br>- Invalid phone number returns 400. | [ ] |
| **22** | **Contacts** | - Add/edit/search works.<br>- Unique per owner + phone is enforced. | [ ] |
| **23** | **Create Task From Call** | - Create a task directly from a call log row.<br>- Verifies relationship (`related_call_log_id`, `caller_phone_e164`). | [ ] |
| **24** | **Caller Privacy Masking** | - Verify phone number is masked for assigned users unless `share_caller_details=true`. | [ ] |
| **25** | **Audit Logging** | - Admin only: `GET /api/admin/audit-logs` returns 200.<br>- Non-admin: Returns 403.<br>- Sensitive data (like full auth tokens) should not be logged. | [ ] |
| **26** | **Structured Errors** | - Check various endpoints with bad data.<br>- Responses MUST be `{success: false, error: 'readable string'}` with no stack traces. | [ ] |
| **27** | **Production-like Hardening** | - Server checks environment variables correctly on startup.<br>- CORS allows localhost in dev/demo mode only. | [ ] |

## Automation Result Notes
*(leave space for the automated test suite results to be summarized)*

## Pending Code adjustments / TODOs identified during testing:
- None yet.
