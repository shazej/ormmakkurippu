import { BaseRepository } from '../../core/base-repository.js';

export class UsersRepository extends BaseRepository {
    constructor() {
        super('users'); // This might map to 'users' collection or separate if using Auth
    }

    async findByEmail(email) {
        // This assumes we sync users or store them. 
        // If only using Firebase Auth, this repo might need to wrapper Admin SDK.
        // But per requirements, we extend "Data model (extend existing Users)".
        return this.findOne('email', email);
    }
}
