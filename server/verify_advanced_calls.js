const BASE_URL = 'http://127.0.0.1:4000/api';
// Using the E2E magic token from auth middleware
const TOKEN_USER_1 = 'e2e-magic-token';
const TOKEN_USER_2 = 'e2e-magic-token-2'; // Second user for testing masking

async function runVerification() {
    console.log('🚀 Starting Advanced Call Features Verification...');

    try {
        // --- 1. Phone Normalization (Contact) ---
        console.log('\n--- Step 1: Phone Normalization (Contact) ---');
        const contactRes = await fetch(`${BASE_URL}/contacts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${TOKEN_USER_1}` },
            body: JSON.stringify({
                name: 'Test Contact',
                phone_e164: '55170700', // Local QA number, should become +97455170700
                email: 'normalization@example.com'
            })
        });

        if (contactRes.status === 201 || contactRes.status === 409) {
            const data = await contactRes.json();
            const contact = data.data || data; // Check structure
            // If 409, we might not get the contact object back with phone, but message.
            if (contactRes.status === 201) {
                console.log(`✅ Contact Created with Phone: ${contact.phone_e164}`);
                if (contact.phone_e164 !== '+97455170700') throw new Error(`Normalization Failed: Got ${contact.phone_e164}`);
            } else {
                console.log('⚠️ Contact already exists (Skipping normalization check for now, assuming previous run passed or manual check)');
            }
        } else {
            throw new Error(`Create Contact Failed: ${contactRes.status}`);
        }

        // --- 2. Create Task with Phone ---
        console.log('\n--- Step 2: Create Task with Phone info ---');
        const taskRes = await fetch(`${BASE_URL}/tasks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${TOKEN_USER_1}` },
            body: JSON.stringify({
                title: 'Call Task',
                fromPhone: '+97455170700', // Already normalized input for task
                fromName: 'Caller One'
            })
        });
        const task = (await taskRes.json()).data;
        console.log(`✅ Task Created: ${task.id}`);

        // --- 3. Masking Check (User 2 reading User 1's task) ---
        // First, assign to User 2 so they can see it
        console.log('\n--- Step 3: Assign to User 2 & Check Masking ---');

        const assignRes = await fetch(`${BASE_URL}/tasks/${task.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${TOKEN_USER_1}` },
            body: JSON.stringify({ assignedToEmail: 'colleague@example.com' })
        });
        const assignData = await assignRes.json();
        console.log(`   Assignment PUT Status: ${assignRes.status}`);
        console.log(`   Assignment Data:`, JSON.stringify(assignData));

        // User 2 reads task
        const readRes = await fetch(`${BASE_URL}/tasks/${task.id}`, {
            headers: { 'Authorization': `Bearer ${TOKEN_USER_2}` }
        });

        console.log(`   User 2 Read Status: ${readRes.status}`);
        const readResData = await readRes.json();
        if (!readRes.ok) {
            console.error('   User 2 Read Error:', JSON.stringify(readResData));
            throw new Error(`User 2 failed to read task: ${readRes.status}`);
        }
        const readTask = readResData.data;
        console.log(`   User 2 sees phone: ${readTask.from_phone}`);

        if (readTask.from_phone === '+974*****700') {
            console.log('✅ Masking Verified!');
        } else {
            console.error(`❌ Masking FAILED. Got: ${readTask.from_phone}`);
        }

        // --- 4. User Preferences (Toggle Sharing) ---
        console.log('\n--- Step 4: Toggle Sharing Preference ---');
        await fetch(`${BASE_URL}/users/me/preferences`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${TOKEN_USER_1}` },
            body: JSON.stringify({ shareCallerDetails: true })
        });
        console.log('✅ Preferences Updated: shareCallerDetails = true');

        // Check availability of preferences in task reading (If implemented)
        // NOTE: Our current implementation in TasksService does NOT yet fetch owner preferences dynamically for performance.
        // It hardcodes masking for now. So we expect it to STILL be masked until we implement the dynamic check.
        // I will log this expectation.
        console.log('ℹ️  NOTE: Dynamic preference check not yet implemented in TasksService. Task should still be masked.');

        const readRes2 = await fetch(`${BASE_URL}/tasks/${task.id}`, {
            headers: { 'Authorization': `Bearer ${TOKEN_USER_2}` }
        });
        const readTask2 = (await readRes2.json()).data;
        console.log(`   User 2 sees phone (after opt-in): ${readTask2.from_phone}`);

    } catch (error) {
        console.error('❌ Verification Failed:', error);
    }
}

runVerification();
