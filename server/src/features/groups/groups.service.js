import { GroupsRepository, GroupMembersRepository } from './groups.repository.js';
import { AppError, ErrorCodes } from '../../utils/errors.js';
import { logAudit } from '../../admin/audit.js';

const groupsRepo = new GroupsRepository();
const membersRepo = new GroupMembersRepository();

export class GroupsService {

    async listGroups(user) {
        return groupsRepo.findByOwner(user.uid);
    }

    async createGroup(user, name) {
        const group = await groupsRepo.create({
            owner_user_id: user.uid,
            name
        });
        await logAudit(user, 'CREATE_GROUP', 'group', group.id, { name });
        return group;
    }

    async updateGroup(user, id, name) {
        const group = await groupsRepo.findById(id);
        if (!group) throw new AppError(ErrorCodes.RESOURCE_NOT_FOUND, 'Group not found');
        if (group.owner_user_id !== user.uid) throw new AppError(ErrorCodes.ACCESS_DENIED, 'Access denied');

        const updated = await groupsRepo.update(id, { name });
        await logAudit(user, 'UPDATE_GROUP', 'group', id, { name });
        return updated;
    }

    async deleteGroup(user, id) {
        const group = await groupsRepo.findById(id);
        if (!group) throw new AppError(ErrorCodes.RESOURCE_NOT_FOUND, 'Group not found');
        if (group.owner_user_id !== user.uid) throw new AppError(ErrorCodes.ACCESS_DENIED, 'Access denied');

        // Delete members
        await membersRepo.deleteWhere('group_id', id);

        await groupsRepo.delete(id);
        await logAudit(user, 'DELETE_GROUP', 'group', id, {});
        return { success: true };
    }

    async listMembers(user, groupId) {
        const group = await groupsRepo.findById(groupId);
        if (!group) throw new AppError(ErrorCodes.RESOURCE_NOT_FOUND, 'Group not found');
        if (group.owner_user_id !== user.uid) throw new AppError(ErrorCodes.ACCESS_DENIED, 'Access denied');

        return membersRepo.findByGroupId(groupId);
    }

    async addMember(user, groupId, email) {
        const group = await groupsRepo.findById(groupId);
        if (!group) throw new AppError(ErrorCodes.RESOURCE_NOT_FOUND, 'Group not found');
        if (group.owner_user_id !== user.uid) throw new AppError(ErrorCodes.ACCESS_DENIED, 'Access denied');

        // Check duplicate
        const existing = await membersRepo.findMember(groupId, email);
        if (existing.length > 0) throw new AppError(ErrorCodes.RESOURCE_ALREADY_EXISTS, 'Member already in group');

        const member = await membersRepo.create({
            group_id: groupId,
            email,
            role: 'member', // Default
            added_at: new Date().toISOString()
        });

        await logAudit(user, 'ADD_GROUP_MEMBER', 'group_member', member.id, { groupId, email });
        return member;
    }

    async removeMember(user, groupId, memberId) {
        const group = await groupsRepo.findById(groupId);
        if (!group) throw new AppError(ErrorCodes.RESOURCE_NOT_FOUND, 'Group not found');
        if (group.owner_user_id !== user.uid) throw new AppError(ErrorCodes.ACCESS_DENIED, 'Access denied');

        await membersRepo.delete(memberId);
        await logAudit(user, 'REMOVE_GROUP_MEMBER', 'group_member', memberId, { groupId });
        return { success: true };
    }
}
