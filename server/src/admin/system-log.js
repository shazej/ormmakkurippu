import { db } from '../firebase.js';

export const logSystemEvent = async (type, details) => {
    try {
        const event = {
            timestamp: new Date().toISOString(),
            type,
            details,
        };

        if (process.env.E2E_TEST_MODE === 'true') {
            // In Demo Mode, verify if we can log to LocalDb collection
            try {
                // @ts-ignore
                await db.collection('system_events').add(event);
                console.log('📝 [System Event (Demo)]:', type, details);
            } catch (e) {
                console.warn('⚠️ Could not log system event in Demo Mode:', e.message);
            }
        } else {
            await db.collection('system_events').add(event);
            // console.log('📝 [System Event]:', type); // Optional verbosity
        }
    } catch (error) {
        console.error('❌ Failed to log system event:', error);
    }
};
