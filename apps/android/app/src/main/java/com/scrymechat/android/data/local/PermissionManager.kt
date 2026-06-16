package com.scrymechat.android.data.local

import com.scrymechat.android.common.Permissions
import com.scrymechat.android.data.local.dao.SessionDao
import com.scrymechat.android.data.local.dao.WorkspaceMemberDao
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class PermissionManager @Inject constructor(
    private val sessionDao: SessionDao,
    private val workspaceMemberDao: WorkspaceMemberDao
) {
    suspend fun hasPermissionInActiveWorkspace(requiredPerm: Long): Boolean {
        val session = sessionDao.getActiveSession() ?: return false
        val workspaceId = session.activeWorkspaceId ?: return false

        val member = workspaceMemberDao.getMember(workspaceId, session.userId) ?: return false
        return Permissions.hasPermission(member.permissions, requiredPerm)
    }

    suspend fun hasPermissionInWorkspace(workspaceId: String, requiredPerm: Long): Boolean {
        val session = sessionDao.getActiveSession() ?: return false
        val member = workspaceMemberDao.getMember(workspaceId, session.userId) ?: return false
        return Permissions.hasPermission(member.permissions, requiredPerm)
    }

    suspend fun isAdminInWorkspace(workspaceId: String): Boolean {
        val session = sessionDao.getActiveSession() ?: return false
        val member = workspaceMemberDao.getMember(workspaceId, session.userId) ?: return false
        return member.role.lowercase() == "admin" || member.role.lowercase() == "owner"
    }
}
