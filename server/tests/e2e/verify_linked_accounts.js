
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:4000';

async function verify() {
    console.log('Starting Linked Accounts Verification...');

    // 1. Login (E2E Mock)
    console.log('1. Authenticating...');
    const authRes = await fetch(`${BASE_URL}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: 'mock-code' })
    });
    const authData = await authRes.json();

    if (!authData.tokens || !authData.tokens.id_token) {
        console.error('Authentication failed:', authData);
        process.exit(1);
    }
    const token = authData.tokens.id_token;
    console.log('   Authenticated as:', authData.user.email);

    // 2. List (Initial)
    console.log('2. Listing Linked Accounts (Initial)...');
    const listRes = await fetch(`${BASE_URL}/api/account/linked-accounts`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const initialList = await listRes.json();
    console.log(`   Found ${initialList.length} linked accounts.`);

    // 3. Link New Account (GitHub)
    console.log('3. Linking GitHub Account...');
    const linkRes = await fetch(`${BASE_URL}/api/account/linked-accounts/link`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            provider: 'github',
            token: 'mock-github-token'
        })
    });
    const linkData = await linkRes.json();
    console.log('   Link Response:', linkData);

    if (!linkData.id || linkData.provider !== 'github') {
        console.error('❌ Failed to link account:', linkData);
        process.exit(1);
    }

    // 4. Verify Duplicate Link (Should fail currently based on logic? Or depend on mock ID?)
    // The service generates a NEW mock ID every time: `mock-${provider}-${Date.now()}`
    // So actually, linking again *will* create a second entry unless we force the ID.
    // However, the test script is fast, but `Date.now()` changes.
    // The Service check: 
    // `existing.find(a => a.provider === provider && a.provider_user_id === mockProfile.id)`
    // Since mockProfile.id changes, we can link "multiple" github accounts in this mock implementation.
    // Real implementation would decode the token and get the SAME stable ID.
    // For this verification, we just ensure the first one succeeded.

    // 5. List Again to verify count increased
    console.log('5. Listing Linked Accounts (After Link)...');
    const listRes2 = await fetch(`${BASE_URL}/api/account/linked-accounts`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const updatedList = await listRes2.json();
    console.log(`   Found ${updatedList.length} linked accounts.`);

    if (updatedList.length !== initialList.length + 1) {
        console.error('❌ List count did not increase correctly.');
        process.exit(1);
    }

    // 6. Unlink
    const accountToUnlink = linkData;
    console.log(`6. Unlinking Account ${accountToUnlink.id}...`);
    const unlinkRes = await fetch(`${BASE_URL}/api/account/linked-accounts/${accountToUnlink.id}/unlink`, {
        method: 'POST', // or DELETE? Routes say POST /:id/unlink
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const unlinkData = await unlinkRes.json();
    console.log('   Unlink Response:', unlinkData);

    if (!unlinkData.success) {
        console.error('❌ Failed to unlink:', unlinkData);
        process.exit(1);
    }

    // 7. List Final
    console.log('7. Listing Linked Accounts (Final)...');
    const listRes3 = await fetch(`${BASE_URL}/api/account/linked-accounts`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const finalList = await listRes3.json();
    console.log(`   Found ${finalList.length} linked accounts.`);

    if (finalList.length !== initialList.length) {
        console.error('❌ Final count does not match initial count.');
        process.exit(1);
    }

    console.log('✅ Linked Accounts Verified Successfully!');
}

verify().catch(err => console.error(err));
