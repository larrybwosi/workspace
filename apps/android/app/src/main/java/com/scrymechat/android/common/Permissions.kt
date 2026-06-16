package com.scrymechat.android.common

object Permissions {
    const val CREATE_INSTANT_INVITE: Long = 1L shl 0
    const val KICK_MEMBERS: Long = 1L shl 1
    const val BAN_MEMBERS: Long = 1L shl 2
    const val ADMINISTRATOR: Long = 1L shl 3
    const val MANAGE_CHANNELS: Long = 1L shl 4
    const val MANAGE_GUILD: Long = 1L shl 5
    const val ADD_REACTIONS: Long = 1L shl 6
    const val VIEW_AUDIT_LOG: Long = 1L shl 7
    const val PRIORITY_SPEAKER: Long = 1L shl 8
    const val STREAM: Long = 1L shl 9
    const val VIEW_CHANNEL: Long = 1L shl 10
    const val SEND_MESSAGES: Long = 1L shl 11
    const val SEND_TTS_MESSAGES: Long = 1L shl 12
    const val MANAGE_MESSAGES: Long = 1L shl 13
    const val EMBED_LINKS: Long = 1L shl 14
    const val ATTACH_FILES: Long = 1L shl 15
    const val READ_MESSAGE_HISTORY: Long = 1L shl 16
    const val MENTION_EVERYONE: Long = 1L shl 17
    const val USE_EXTERNAL_EMOJIS: Long = 1L shl 18
    const val VIEW_GUILD_INSIGHTS: Long = 1L shl 19
    const val CONNECT: Long = 1L shl 20
    const val SPEAK: Long = 1L shl 21
    const val MUTE_MEMBERS: Long = 1L shl 22
    const val DEAFEN_MEMBERS: Long = 1L shl 23
    const val MOVE_MEMBERS: Long = 1L shl 24
    const val USE_VAD: Long = 1L shl 25
    const val CHANGE_NICKNAME: Long = 1L shl 26
    const val MANAGE_NICKNAMES: Long = 1L shl 27
    const val MANAGE_ROLES: Long = 1L shl 28
    const val MANAGE_WEBHOOKS: Long = 1L shl 29
    const val MANAGE_EMOJIS_AND_STICKERS: Long = 1L shl 30
    const val USE_APPLICATION_COMMANDS: Long = 1L shl 31
    const val REQUEST_TO_SPEAK: Long = 1L shl 32
    const val MANAGE_THREADS: Long = 1L shl 34
    const val CREATE_PUBLIC_THREADS: Long = 1L shl 35
    const val CREATE_PRIVATE_THREADS: Long = 1L shl 36
    const val USE_EXTERNAL_STICKERS: Long = 1L shl 37
    const val SEND_MESSAGES_IN_THREADS: Long = 1L shl 38
    const val USE_EMBEDDED_ACTIVITIES: Long = 1L shl 39
    const val MODERATE_MEMBERS: Long = 1L shl 40

    fun hasPermission(userPerms: Long, requiredPerm: Long): Boolean {
        if ((userPerms and ADMINISTRATOR) == ADMINISTRATOR) {
            return true
        }
        return (userPerms and requiredPerm) == requiredPerm
    }
}
