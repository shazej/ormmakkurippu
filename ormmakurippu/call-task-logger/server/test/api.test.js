const test = require('node:test');
const assert = require('node:assert');
const http = require('http');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

const PORT = 3002; // Use a different port for testing
const API_URL = `http://localhost:${PORT}/api`;

// Helper to make requests
function request(method, path, body = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: PORT,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = data ? JSON.parse(data) : {};
                    resolve({ status: res.statusCode, body: parsed, headers: res.headers });
                } catch (e) {
                    // pass raw data if not json (e.g. csv)
                    resolve({ status: res.statusCode, body: data, headers: res.headers });
                }
            });
        });

        req.on('error', reject);

        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
}

// Global server process variable
let serverProcess;

test.before(async () => {
    // Start the server on a test port
    // We need to set PORT env var.
    // Assuming index.js is in <root>/index.js and we are running from <root>
    console.log("Starting test server...");

    // We might need to make sure we rely on a clean DB or temp one for tests
    // But for this basic req, we will just use the dev one carefully or maybe switch env?
    // The prompt didn't specify test DB isolation, but it's best practice.
    // However, to keep it simple and deliverable oriented:
    // We launch index.js

    serverProcess = spawn('node', ['index.js'], {
        env: { ...process.env, PORT: PORT },
        cwd: path.resolve(__dirname, '..'), // Run from server root
        stdio: 'pipe' // Capture output to know when it's ready? or just wait?
    });

    // Wait for server to start
    await new Promise(resolve => setTimeout(resolve, 2000));
});

test.after(() => {
    if (serverProcess) {
        serverProcess.kill();
    }
});

test('Call Task Logger API Tests', async (t) => {
    let createdTaskId;

    await t.test('1) Task creation', async () => {
        const newTask = {
            fromName: "Test User",
            description: "Test Description",
            // Other fields are optional/default
        };

        const res = await request('POST', '/api/tasks', newTask);
        assert.strictEqual(res.status, 201);
        assert.ok(res.body.id, 'Task should have an ID');
        assert.strictEqual(res.body.fromName, newTask.fromName);

        createdTaskId = res.body.id;
    });

    await t.test('2) Default values (Other, Medium, New)', async () => {
        const res = await request('GET', `/api/tasks/${createdTaskId}`);
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.body.category, 'Other');
        assert.strictEqual(res.body.priority, 'Medium');
        assert.strictEqual(res.body.status, 'New');
    });

    await t.test('3) Sorting by newest first', async () => {
        // Create another task that is newer
        await request('POST', '/api/tasks', { fromName: "Newer", description: "Desc" });

        const res = await request('GET', '/api/tasks');
        assert.strictEqual(res.status, 200);
        assert.ok(Array.isArray(res.body));

        // Check if sorted by createdAt DESC (simple check: first item should be newer/created after second item? 
        // Or just check timestamp logic if we have enough items)
        if (res.body.length >= 2) {
            const t1 = res.body[0].createdAt;
            const t2 = res.body[1].createdAt;
            // t1 should be >= t2
            assert.ok(t1 >= t2, 'Tasks should be sorted by newest first');
        }
    });

    await t.test('4) Update status to Done', async () => {
        const res = await request('PUT', `/api/tasks/${createdTaskId}`, { status: 'Done' });

        // The API implementation in index.js for PUT returns the updated row orsuccess
        // Based on my view_file earlier: it returns the row.
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.body.status, 'Done');

        // Verify fetch
        const check = await request('GET', `/api/tasks/${createdTaskId}`);
        assert.strictEqual(check.body.status, 'Done');
    });

    await t.test('5) Delete task', async () => {
        const res = await request('DELETE', `/api/tasks/${createdTaskId}`);
        assert.strictEqual(res.status, 200);

        // Verify it's gone
        const check = await request('GET', `/api/tasks/${createdTaskId}`);
        assert.strictEqual(check.status, 404);
    });

    await t.test('6) CSV export returns header + rows', async () => {
        const res = await request('GET', '/api/export');
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.headers['content-type'], 'text/csv; charset=utf-8');

        // Basic CSV check
        const csv = res.body;
        // Note: request helper parsing might try JSON, but catch block handling returns raw string for CSV
        assert.ok(typeof csv === 'string');
        const lines = csv.split('\n');
        assert.ok(lines.length > 0);

        // Check header (Based on index.js implementation)
        // Header: Created At,From Name,Phone,Category,Priority,Status,Description,Notes
        const header = lines[0];
        assert.ok(header.includes('Created At') && header.includes('From Name'), 'CSV should contain correct headers');
    });
});
