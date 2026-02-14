import express from 'express';

const router = express.Router();

// Read-only certifications
router.get('/certifications', (req, res) => {
    // Mock Data
    const certs = [
        {
            id: 'iso-27001',
            name: 'ISO/IEC 27001:2013',
            standard: 'Information Security Management',
            badge_url: 'https://example.com/badges/iso27001.png',
            valid_from: '2024-01-01',
            valid_to: '2027-01-01',
            region: 'Global'
        },
        {
            id: 'gdpr',
            name: 'GDPR Compliance',
            standard: 'Data Privacy',
            badge_url: 'https://example.com/badges/gdpr.png',
            valid_from: '2024-01-01',
            valid_to: '2025-01-01',
            region: 'EU'
        }
    ];
    res.json(certs);
});

export default router;
