# Verification Playbook — Ormmakkurippu

> Last updated: 2026-02-23

This document provides step-by-step verification for all major features of the application.
Each step includes Setup, Action, Expected Result, a cURL command, and a PASS/FAIL checkbox.

---

## Prerequisites

```bash
# Server (terminal 1)
cd server
cp .env.demo.example .env   # then edit DEMO_JWT_SECRET
DEMO_AUTH=true npm run dev

# Client (terminal 2)
cd client
cp .env.demo.example .env.local
npm run dev
```

Health check:
```bash
curl http://localhost:4000/health
# Expected: {"ok":true, ...}
```

---

## STEP 0 — Build & Boot

| | Check |
|---|---|
| `npm run build` (client) succeeds | `[ ]` |
| Server starts without errors | `[ ]` |
| GET /health returns 200 `{"ok":true}` | `[ ]` |

```bash
# Quick boot check
curl -s http://localhost:4000/health | python3 -m json.tool
```

**Expected:** `{"ok": true, "dbProvider": "...", "env": "development", ...}`

---

## STEP 1 — Public Landing Page

**Action:** Visit `http://localhost:3000/` while logged out.

| | Check |
|---|---|
| Landing page loads (not redirected to /login) | `[ ]` |
| CTA "Start for free" links to /login when logged out | `[ ]` |
| No console errors | `[ ]` |

---

## STEP 2 — DEMO Login

**Setup:** `VITE_DEMO_AUTH=true` in `client/.env.local`, `DEMO_AUTH=true` in `server/.env`.

**Action:** Visit `/login`, click **Demo Owner**.

```bash
# API equivalent
curl -s -X POST http://localhost:4000/api/auth/demo-login \
  -H "Content-Type: application/json" \
  -d '{"email":"owner@demo.local"}' | python3 -m json.tool
```

**Expected:**
```json
{
  "success": true,
  "token": "eyJ...",
  "user": { "email": "owner@demo.local", "name": "Demo Owner", ... }
}
```

| | Check |
|---|---|
| Token returned and stored in localStorage | `[ ]` |
| Redirect to /onboarding (if new) or /app (if onboarded) | `[ ]` |
| /api/me returns correct profile | `[ ]` |
| Invalid email → 401 `{"success":false,"error":"Invalid demo user"}` | `[ ]` |

```bash
# /api/me check (replace TOKEN with actual token)
export TOKEN=$(curl -s -X POST http://localhost:4000/api/auth/demo-login \
  -H "Content-Type: application/json" -d '{"email":"owner@demo.local"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")

curl -s http://localhost:4000/api/me -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
```

---

## STEP 3 — Auto-Provisioning User Record

```bash
# Login twice, compare IDs
ID1=$(curl -s -X POST http://localhost:4000/api/auth/demo-login -H "Content-Type: application/json" \
  -d '{"email":"owner@demo.local"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['user']['id'])")
ID2=$(curl -s -X POST http://localhost:4000/api/auth/demo-login -H "Content-Type: application/json" \
  -d '{"email":"owner@demo.local"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['user']['id'])")
echo "IDs match: $([ \"$ID1\" = \"$ID2\" ] && echo YES || echo NO)"
```

| | Check |
|---|---|
| Same user ID returned on re-login | `[ ]` |

---

## STEP 4 — Onboarding Wizard Persistence

**Action:** Begin onboarding, refresh page mid-step.

| | Check |
|---|---|
| Current step is restored after refresh | `[ ]` |
| Trying /app while incomplete redirects to /onboarding | `[ ]` |

---

## STEP 5 — Workspace Creation

**Action:** Complete `/app/onboard/team-name` with "Demo Workspace".

```bash
curl -s -X POST http://localhost:4000/api/workspaces \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Demo Workspace"}' | python3 -m json.tool
```

| | Check |
|---|---|
| 201 with workspace object | `[ ]` |
| Workspace member row with OWNER role | `[ ]` |
| Invalid name → 400 with readable JSON error | `[ ]` |

---

## STEP 6 — Workspace Members + RBAC

```bash
# Owner gets workspace
curl -s http://localhost:4000/api/workspaces/current -H "Authorization: Bearer $TOKEN" | python3 -m json.tool

# Member (not invited) gets 403
MEMBER_TOKEN=$(curl -s -X POST http://localhost:4000/api/auth/demo-login \
  -H "Content-Type: application/json" -d '{"email":"member@demo.local"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")
curl -s http://localhost:4000/api/workspaces/current -H "Authorization: Bearer $MEMBER_TOKEN"
```

| | Check |
|---|---|
| Owner → 200 with workspace | `[ ]` |
| Member (not member) → 403 | `[ ]` |

---

## STEP 7 — Invite Members by Email

