import { DpaRepository, OrgContactsRepository } from './privacy.repository.js';
import { AppError, ErrorCodes } from '../../utils/errors.js';
import { logAudit } from '../../admin/audit.js';

const dpaRepo = new DpaRepository();
const contactsRepo = new OrgContactsRepository();

export class PrivacyService {

    // --- DPA ---
    async getDpaStatus(user, organizationId) {
        // Validate user access to org?
        // For now, simple find.
        const dpas = await dpaRepo.findByOrganizationId(organizationId);
        return dpas[0] || null;
    }

    async initiateDpa(user, organizationId) {
        const existing = await this.getDpaStatus(user, organizationId);
        if (existing) throw new AppError(ErrorCodes.RESOURCE_ALREADY_EXISTS, 'DPA already initiated');

        const dpa = await dpaRepo.create({
            organization_id: organizationId,
            initiated_by_user_id: user.uid,
            status: 'initiated',
            document_url: 'https://example.com/dpa.pdf', // Stub
            initiated_at: new Date().toISOString(),
            signed_at: null
        });

        await logAudit(user, 'INITIATE_DPA', 'dpa_record', dpa.id, { organizationId });
        return dpa;
    }

    async revokeDpa(user, dpaId) {
        const dpa = await dpaRepo.findById(dpaId);
        if (!dpa) throw new AppError(ErrorCodes.RESOURCE_NOT_FOUND, 'DPA record not found');

        // Check permissions (e.g. initiated by same user or admin)

        await dpaRepo.update(dpaId, { status: 'revoked' });
        await logAudit(user, 'REVOKE_DPA', 'dpa_record', dpaId, {});
        return { success: true };
    }

    // --- Contacts ---
    async listContacts(user, organizationId) {
        return contactsRepo.findByOrganizationId(organizationId);
    }

    async addContact(user, organizationId, contactData) {
        const contact = await contactsRepo.create({
            organization_id: organizationId,
            ...contactData,
            created_by: user.uid
        });
        await logAudit(user, 'ADD_ORG_CONTACT', 'org_contact', contact.id, { organizationId });
        return contact;
    }

    async updateContact(user, id, data) {
        await contactsRepo.update(id, data);
        await logAudit(user, 'UPDATE_ORG_CONTACT', 'org_contact', id, {});
        return { success: true };
    }

    async deleteContact(user, id) {
        await contactsRepo.delete(id);
        await logAudit(user, 'DELETE_ORG_CONTACT', 'org_contact', id, {});
        return { success: true };
    }
}
