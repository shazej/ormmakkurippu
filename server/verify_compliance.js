import fetch from 'node-fetch';

const API_BASE = 'http://localhost:4000/api/compliance';
// Admin Token (Mock) - verifyFirebaseToken accepts 'e2e-magic-token' as SUPER_ADMIN
const ADMIN_TOKEN = 'e2e-magic-token';

async function runComplianceTests() {
    console.log('🚀 Starting Compliance Module Verification...');

    const headers = {
        'Authorization': `Bearer ${ADMIN_TOKEN}`,
        'Content-Type': 'application/json'
    };

    // 1. Create Certification
    const newCert = {
        name: 'ISO 27001',
        standard: 'Information Security',
        region: 'Global',
        valid_from: '2024-01-01',
        valid_to: '2025-01-01'
    };

    const createRes = await fetch(`${API_BASE}/certifications`, {
        method: 'POST',
        headers,
        body: JSON.stringify(newCert)
    });

    const createBody = await createRes.json();
    const createdCert = createBody.data || createBody; // Handle standard response

    console.log(`Create Cert: ${createRes.status} ${createRes.status === 201 ? '✅' : '❌'} (ID: ${createdCert?.id})`);

    if (!createdCert?.id) {
        console.error('Failed to create cert, aborting.');
        console.error(createBody);
        return;
    }

    // 2. Get All (Public)
    const listRes = await fetch(`${API_BASE}/certifications`);
    const listBody = await listRes.json();
    const certs = listBody.data || listBody;
    const found = certs.find(c => c.id === createdCert.id);
    console.log(`List Certs: ${listRes.status} ${found ? '✅ Cert Found' : '❌ Cert Missing'}`);

    // 3. Update Cert
    const updateRes = await fetch(`${API_BASE}/certifications/${createdCert.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ name: 'ISO 27001 Updated' })
    });
    const updateBody = await updateRes.json();
    const updatedCert = updateBody.data || updateBody;
    console.log(`Update Cert: ${updateRes.status} ${updatedCert.name === 'ISO 27001 Updated' ? '✅' : '❌'}`);

    // 4. Delete Cert
    const deleteRes = await fetch(`${API_BASE}/certifications/${createdCert.id}`, {
        method: 'DELETE',
        headers
    });
    console.log(`Delete Cert: ${deleteRes.status} ${deleteRes.status === 200 ? '✅' : '❌'}`);

    // 5. Verify Deletion (Should be hidden/missing from public list)
    const listRes2 = await fetch(`${API_BASE}/certifications`);
    const listBody2 = await listRes2.json();
    const certs2 = listBody2.data || listBody2;
    const found2 = certs2.find(c => c.id === createdCert.id);
    console.log(`Verify Delete: ${!found2 ? '✅ Cert Gone' : '❌ Cert Still Present'}`);

    console.log('🎉 Compliance Verification Complete!');
}

runComplianceTests();