```bash
# Get workspace ID first
WS_ID=$(curl -s http://localhost:4000/api/workspaces/current -H "Authorization: Bearer $TOKEN" \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['id'])")

# Invite member
curl -s -X POST http://localhost:4000/api/workspaces/members/invite \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email":"member@demo.local"}' | python3 -m json.tool

# Invite non-existing
curl -s -X POST http://localhost:4000/api/workspaces/members/invite \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email":"newperson@demo.local"}' | python3 -m json.tool
```

| | Check |
|---|---|
| member@demo.local → ACTIVE membership created | `[ ]` |
| newperson@demo.local → PENDING invite | `[ ]` |
| Non-owner inviting → 403 | `[ ]` |

---

## STEP 8 — Auto-Activate Pending Invites on Login

**Action:** While member is logged out, owner invites member@demo.local. Then log in as member.

| | Check |
|---|---|
| Invite activates on member login | `[ ]` |
| workspace_members row shows ACTIVE | `[ ]` |

---

## STEP 9 — Use-Case Selection

**Action:** Complete `/app/onboard/use-case`.

| | Check |
|---|---|
| Cannot continue without selecting use case | `[ ]` |
| Selection persists after refresh | `[ ]` |

---

## STEP 10 — Profile Completion

```bash
curl -s -X PATCH http://localhost:4000/api/me \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"display_name":"Demo Owner (updated)"}' | python3 -m json.tool
```

| | Check |
|---|---|
| 200 with updated name | `[ ]` |
| /api/me reflects new name | `[ ]` |

---

## STEP 11 — Welcome Step Completion

**Action:** Click "Let's go" on welcome step.

| | Check |
|---|---|
| is_onboarded = true | `[ ]` |
| Redirect to /app | `[ ]` |
| Cannot revisit onboarding (redirects to /app) | `[ ]` |

---

## STEP 12 — Main App Layout

**Action:** Browse to `/app`.

| | Check |
|---|---|
| Sidebar + main content loads | `[ ]` |
| Responsive (mobile + desktop) | `[ ]` |
| No FOUC (Flash of Unstyled Content) | `[ ]` |
| No console errors | `[ ]` |

---

## STEP 13 — Task Creation

```bash
curl -s -X POST http://localhost:4000/api/tasks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Task","description":"Created during verification","priority":"High"}' \
  | python3 -m json.tool
```

| | Check |
|---|---|
| 201 with task object | `[ ]` |
| task.user_id matches owner | `[ ]` |
| Task appears in UI and persists after refresh | `[ ]` |

---

## STEP 14 — Task Editing + Completion

```bash
# Replace TASK_ID with actual task id
curl -s -X PATCH http://localhost:4000/api/tasks/TASK_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"Completed"}' | python3 -m json.tool
```

| | Check |
|---|---|
| Title/description updates persist | `[ ]` |
| status toggles between Pending and Completed | `[ ]` |

---

## STEP 15 — Soft Delete

```bash
curl -s -X DELETE http://localhost:4000/api/tasks/TASK_ID \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool

# Verify not in list
curl -s http://localhost:4000/api/tasks -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
```

| | Check |
|---|---|
| 200 on delete | `[ ]` |
| Task absent from default list | `[ ]` |
| deleted_at set in DB | `[ ]` |

---

## STEP 16 — Task Assignment by Email

```bash
curl -s -X PATCH http://localhost:4000/api/tasks/TASK_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"assigned_to_email":"member@demo.local"}' | python3 -m json.tool
```

| | Check |
|---|---|
| assigned_to_user_id set (if member exists) | `[ ]` |
| Non-owner trying to assign → 403 | `[ ]` |

---

## STEP 17 — Pending Assignment Auto-Activate on Login

**Action:** Assign task to newperson@demo.local (unregistered). Then register and log in as that person.

| | Check |
|---|---|
| assigned_to_email set initially | `[ ]` |
| After login from that email, assigned_to_user_id filled | `[ ]` |

---

## STEP 18 — Task Visibility Rules (Security)

```bash
# Create task as owner, get TASK_ID, then try as member
curl -s http://localhost:4000/api/tasks/TASK_ID \
  -H "Authorization: Bearer $MEMBER_TOKEN"
# Expected: 403
```

| | Check |
|---|---|
| Member gets 403 on owner's task | `[ ]` |
| Audit log shows UNAUTHORIZED_ACCESS_ATTEMPT | `[ ]` |

---

## STEP 19 — Assigned To Me View

```bash
curl -s http://localhost:4000/api/tasks/assigned-to-me \
  -H "Authorization: Bearer $MEMBER_TOKEN" | python3 -m json.tool
```

| | Check |
|---|---|
| Only tasks assigned to current user | `[ ]` |
| UI tab shows same results | `[ ]` |

---

## STEP 20 — Search Tasks

```bash
curl -s "http://localhost:4000/api/tasks?search=test" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
```

| | Check |
|---|---|
| Only visible, non-deleted tasks returned | `[ ]` |
| UI search debounced | `[ ]` |

