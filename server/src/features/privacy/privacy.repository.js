import { BaseRepository } from '../../core/base-repository.js';

export class DpaRepository extends BaseRepository {
    constructor() {
        super('dpa_records');
    }

    async findByOrganizationId(orgId) {
        // Assuming we store org_id string. 
        // Real app might scope by user's orgranization.
        return this.find([{ field: 'organization_id', op: '==', value: orgId }]);
    }
}

export class OrgContactsRepository extends BaseRepository {
    constructor() {
        super('org_contacts');
    }

    async findByOrganizationId(orgId) {
        return this.find([{ field: 'organization_id', op: '==', value: orgId }]);
    }
}
