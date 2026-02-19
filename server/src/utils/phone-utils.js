import PNF from 'google-libphonenumber';

const phoneUtil = PNF.PhoneNumberUtil.getInstance();
const PNFFormat = PNF.PhoneNumberFormat;

/**
 * Normalizes a phone number to E.164 format.
 * @param {string} phone - The input phone number.
 * @param {string} defaultRegion - The default region code (e.g., 'QA', 'US'). Defaults to 'QA' (Qatar) as per user context.
 * @returns {string} - The normalized E.164 string (e.g., '+97455170700').
 * @throws {Error} - If the number is invalid.
 */
export const normalizePhone = (phone, defaultRegion = 'QA') => {
    if (!phone) throw new Error('Phone number is required');

    try {
        const number = phoneUtil.parseAndKeepRawInput(phone, defaultRegion);
        if (!phoneUtil.isValidNumber(number)) {
            throw new Error(`Invalid phone number: ${phone}`);
        }
        return phoneUtil.format(number, PNFFormat.E164);
    } catch (error) {
        throw new Error(`Invalid phone number format: ${error.message}`);
    }
};

/**
 * Masks a phone number for privacy (e.g., +974 *****700).
 * @param {string} phone - The E.164 phone number.
 * @returns {string} - The masked phone number.
 */
export const maskPhone = (phone) => {
    if (!phone || phone.length < 8) return phone; // Too short to mask safely
    // Keep first 4 chars (e.g., +974) and last 3 chars
    const visibleStart = 4;
    const visibleEnd = 3;
    const maskedLength = phone.length - visibleStart - visibleEnd;

    if (maskedLength <= 0) return phone;

    return (
        phone.substring(0, visibleStart) +
        '*'.repeat(maskedLength) +
        phone.substring(phone.length - visibleEnd)
    );
};
