package com.scrymechat.android.common

import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class PermissionsTest {

    @Test
    fun `hasPermission should return true when user has administrator permission`() {
        val userPerms = Permissions.ADMINISTRATOR
        val requiredPerm = Permissions.SEND_MESSAGES

        assertTrue(Permissions.hasPermission(userPerms, requiredPerm))
    }

    @Test
    fun `hasPermission should return true when user has the specific permission`() {
        val userPerms = Permissions.SEND_MESSAGES or Permissions.VIEW_CHANNEL
        val requiredPerm = Permissions.SEND_MESSAGES

        assertTrue(Permissions.hasPermission(userPerms, requiredPerm))
    }

    @Test
    fun `hasPermission should return false when user lacks the specific permission`() {
        val userPerms = Permissions.VIEW_CHANNEL
        val requiredPerm = Permissions.SEND_MESSAGES

        assertFalse(Permissions.hasPermission(userPerms, requiredPerm))
    }

    @Test
    fun `hasPermission should handle multiple required permissions`() {
        val userPerms = Permissions.SEND_MESSAGES or Permissions.VIEW_CHANNEL or Permissions.ATTACH_FILES
        val requiredPerms = Permissions.SEND_MESSAGES or Permissions.ATTACH_FILES

        assertTrue(Permissions.hasPermission(userPerms, requiredPerms))
    }
}
