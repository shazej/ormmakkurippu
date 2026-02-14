import { BaseRepository } from '../../core/base-repository.js';

export class MfaRepository extends BaseRepository {
    constructor() {
        super('mfa_methods');
    }

    async findByUserId(userId) {
        return this.find([{ field: 'user_id', op: '==', value: userId }]);
    }
}

export class WebAuthnRepository extends BaseRepository {
    constructor() {
        super('webauthn_credentials');
    }

    async findByUserId(userId) {
        return this.find([{ field: 'user_id', op: '==', value: userId }]);
    }

    async findByCredentialId(credentialId) {
        return this.findOne('credential_id', credentialId);
    }
}
