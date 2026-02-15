import fetch from 'node-fetch';

const API_BASE = 'http://localhost:4000/api/privacy';
const TOKEN = 'e2e-magic-token'; // User 1 (SUPER_ADMIN)
const TOKEN_2 = 'e2e-magic-token-2'; // User 2 (USER) - need to ensure this token is mocked in auth.js

async function runPrivacyTests() {
    console.log('🚀 Starting Privacy Module Verification...');

    const headers = {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
    };

    // 1. Initiate DPA
    console.log('1. Initiating DPA...');
    const dpaRes = await fetch(`${API_BASE}/dpa/initiate`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ organizationId: 'org-1' }) // Explicit org? Or inferred?
    });

    // We expect the controller/service to either accept 'org-1' if allowed, or default to user.uid.
    // Let's assume we proceed with whatever behavior we find/fix.

    const dpaBody = await dpaRes.json();
    console.log(`Init DPA: ${dpaRes.status} ${dpaRes.status === 201 || dpaRes.status === 200 ? '✅' : '❌'}`);
    const dpaId = dpaBody.data?.id || dpaBody.id;

    if (dpaId) {
        // 2. Revoke DPA (Authorized)
        const revokeRes = await fetch(`${API_BASE}/dpa/${dpaId}/revoke`, {
            method: 'POST', // or DELETE? routes says POST
            headers
        });
        console.log(`Revoke DPA (Auth): ${revokeRes.status} ${revokeRes.status === 200 ? '✅' : '❌'}`);
    }

    // 3. Add Contact
    console.log('3. Adding Contact...');
    const contactRes = await fetch(`${API_BASE}/contacts`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
            organizationId: 'org-1',
            name: 'Data Protection Officer',
            email: 'dpo@example.com',
            role: 'DPO'
        })
    });
    const contactBody = await contactRes.json();
    console.log(`Add Contact: ${contactRes.status} ${contactRes.status === 201 ? '✅' : '❌'}`);
    const contactId = contactBody.data?.id || contactBody.id;

    if (contactId) {
        // 4. Update Contact (Unauthorized User)
        // We need to simulate another user trying to update THIS contact.
        // We need to modify auth.js to support a second token for this test to be meaningful.
        // For now, testing basic success flow.
        const updateRes = await fetch(`${API_BASE}/contacts/${contactId}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify({ name: 'Updated DPO' })
        });
        console.log(`Update Contact (Auth): ${updateRes.status} ${updateRes.status === 200 ? '✅' : '❌'}`);

        // 5. Delete Contact
        const delRes = await fetch(`${API_BASE}/contacts/${contactId}`, {
            method: 'DELETE',
            headers
        });
        console.log(`Delete Contact: ${delRes.status} ${delRes.status === 200 ? '✅' : '❌'}`);
    }

    console.log('🎉 Privacy Verification Complete!');
}

runPrivacyTests();
