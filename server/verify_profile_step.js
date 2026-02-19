
const BASE_URL = 'http://localhost:4000/api';
const TOKEN = 'e2e-magic-token'; // Uses the backdoor in auth middleware

async function verifyProfileStep() {
    console.log('--- Starting Profile Step Verification ---');

    try {
        // 1. Get Initial Profile
        console.log('1. Fetching initial profile...');
        const initialRes = await fetch(`${BASE_URL}/users/me`, {
            headers: { 'Authorization': `Bearer ${TOKEN}` }
        });

        if (!initialRes.ok) throw new Error(`Initial fetch failed: ${initialRes.status}`);
        const initialData = await initialRes.json();
        console.log('   Initial Display Name:', initialData.data.display_name);

        // 2. Update Profile
        const newName = `Test User ${Date.now()}`;
        const newAvatar = `https://example.com/avatar/${Date.now()}.jpg`;

        console.log(`2. Updating profile to: ${newName}, ${newAvatar}...`);
        const updateRes = await fetch(`${BASE_URL}/users/me`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                display_name: newName,
                avatar_url: newAvatar
            })
        });

        const updateData = await updateRes.json();

        if (updateData.success) {
            console.log('   Update successful.');
        } else {
            console.error('   Update failed:', updateData);
            process.exit(1);
        }

        // 3. Verify Update
        console.log('3. Verifying update persistence...');
        const verifyRes = await fetch(`${BASE_URL}/users/me`, {
            headers: { 'Authorization': `Bearer ${TOKEN}` }
        });

        const verifyData = await verifyRes.json();
        const user = verifyData.data;

        if (user.display_name === newName && user.avatar_url === newAvatar) {
            console.log('   SUCCESS: Profile updated and persisted correctly.');
        } else {
            console.error('   FAILURE: Profile mismatch.', user);
            process.exit(1);
        }

        // 4. Test Onboarding Step Advance (Integration Check)
        console.log('4. Testing onboarding step advancement...');
        const stepRes = await fetch(`${BASE_URL}/onboarding/step`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ step: 2 })
        });

        const stepData = await stepRes.json();

        if (stepData.success) {
            console.log('   SUCCESS: Onboarding step advanced.');
        } else {
            console.error('   FAILURE: Could not advance onboarding step.');
            // Don't exit 1 if just step advancement failed but profile succeeded, but technically it is a failure of the flow.
            process.exit(1);
        }

    } catch (error) {
        if (error.cause && error.cause.code === 'ECONNREFUSED') {
            console.error('CRITICAL: Server is not running at http://localhost:4000. Please start the server.');
        } else {
            console.error('Verification Error:', error.message);
        }
        process.exit(1);
    }
}

verifyProfileStep();