---

## STEP 21 — Call Logs

```bash
# Add call log
curl -s -X POST http://localhost:4000/api/calls \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"caller_phone_e164":"+97412345678","direction":"INCOMING","caller_name":"Test Caller"}' \
  | python3 -m json.tool

# Invalid phone
curl -s -X POST http://localhost:4000/api/calls \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"caller_phone_e164":"not-a-phone","direction":"INCOMING"}' \
  | python3 -m json.tool
```

| | Check |
|---|---|
| Valid phone → 201 | `[ ]` |
| Invalid phone → 400 with readable error | `[ ]` |

---

## STEP 22 — Contacts

```bash
curl -s -X POST http://localhost:4000/api/contacts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Contact","phone_e164":"+97412345699"}' | python3 -m json.tool
```

| | Check |
|---|---|
| 201 with contact | `[ ]` |
| Duplicate phone → 409 conflict | `[ ]` |
| "Add to contacts" from call log works | `[ ]` |

---

## STEP 23 — Create Task From Call

```bash
# Replace CALL_ID with actual call log ID
curl -s -X POST http://localhost:4000/api/tasks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Follow up call","related_call_log_id":"CALL_ID","caller_phone_e164":"+97412345678"}' \
  | python3 -m json.tool
```

| | Check |
|---|---|
| related_call_log_id stored | `[ ]` |
| caller_phone_e164 stored | `[ ]` |

---

## STEP 24 — Privacy Control Caller Phone

```bash
# As assignee, fetch task — phone should be masked
# share_caller_details defaults false
curl -s http://localhost:4000/api/tasks/TASK_ID -H "Authorization: Bearer $MEMBER_TOKEN"
# phone: "+974 *****700"

# Owner enables sharing
curl -s -X PATCH http://localhost:4000/api/tasks/TASK_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"share_caller_details":true}'

# Assignee now sees full number
curl -s http://localhost:4000/api/tasks/TASK_ID -H "Authorization: Bearer $MEMBER_TOKEN"
```

| | Check |
|---|---|
| Masked phone returned for assignee (share=false) | `[ ]` |
| Full phone visible when share=true | `[ ]` |
| Masking enforced at serialization, not bypassable | `[ ]` |

---

## STEP 25 — Audit Logging

```bash
curl -s http://localhost:4000/api/admin/audit-logs \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
```

| | Check |
|---|---|
| LOGIN_SUCCESS present after login | `[ ]` |
| TASK_CREATED present after task creation | `[ ]` |
| TASK_DELETED present after deletion | `[ ]` |
| UNAUTHORIZED_ACCESS_ATTEMPT present after 403 | `[ ]` |
| Non-admin → 403 | `[ ]` |
| No sensitive data in metadata | `[ ]` |

---

## STEP 26 — Structured Errors

```bash
# Invalid phone
curl -s -X POST http://localhost:4000/api/calls \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"caller_phone_e164":"bad"}' | python3 -m json.tool

# Expected: {"success":false,"error":"...","requestId":"..."}  — no "stack" key
```

| | Check |
|---|---|
| All errors: `{"success":false,"error":"..."}` | `[ ]` |
| No `stack` property on any error | `[ ]` |

---

## STEP 27 — Production Hardening

```bash
# CORS check: request from disallowed origin
curl -s -H "Origin: https://evil.com" http://localhost:4000/health -v 2>&1 | grep -i cors

# Demo mode in production guard
NODE_ENV=production DEMO_AUTH=true node src/index.js
# Expected: process exit with "FATAL: DEMO_AUTH=true is not allowed in NODE_ENV=production"
```

| | Check |
|---|---|
| Server crashes if DEMO_AUTH=true in production | `[ ]` |
| CORS blocks unknown origins | `[ ]` |
| Required env vars validated at startup | `[ ]` |

---

## Automated Test Run

```bash
cd server

# One-command full test suite (requires server running with DEMO_AUTH=true)
DEMO_JWT_SECRET=your-secret npm run test:demo

# Or just integration tests (no reset):
DEMO_AUTH=true npm run test:integration
```

**Expected output:**
```
✅ Generated owner demo token
🔄 Resetting demo data...
✅ Demo data reset complete
🧪 Running integration tests...

 ✓ src/tests/demo-auth.test.js (6 tests)
 ✓ src/tests/auth-gating.test.js (5 tests)
 ✓ src/tests/workspace-rbac.test.js (3 tests)
 ✓ src/tests/task-visibility.test.js (5 tests)
 ✓ src/tests/phone-masking.test.js (2 tests)
 ✓ src/tests/error-format.test.js (5 tests)

✅ ALL TESTS PASSED
```

---

## Reset Demo Data

To start fresh at any time:
```bash
curl -s -X POST http://localhost:4000/api/admin/reset-demo \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
# Expected: {"success":true,"message":"Demo data reset complete"}
```
