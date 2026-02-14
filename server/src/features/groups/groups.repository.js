import { BaseRepository } from '../../core/base-repository.js';

export class GroupsRepository extends BaseRepository {
    constructor() {
        super('groups');
    }

    async findByOwner(userId) {
        return this.find([{ field: 'owner_user_id', op: '==', value: userId }]);
    }
}

export class GroupMembersRepository extends BaseRepository {
    constructor() {
        super('group_members');
    }

    async findByGroupId(groupId) {
        return this.find([{ field: 'group_id', op: '==', value: groupId }]);
    }

    async findMember(groupId, email) {
        return this.find([
            { field: 'group_id', op: '==', value: groupId },
            { field: 'email', op: '==', value: email }
        ]);
        // find returns array, caller should handle. 
        // Actually, let's optimize to return first or null in service.
    }
}
