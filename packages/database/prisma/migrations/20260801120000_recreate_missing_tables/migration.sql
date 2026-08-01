DO $$
BEGIN
    -- Recreate table if not exists
    CREATE TABLE IF NOT EXISTS "users" (
        "id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "username" TEXT,
        "email" TEXT NOT NULL,
        "emailVerified" BOOLEAN NOT NULL DEFAULT false,
        "image" TEXT,
        "avatar" TEXT,
        "banner" TEXT,
        "statusText" TEXT,
        "statusEmoji" TEXT,
        "bio" TEXT,
        "role" TEXT NOT NULL DEFAULT 'user',
        "status" TEXT NOT NULL DEFAULT 'online',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        "banned" BOOLEAN DEFAULT false,
        "banReason" TEXT,
        "banExpires" TIMESTAMP(3),
        "notificationPreferences" JSONB,
        "plan" TEXT NOT NULL DEFAULT 'free',
        "messageCount" INTEGER NOT NULL DEFAULT 0,
        "isBot" BOOLEAN NOT NULL DEFAULT false,
        "botToken" TEXT,

        CONSTRAINT "users_pkey" PRIMARY KEY ("id")
    );

    -- Recreate table if not exists
    CREATE TABLE IF NOT EXISTS "verifications" (
        "id" TEXT NOT NULL,
        "identifier" TEXT NOT NULL,
        "value" TEXT NOT NULL,
        "expiresAt" TIMESTAMP(3) NOT NULL,
        "userId" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,

        CONSTRAINT "verifications_pkey" PRIMARY KEY ("id")
    );

    -- Recreate table if not exists
    CREATE TABLE IF NOT EXISTS "sessions" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "token" TEXT NOT NULL,
        "expiresAt" TIMESTAMP(3) NOT NULL,
        "ipAddress" TEXT,
        "userAgent" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        "impersonatedBy" TEXT,
        "activeOrganizationId" TEXT,

        CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
    );

    -- Recreate table if not exists
    CREATE TABLE IF NOT EXISTS "account" (
        "id" TEXT NOT NULL,
        "accountId" TEXT NOT NULL,
        "providerId" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "accessToken" TEXT,
        "refreshToken" TEXT,
        "idToken" TEXT,
        "accessTokenExpiresAt" TIMESTAMP(3),
        "refreshTokenExpiresAt" TIMESTAMP(3),
        "scope" TEXT,
        "password" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,

        CONSTRAINT "account_pkey" PRIMARY KEY ("id")
    );

    -- Recreate table if not exists
    CREATE TABLE IF NOT EXISTS "workspaces" (
        "id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "slug" TEXT NOT NULL,
        "icon" TEXT,
        "banner" TEXT,
        "description" TEXT,
        "ownerId" TEXT NOT NULL,
        "plan" TEXT NOT NULL DEFAULT 'free',
        "settings" JSONB,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        "isPublic" BOOLEAN NOT NULL DEFAULT false,
        "customDomain" TEXT,
        "brandingConfig" JSONB,
        "industry" TEXT,
        "organizationId" TEXT,

        CONSTRAINT "workspaces_pkey" PRIMARY KEY ("id")
    );

    -- Recreate table if not exists
    CREATE TABLE IF NOT EXISTS "workspace_departments" (
        "id" TEXT NOT NULL,
        "workspaceId" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "slug" TEXT NOT NULL,
        "description" TEXT,
        "icon" TEXT,
        "color" TEXT,
        "parentId" TEXT,
        "managerId" TEXT,
        "settings" JSONB,
        "channelId" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,

        CONSTRAINT "workspace_departments_pkey" PRIMARY KEY ("id")
    );

    -- Recreate table if not exists
    CREATE TABLE IF NOT EXISTS "workspace_teams" (
        "id" TEXT NOT NULL,
        "workspaceId" TEXT NOT NULL,
        "departmentId" TEXT,
        "name" TEXT NOT NULL,
        "slug" TEXT NOT NULL,
        "description" TEXT,
        "icon" TEXT,
        "color" TEXT,
        "leadId" TEXT,
        "settings" JSONB,
        "channelId" TEXT,
        "appId" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,

        CONSTRAINT "workspace_teams_pkey" PRIMARY KEY ("id")
    );

    -- Recreate table if not exists
    CREATE TABLE IF NOT EXISTS "workspace_team_members" (
        "id" TEXT NOT NULL,
        "teamId" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "role" TEXT NOT NULL DEFAULT 'member',
        "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT "workspace_team_members_pkey" PRIMARY KEY ("id")
    );

    -- Recreate table if not exists
    CREATE TABLE IF NOT EXISTS "department_announcements" (
        "id" TEXT NOT NULL,
        "departmentId" TEXT NOT NULL,
        "authorId" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "content" TEXT NOT NULL,
        "priority" TEXT NOT NULL DEFAULT 'normal',
        "pinned" BOOLEAN NOT NULL DEFAULT false,
        "publishAt" TIMESTAMP(3),
        "expiresAt" TIMESTAMP(3),
        "targetAudience" JSONB,
        "attachments" JSONB,
        "reactions" JSONB,
        "readBy" TEXT[] DEFAULT ARRAY[]::TEXT[],
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,

        CONSTRAINT "department_announcements_pkey" PRIMARY KEY ("id")
    );

    -- Recreate table if not exists
    CREATE TABLE IF NOT EXISTS "workspace_api_tokens" (
        "id" TEXT NOT NULL,
        "workspaceId" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "token" TEXT NOT NULL,
        "permissions" JSONB NOT NULL,
        "rateLimit" INTEGER NOT NULL DEFAULT 1000,
        "expiresAt" TIMESTAMP(3),
        "lastUsedAt" TIMESTAMP(3),
        "usageCount" INTEGER NOT NULL DEFAULT 0,
        "createdById" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,

        CONSTRAINT "workspace_api_tokens_pkey" PRIMARY KEY ("id")
    );

    -- Recreate table if not exists
    CREATE TABLE IF NOT EXISTS "workspace_members" (
        "id" TEXT NOT NULL,
        "workspaceId" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "departmentId" TEXT,
        "role" TEXT NOT NULL DEFAULT 'member',
        "memberType" TEXT NOT NULL DEFAULT 'INTERNAL',
        "permissions" BIGINT NOT NULL DEFAULT 0,
        "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "notificationPreference" TEXT NOT NULL DEFAULT 'all',

        CONSTRAINT "workspace_members_pkey" PRIMARY KEY ("id")
    );

    -- Recreate table if not exists
    CREATE TABLE IF NOT EXISTS "workspace_invitations" (
        "id" TEXT NOT NULL,
        "workspaceId" TEXT NOT NULL,
        "email" TEXT NOT NULL,
        "userId" TEXT,
        "token" TEXT NOT NULL,
        "role" TEXT NOT NULL DEFAULT 'member',
        "invitedBy" TEXT NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'pending',
        "permissions" JSONB,
        "expiresAt" TIMESTAMP(3) NOT NULL,
        "acceptedAt" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,

        CONSTRAINT "workspace_invitations_pkey" PRIMARY KEY ("id")
    );

    -- Recreate table if not exists
    CREATE TABLE IF NOT EXISTS "workspace_webhooks" (
        "id" TEXT NOT NULL,
        "workspaceId" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "url" TEXT NOT NULL,
        "secret" TEXT NOT NULL,
        "events" TEXT[],
        "active" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT "workspace_webhooks_pkey" PRIMARY KEY ("id")
    );

    -- Recreate table if not exists
    CREATE TABLE IF NOT EXISTS "workspace_webhook_logs" (
        "id" TEXT NOT NULL,
        "webhookId" TEXT NOT NULL,
        "event" TEXT NOT NULL,
        "payload" JSONB NOT NULL,
        "response" JSONB,
        "success" BOOLEAN NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT "workspace_webhook_logs_pkey" PRIMARY KEY ("id")
    );

    -- Recreate table if not exists
    CREATE TABLE IF NOT EXISTS "workspace_integrations" (
        "id" TEXT NOT NULL,
        "workspaceId" TEXT NOT NULL,
        "service" TEXT NOT NULL,
        "config" JSONB NOT NULL,
        "active" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT "workspace_integrations_pkey" PRIMARY KEY ("id")
    );

    -- Recreate table if not exists
    CREATE TABLE IF NOT EXISTS "workspace_audit_logs" (
        "id" TEXT NOT NULL,
        "workspaceId" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "action" TEXT NOT NULL,
        "resource" TEXT NOT NULL,
        "resourceId" TEXT,
        "metadata" JSONB,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT "workspace_audit_logs_pkey" PRIMARY KEY ("id")
    );

    -- Recreate table if not exists
    CREATE TABLE IF NOT EXISTS "workspace_invite_links" (
        "id" TEXT NOT NULL,
        "workspaceId" TEXT NOT NULL,
        "code" TEXT NOT NULL,
        "maxUses" INTEGER DEFAULT 0,
        "uses" INTEGER NOT NULL DEFAULT 0,
        "expiresAt" TIMESTAMP(3),
        "createdById" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT "workspace_invite_links_pkey" PRIMARY KEY ("id")
    );

    -- Recreate table if not exists
    CREATE TABLE IF NOT EXISTS "channels" (
        "id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "slug" TEXT,
        "icon" TEXT NOT NULL,
        "type" TEXT NOT NULL DEFAULT 'channel',
        "description" TEXT,
        "isPrivate" BOOLEAN NOT NULL DEFAULT false,
        "metadata" JSONB,
        "parentId" TEXT,
        "workspaceId" TEXT,
        "departmentId" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        "createdById" TEXT,
        "appId" TEXT,

        CONSTRAINT "channels_pkey" PRIMARY KEY ("id")
    );

    -- Recreate table if not exists
    CREATE TABLE IF NOT EXISTS "channel_members" (
        "id" TEXT NOT NULL,
        "channelId" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "role" TEXT NOT NULL DEFAULT 'member',
        "permissions" BIGINT,
        "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "notificationPreference" TEXT,

        CONSTRAINT "channel_members_pkey" PRIMARY KEY ("id")
    );

    -- Recreate table if not exists
    CREATE TABLE IF NOT EXISTS "threads" (
        "id" TEXT NOT NULL,
        "channelId" TEXT NOT NULL,
        "creatorId" TEXT NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'Active',
        "dateCreated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        "title" TEXT,
        "rootMessageId" TEXT,

        CONSTRAINT "threads_pkey" PRIMARY KEY ("id")
    );

    -- Recreate table if not exists
    CREATE TABLE IF NOT EXISTS "thread_tags" (
        "id" TEXT NOT NULL,
        "threadId" TEXT NOT NULL,
        "tag" TEXT NOT NULL,

        CONSTRAINT "thread_tags_pkey" PRIMARY KEY ("id")
    );

    -- Recreate table if not exists
    CREATE TABLE IF NOT EXISTS "messages" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "content" TEXT NOT NULL,
        "messageType" TEXT NOT NULL DEFAULT 'standard',
        "metadata" JSONB,
        "isEdited" BOOLEAN NOT NULL DEFAULT false,
        "depth" INTEGER NOT NULL DEFAULT 0,
        "flags" INTEGER NOT NULL DEFAULT 0,
        "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        "channelId" TEXT NOT NULL,
        "threadId" TEXT,
        "replyToId" TEXT,

        CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
    );

    -- Recreate table if not exists
    CREATE TABLE IF NOT EXISTS "message_reads" (
        "id" TEXT NOT NULL,
        "messageId" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT "message_reads_pkey" PRIMARY KEY ("id")
    );

    -- Recreate table if not exists
    CREATE TABLE IF NOT EXISTS "reactions" (
        "id" TEXT NOT NULL,
        "messageId" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "emoji" TEXT NOT NULL,
        "customEmojiId" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT "reactions_pkey" PRIMARY KEY ("id")
    );

    -- Recreate table if not exists
    CREATE TABLE IF NOT EXISTS "message_mentions" (
        "id" TEXT NOT NULL,
        "messageId" TEXT NOT NULL,
        "mention" TEXT NOT NULL,

        CONSTRAINT "message_mentions_pkey" PRIMARY KEY ("id")
    );

    -- Recreate table if not exists
    CREATE TABLE IF NOT EXISTS "attachments" (
        "id" TEXT NOT NULL,
        "messageId" TEXT,
        "name" TEXT NOT NULL,
        "type" TEXT NOT NULL,
        "url" TEXT NOT NULL,
        "size" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT "attachments_pkey" PRIMARY KEY ("id")
    );

    -- Recreate table if not exists
    CREATE TABLE IF NOT EXISTS "direct_messages" (
        "id" TEXT NOT NULL,
        "participant1Id" TEXT NOT NULL,
        "participant2Id" TEXT NOT NULL,
        "lastMessageAt" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,

        CONSTRAINT "direct_messages_pkey" PRIMARY KEY ("id")
    );

    -- Recreate table if not exists
    CREATE TABLE IF NOT EXISTS "dm_messages" (
        "id" TEXT NOT NULL,
        "dmId" TEXT NOT NULL,
        "senderId" TEXT NOT NULL,
        "content" TEXT NOT NULL,
        "isEdited" BOOLEAN NOT NULL DEFAULT false,
        "replyToId" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,

        CONSTRAINT "dm_messages_pkey" PRIMARY KEY ("id")
    );

    -- Recreate table if not exists
    CREATE TABLE IF NOT EXISTS "dm_message_reads" (
        "id" TEXT NOT NULL,
        "messageId" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT "dm_message_reads_pkey" PRIMARY KEY ("id")
    );

    -- Recreate table if not exists
    CREATE TABLE IF NOT EXISTS "dm_reactions" (
        "id" TEXT NOT NULL,
        "messageId" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "emoji" TEXT NOT NULL,
        "customEmojiId" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT "dm_reactions_pkey" PRIMARY KEY ("id")
    );

    -- Recreate table if not exists
    CREATE TABLE IF NOT EXISTS "dm_attachments" (
        "id" TEXT NOT NULL,
        "messageId" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "type" TEXT NOT NULL,
        "url" TEXT NOT NULL,
        "size" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT "dm_attachments_pkey" PRIMARY KEY ("id")
    );

    -- Recreate table if not exists
    CREATE TABLE IF NOT EXISTS "message_actions" (
        "id" TEXT NOT NULL,
        "messageId" TEXT NOT NULL,
        "actionId" TEXT NOT NULL,
        "label" TEXT NOT NULL,
        "style" TEXT NOT NULL DEFAULT 'default',
        "value" TEXT,
        "disabled" BOOLEAN NOT NULL DEFAULT false,
        "order" INTEGER NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT "message_actions_pkey" PRIMARY KEY ("id")
    );

    -- Recreate table if not exists
    CREATE TABLE IF NOT EXISTS "message_action_responses" (
        "id" TEXT NOT NULL,
        "actionId" TEXT NOT NULL,
        "messageId" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "actionValue" TEXT NOT NULL,
        "comment" TEXT,
        "metadata" JSONB,
        "webhookSent" BOOLEAN NOT NULL DEFAULT false,
        "webhookUrl" TEXT,
        "respondedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT "message_action_responses_pkey" PRIMARY KEY ("id")
    );

    -- Recreate table if not exists
    CREATE TABLE IF NOT EXISTS "invitations" (
        "id" TEXT NOT NULL,
        "email" TEXT NOT NULL,
        "token" TEXT NOT NULL,
        "role" TEXT NOT NULL DEFAULT 'member',
        "invitedBy" TEXT NOT NULL,
        "channelId" TEXT,
        "permissions" JSONB,
        "status" TEXT NOT NULL DEFAULT 'pending',
        "expiresAt" TIMESTAMP(3) NOT NULL,
        "acceptedAt" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,

        CONSTRAINT "invitations_pkey" PRIMARY KEY ("id")
    );

    -- Recreate table if not exists
    CREATE TABLE IF NOT EXISTS "invitation_logs" (
        "id" TEXT NOT NULL,
        "invitationId" TEXT NOT NULL,
        "action" TEXT NOT NULL,
        "metadata" JSONB,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT "invitation_logs_pkey" PRIMARY KEY ("id")
    );

    -- Recreate table if not exists
    CREATE TABLE IF NOT EXISTS "api_keys" (
        "id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "key" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "permissions" JSONB NOT NULL,
        "rateLimit" INTEGER NOT NULL DEFAULT 1000,
        "expiresAt" TIMESTAMP(3),
        "lastUsedAt" TIMESTAMP(3),
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,

        CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
    );

    -- Recreate table if not exists
    CREATE TABLE IF NOT EXISTS "webhooks" (
        "id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "url" TEXT NOT NULL,
        "secret" TEXT NOT NULL,
        "events" JSONB NOT NULL,
        "userId" TEXT NOT NULL,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "lastFiredAt" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,

        CONSTRAINT "webhooks_pkey" PRIMARY KEY ("id")
    );

    -- Recreate table if not exists
    CREATE TABLE IF NOT EXISTS "webhook_logs" (
        "id" TEXT NOT NULL,
        "webhookId" TEXT NOT NULL,
        "event" TEXT NOT NULL,
        "payload" JSONB NOT NULL,
        "response" TEXT,
        "statusCode" INTEGER,
        "success" BOOLEAN NOT NULL,
        "error" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT "webhook_logs_pkey" PRIMARY KEY ("id")
    );

    -- Recreate table if not exists
    CREATE TABLE IF NOT EXISTS "notifications" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "type" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "message" TEXT NOT NULL,
        "entityType" TEXT,
        "entityId" TEXT,
        "linkUrl" TEXT,
        "isRead" BOOLEAN NOT NULL DEFAULT false,
        "metadata" JSONB,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
    );

    -- Recreate table if not exists
    CREATE TABLE IF NOT EXISTS "activity_logs" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "action" TEXT NOT NULL,
        "entityType" TEXT NOT NULL,
        "entityId" TEXT NOT NULL,
        "metadata" JSONB,
        "ipAddress" TEXT,
        "userAgent" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
    );

    -- Recreate table if not exists
    CREATE TABLE IF NOT EXISTS "assistant_conversations" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "context" JSONB,
        "settings" JSONB,
        "isArchived" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,

        CONSTRAINT "assistant_conversations_pkey" PRIMARY KEY ("id")
    );

    -- Recreate table if not exists
    CREATE TABLE IF NOT EXISTS "assistant_messages" (
        "id" TEXT NOT NULL,
        "conversationId" TEXT NOT NULL,
        "role" TEXT NOT NULL,
        "content" TEXT NOT NULL,
        "toolCalls" JSONB,
        "toolResults" JSONB,
        "tokens" INTEGER,
        "model" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT "assistant_messages_pkey" PRIMARY KEY ("id")
    );

    -- Recreate table if not exists
    CREATE TABLE IF NOT EXISTS "assistant_tool_usage" (
        "id" TEXT NOT NULL,
        "conversationId" TEXT NOT NULL,
        "toolName" TEXT NOT NULL,
        "parameters" JSONB NOT NULL,
        "result" JSONB,
        "success" BOOLEAN NOT NULL,
        "errorMessage" TEXT,
        "executionTime" INTEGER,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT "assistant_tool_usage_pkey" PRIMARY KEY ("id")
    );

    -- Recreate table if not exists
    CREATE TABLE IF NOT EXISTS "assistant_audit_logs" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "action" TEXT NOT NULL,
        "resourceType" TEXT,
        "resourceId" TEXT,
        "query" TEXT,
        "response" TEXT,
        "metadata" JSONB,
        "ipAddress" TEXT,
        "userAgent" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT "assistant_audit_logs_pkey" PRIMARY KEY ("id")
    );

    -- Recreate table if not exists
    CREATE TABLE IF NOT EXISTS "scheduled_notifications" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "message" TEXT NOT NULL,
        "scheduleType" TEXT NOT NULL,
        "scheduledFor" TIMESTAMP(3) NOT NULL,
        "timezone" TEXT NOT NULL DEFAULT 'UTC',
        "recurrence" JSONB,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "isSent" BOOLEAN NOT NULL DEFAULT false,
        "sentAt" TIMESTAMP(3),
        "entityType" TEXT,
        "entityId" TEXT,
        "linkUrl" TEXT,
        "metadata" JSONB,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,

        CONSTRAINT "scheduled_notifications_pkey" PRIMARY KEY ("id")
    );

    -- Recreate table if not exists
    CREATE TABLE IF NOT EXISTS "scheduled_notification_history" (
        "id" TEXT NOT NULL,
        "scheduledNotificationId" TEXT NOT NULL,
        "sentAt" TIMESTAMP(3) NOT NULL,
        "success" BOOLEAN NOT NULL,
        "errorMessage" TEXT,
        "metadata" JSONB,

        CONSTRAINT "scheduled_notification_history_pkey" PRIMARY KEY ("id")
    );

    -- Recreate table if not exists
    CREATE TABLE IF NOT EXISTS "device_tokens" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "platform" TEXT NOT NULL,
        "token" TEXT NOT NULL,
        "deviceInfo" JSONB,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,

        CONSTRAINT "device_tokens_pkey" PRIMARY KEY ("id")
    );

    -- Recreate table if not exists
    CREATE TABLE IF NOT EXISTS "push_notification_logs" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "notificationId" TEXT,
        "platform" TEXT NOT NULL,
        "deviceToken" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "body" TEXT NOT NULL,
        "data" JSONB,
        "status" TEXT NOT NULL,
        "error" TEXT,
        "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT "push_notification_logs_pkey" PRIMARY KEY ("id")
    );

    -- Recreate table if not exists
    CREATE TABLE IF NOT EXISTS "notification_queue" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "body" TEXT NOT NULL,
        "data" JSONB,
        "imageUrl" TEXT,
        "linkUrl" TEXT,
        "notificationId" TEXT,
        "status" TEXT NOT NULL DEFAULT 'pending',
        "retryCount" INTEGER NOT NULL DEFAULT 0,
        "maxRetries" INTEGER NOT NULL DEFAULT 3,
        "lastError" TEXT,
        "scheduledFor" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,

        CONSTRAINT "notification_queue_pkey" PRIMARY KEY ("id")
    );

    -- Recreate table if not exists
    CREATE TABLE IF NOT EXISTS "calls" (
        "id" TEXT NOT NULL,
        "title" TEXT,
        "description" TEXT,
        "channelName" TEXT NOT NULL,
        "type" TEXT NOT NULL,
        "initiatorId" TEXT,
        "workspaceId" TEXT,
        "channelId" TEXT,
        "status" TEXT NOT NULL DEFAULT 'pending',
        "scheduledFor" TIMESTAMP(3),
        "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "endedAt" TIMESTAMP(3),
        "duration" INTEGER,
        "agoraToken" TEXT,
        "metadata" JSONB,

        CONSTRAINT "calls_pkey" PRIMARY KEY ("id")
    );

    -- Recreate table if not exists
    CREATE TABLE IF NOT EXISTS "call_participants" (
        "id" TEXT NOT NULL,
        "callId" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "leftAt" TIMESTAMP(3),
        "role" TEXT NOT NULL DEFAULT 'participant',
        "muted" BOOLEAN NOT NULL DEFAULT false,
        "videoOff" BOOLEAN NOT NULL DEFAULT false,
        "isBanned" BOOLEAN NOT NULL DEFAULT false,
        "agoraUid" INTEGER,

        CONSTRAINT "call_participants_pkey" PRIMARY KEY ("id")
    );

    -- Recreate table if not exists
    CREATE TABLE IF NOT EXISTS "custom_emojis" (
        "id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "shortcode" TEXT NOT NULL,
        "imageUrl" TEXT NOT NULL,
        "animated" BOOLEAN NOT NULL DEFAULT false,
        "workspaceId" TEXT,
        "createdById" TEXT NOT NULL,
        "category" TEXT NOT NULL DEFAULT 'custom',
        "isGlobal" BOOLEAN NOT NULL DEFAULT false,
        "usageCount" INTEGER NOT NULL DEFAULT 0,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "rules" JSONB,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,

        CONSTRAINT "custom_emojis_pkey" PRIMARY KEY ("id")
    );

    -- Recreate table if not exists
    CREATE TABLE IF NOT EXISTS "user_badges" (
        "id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "description" TEXT,
        "icon" TEXT NOT NULL,
        "color" TEXT NOT NULL,
        "bgColor" TEXT NOT NULL,
        "tier" TEXT NOT NULL DEFAULT 'standard',
        "category" TEXT NOT NULL DEFAULT 'achievement',
        "isGlobal" BOOLEAN NOT NULL DEFAULT false,
        "workspaceId" TEXT,
        "createdById" TEXT NOT NULL,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,

        CONSTRAINT "user_badges_pkey" PRIMARY KEY ("id")
    );

    -- Recreate table if not exists
    CREATE TABLE IF NOT EXISTS "user_badge_assignments" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "badgeId" TEXT NOT NULL,
        "assignedBy" TEXT NOT NULL,
        "reason" TEXT,
        "isPrimary" BOOLEAN NOT NULL DEFAULT false,
        "isVisible" BOOLEAN NOT NULL DEFAULT true,
        "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT "user_badge_assignments_pkey" PRIMARY KEY ("id")
    );

    -- Recreate table if not exists
    CREATE TABLE IF NOT EXISTS "channel_webhooks" (
        "id" TEXT NOT NULL,
        "channelId" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "url" TEXT NOT NULL,
        "secret" TEXT NOT NULL,
        "events" JSONB NOT NULL,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdBy" TEXT NOT NULL,
        "lastFiredAt" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,

        CONSTRAINT "channel_webhooks_pkey" PRIMARY KEY ("id")
    );

    -- Recreate table if not exists
    CREATE TABLE IF NOT EXISTS "channel_webhook_logs" (
        "id" TEXT NOT NULL,
        "webhookId" TEXT NOT NULL,
        "event" TEXT NOT NULL,
        "payload" JSONB NOT NULL,
        "status" INTEGER NOT NULL,
        "response" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT "channel_webhook_logs_pkey" PRIMARY KEY ("id")
    );

    -- Recreate table if not exists
    CREATE TABLE IF NOT EXISTS "channel_incoming_webhooks" (
        "id" TEXT NOT NULL,
        "channelId" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "description" TEXT,
        "token" TEXT NOT NULL,
        "secret" TEXT NOT NULL,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdBy" TEXT NOT NULL,
        "lastReceivedAt" TIMESTAMP(3),
        "totalReceived" INTEGER NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,

        CONSTRAINT "channel_incoming_webhooks_pkey" PRIMARY KEY ("id")
    );

    -- Recreate table if not exists
    CREATE TABLE IF NOT EXISTS "channel_incoming_webhook_logs" (
        "id" TEXT NOT NULL,
        "webhookId" TEXT NOT NULL,
        "payload" JSONB NOT NULL,
        "status" INTEGER NOT NULL,
        "response" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT "channel_incoming_webhook_logs_pkey" PRIMARY KEY ("id")
    );

    -- Recreate table if not exists
    CREATE TABLE IF NOT EXISTS "friends" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "friendId" TEXT NOT NULL,
        "nickname" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT "friends_pkey" PRIMARY KEY ("id")
    );

    -- Recreate table if not exists
    CREATE TABLE IF NOT EXISTS "oauth_clients" (
        "id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "clientId" TEXT NOT NULL,
        "clientSecret" TEXT,
        "redirectUris" TEXT[],
        "userId" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        "disabled" BOOLEAN,
        "skipConsent" BOOLEAN,
        "enableEndSession" BOOLEAN,
        "subjectType" TEXT,
        "scopes" TEXT[],
        "referenceId" TEXT,
        "uri" TEXT,
        "icon" TEXT,
        "contacts" TEXT[],
        "tos" TEXT,
        "policy" TEXT,
        "softwareId" TEXT,
        "softwareVersion" TEXT,
        "softwareStatement" TEXT,
        "postLogoutRedirectUris" TEXT[],
        "tokenEndpointAuthMethod" TEXT,
        "grantTypes" TEXT[],
        "responseTypes" TEXT[],
        "public" BOOLEAN,
        "type" TEXT,
        "requirePKCE" BOOLEAN,
        "metadata" JSONB,

        CONSTRAINT "oauth_clients_pkey" PRIMARY KEY ("id")
    );

    -- Recreate table if not exists
    CREATE TABLE IF NOT EXISTS "oauth_tokens" (
        "id" TEXT NOT NULL,
        "accessToken" TEXT NOT NULL,
        "refreshToken" TEXT,
        "expiresAt" TIMESTAMP(3) NOT NULL,
        "clientId" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "scopes" TEXT[],
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT "oauth_tokens_pkey" PRIMARY KEY ("id")
    );

    -- Recreate table if not exists
    CREATE TABLE IF NOT EXISTS "oauth_refresh_tokens" (
        "id" TEXT NOT NULL,
        "token" TEXT NOT NULL,
        "clientId" TEXT NOT NULL,
        "sessionId" TEXT,
        "userId" TEXT NOT NULL,
        "referenceId" TEXT,
        "scopes" TEXT[],
        "revoked" TIMESTAMP(3),
        "authTime" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "expiresAt" TIMESTAMP(3) NOT NULL,

        CONSTRAINT "oauth_refresh_tokens_pkey" PRIMARY KEY ("id")
    );

    -- Recreate table if not exists
    CREATE TABLE IF NOT EXISTS "oauth_access_tokens" (
        "id" TEXT NOT NULL,
        "token" TEXT NOT NULL,
        "clientId" TEXT NOT NULL,
        "sessionId" TEXT,
        "refreshId" TEXT,
        "userId" TEXT,
        "referenceId" TEXT,
        "scopes" TEXT[],
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "expiresAt" TIMESTAMP(3) NOT NULL,

        CONSTRAINT "oauth_access_tokens_pkey" PRIMARY KEY ("id")
    );

    -- Recreate table if not exists
    CREATE TABLE IF NOT EXISTS "oauth_consents" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "clientId" TEXT NOT NULL,
        "referenceId" TEXT,
        "scopes" TEXT[],
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,

        CONSTRAINT "oauth_consents_pkey" PRIMARY KEY ("id")
    );

    -- Recreate table if not exists
    CREATE TABLE IF NOT EXISTS "personal_access_tokens" (
        "id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "token" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "scopes" TEXT[],
        "lastUsedAt" TIMESTAMP(3),
        "expiresAt" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT "personal_access_tokens_pkey" PRIMARY KEY ("id")
    );

    -- Recreate table if not exists
    CREATE TABLE IF NOT EXISTS "friend_requests" (
        "id" TEXT NOT NULL,
        "senderId" TEXT NOT NULL,
        "receiverId" TEXT NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'pending',
        "message" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "respondedAt" TIMESTAMP(3),

        CONSTRAINT "friend_requests_pkey" PRIMARY KEY ("id")
    );

    -- Recreate table if not exists
    CREATE TABLE IF NOT EXISTS "shared_channels" (
        "id" TEXT NOT NULL,
        "channelId" TEXT NOT NULL,
        "workspaceId" TEXT NOT NULL,
        "permissions" JSONB,
        "status" TEXT NOT NULL DEFAULT 'PENDING',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT "shared_channels_pkey" PRIMARY KEY ("id")
    );

    -- Recreate table if not exists
    CREATE TABLE IF NOT EXISTS "customer_profiles" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "workspaceId" TEXT NOT NULL,
        "company" TEXT,
        "jobTitle" TEXT,
        "crmId" TEXT,
        "metadata" JSONB,
        "tags" TEXT[],
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,

        CONSTRAINT "customer_profiles_pkey" PRIMARY KEY ("id")
    );

    -- Recreate table if not exists
    CREATE TABLE IF NOT EXISTS "support_tickets" (
        "id" TEXT NOT NULL,
        "workspaceId" TEXT NOT NULL,
        "customerId" TEXT NOT NULL,
        "assigneeId" TEXT,
        "subject" TEXT NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'OPEN',
        "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
        "channelId" TEXT,
        "metadata" JSONB,
        "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,

        CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("id")
    );

    -- Recreate table if not exists
    CREATE TABLE IF NOT EXISTS "live_chat_sessions" (
        "id" TEXT NOT NULL,
        "workspaceId" TEXT NOT NULL,
        "customerId" TEXT,
        "ticketId" TEXT,
        "channelId" TEXT NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'ACTIVE',
        "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "endedAt" TIMESTAMP(3),
        "metadata" JSONB,

        CONSTRAINT "live_chat_sessions_pkey" PRIMARY KEY ("id")
    );

    -- Recreate table if not exists
    CREATE TABLE IF NOT EXISTS "organizations" (
        "id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "slug" TEXT NOT NULL,
        "logo" TEXT,
        "banner" TEXT,
        "metadata" JSONB,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
    );

    -- Recreate table if not exists
    CREATE TABLE IF NOT EXISTS "members" (
        "id" TEXT NOT NULL,
        "organizationId" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "role" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT "members_pkey" PRIMARY KEY ("id")
    );

    -- Recreate table if not exists
    CREATE TABLE IF NOT EXISTS "organization_invitations" (
        "id" TEXT NOT NULL,
        "organizationId" TEXT NOT NULL,
        "email" TEXT NOT NULL,
        "role" TEXT,
        "status" TEXT NOT NULL,
        "expiresAt" TIMESTAMP(3) NOT NULL,
        "inviterId" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT "organization_invitations_pkey" PRIMARY KEY ("id")
    );

    -- Recreate table if not exists
    CREATE TABLE IF NOT EXISTS "jwks" (
        "id" TEXT NOT NULL,
        "publicKey" TEXT NOT NULL,
        "privateKey" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL,
        "expiresAt" TIMESTAMP(3),

        CONSTRAINT "jwks_pkey" PRIMARY KEY ("id")
    );

    -- Recreate table if not exists
    CREATE TABLE IF NOT EXISTS "profile_assets" (
        "id" TEXT NOT NULL,
        "url" TEXT NOT NULL,
        "type" TEXT NOT NULL,
        "name" TEXT,
        "animated" BOOLEAN NOT NULL DEFAULT false,
        "themeColors" JSONB,
        "workspaceId" TEXT,
        "rules" JSONB,
        "isGlobal" BOOLEAN NOT NULL DEFAULT true,
        "usageCount" INTEGER NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,

        CONSTRAINT "profile_assets_pkey" PRIMARY KEY ("id")
    );

    -- Recreate table if not exists
    CREATE TABLE IF NOT EXISTS "stickers" (
        "id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "url" TEXT NOT NULL,
        "animated" BOOLEAN NOT NULL DEFAULT false,
        "workspaceId" TEXT,
        "createdById" TEXT NOT NULL,
        "category" TEXT DEFAULT 'custom',
        "isGlobal" BOOLEAN NOT NULL DEFAULT true,
        "rules" JSONB,
        "usageCount" INTEGER NOT NULL DEFAULT 0,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,

        CONSTRAINT "stickers_pkey" PRIMARY KEY ("id")
    );

    -- Recreate table if not exists
    CREATE TABLE IF NOT EXISTS "soundboard_sounds" (
        "id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "url" TEXT NOT NULL,
        "volume" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
        "emoji" TEXT,
        "animated" BOOLEAN NOT NULL DEFAULT false,
        "workspaceId" TEXT,
        "createdById" TEXT NOT NULL,
        "category" TEXT DEFAULT 'custom',
        "isGlobal" BOOLEAN NOT NULL DEFAULT true,
        "rules" JSONB,
        "usageCount" INTEGER NOT NULL DEFAULT 0,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,

        CONSTRAINT "soundboard_sounds_pkey" PRIMARY KEY ("id")
    );

    -- Recreate table if not exists
    CREATE TABLE IF NOT EXISTS "asset_usage_logs" (
        "id" TEXT NOT NULL,
        "assetId" TEXT NOT NULL,
        "assetType" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "workspaceId" TEXT,
        "metadata" JSONB,
        "usedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT "asset_usage_logs_pkey" PRIMARY KEY ("id")
    );

    -- Recreate table if not exists
    CREATE TABLE IF NOT EXISTS "bot_applications" (
        "id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "description" TEXT,
        "icon" TEXT,
        "clientId" TEXT NOT NULL,
        "clientSecret" TEXT NOT NULL,
        "ownerId" TEXT NOT NULL,
        "botId" TEXT,
        "isGlobal" BOOLEAN NOT NULL DEFAULT false,
        "interactionsUrl" TEXT,
        "verifyKey" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        "channelDefinitions" JSONB,
        "workspaceId" TEXT,
        "organizationId" TEXT,
        "scopes" TEXT[],
        "allowedIps" TEXT[],
        "webhookUrl" TEXT,
        "webhookSecret" TEXT,
        "metadata" JSONB,

        CONSTRAINT "bot_applications_pkey" PRIMARY KEY ("id")
    );

    -- Recreate table if not exists
    CREATE TABLE IF NOT EXISTS "bot_commands" (
        "id" TEXT NOT NULL,
        "applicationId" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "description" TEXT NOT NULL,
        "options" JSONB,
        "guildId" TEXT,
        "type" INTEGER NOT NULL DEFAULT 1,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,

        CONSTRAINT "bot_commands_pkey" PRIMARY KEY ("id")
    );

    -- Recreate table if not exists
    CREATE TABLE IF NOT EXISTS "blocked_users" (
        "id" TEXT NOT NULL,
        "blockerId" TEXT NOT NULL,
        "blockedUserId" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT "blocked_users_pkey" PRIMARY KEY ("id")
    );

    -- Recreate table if not exists
    CREATE TABLE IF NOT EXISTS "system_announcements" (
        "id" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "content" TEXT NOT NULL,
        "linkUrl" TEXT,
        "imageUrl" TEXT,
        "adminId" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT "system_announcements_pkey" PRIMARY KEY ("id")
    );

    -- Recreate table if not exists
    CREATE TABLE IF NOT EXISTS "_ThreadMembers" (
        "A" TEXT NOT NULL,
        "B" TEXT NOT NULL,

        CONSTRAINT "_ThreadMembers_AB_pkey" PRIMARY KEY ("A","B")
    );

    -- Recreate index if not exists
    CREATE UNIQUE INDEX IF NOT EXISTS "users_username_key" ON "users"("username");

    -- Recreate index if not exists
    CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email");

    -- Recreate index if not exists
    CREATE UNIQUE INDEX IF NOT EXISTS "users_botToken_key" ON "users"("botToken");

    -- Recreate index if not exists
    CREATE INDEX IF NOT EXISTS "verifications_identifier_idx" ON "verifications"("identifier");

    -- Recreate index if not exists
    CREATE UNIQUE INDEX IF NOT EXISTS "verifications_identifier_value_key" ON "verifications"("identifier", "value");

    -- Recreate index if not exists
    CREATE UNIQUE INDEX IF NOT EXISTS "sessions_token_key" ON "sessions"("token");

    -- Recreate index if not exists
    CREATE INDEX IF NOT EXISTS "sessions_userId_idx" ON "sessions"("userId");

    -- Recreate index if not exists
    CREATE INDEX IF NOT EXISTS "account_userId_idx" ON "account"("userId");

    -- Recreate index if not exists
    CREATE UNIQUE INDEX IF NOT EXISTS "workspaces_slug_key" ON "workspaces"("slug");

    -- Recreate index if not exists
    CREATE UNIQUE INDEX IF NOT EXISTS "workspaces_customDomain_key" ON "workspaces"("customDomain");

    -- Recreate index if not exists
    CREATE UNIQUE INDEX IF NOT EXISTS "workspace_departments_workspaceId_slug_key" ON "workspace_departments"("workspaceId", "slug");

    -- Recreate index if not exists
    CREATE UNIQUE INDEX IF NOT EXISTS "workspace_teams_workspaceId_slug_key" ON "workspace_teams"("workspaceId", "slug");

    -- Recreate index if not exists
    CREATE UNIQUE INDEX IF NOT EXISTS "workspace_team_members_teamId_userId_key" ON "workspace_team_members"("teamId", "userId");

    -- Recreate index if not exists
    CREATE UNIQUE INDEX IF NOT EXISTS "workspace_api_tokens_token_key" ON "workspace_api_tokens"("token");

    -- Recreate index if not exists
    CREATE UNIQUE INDEX IF NOT EXISTS "workspace_members_workspaceId_userId_key" ON "workspace_members"("workspaceId", "userId");

    -- Recreate index if not exists
    CREATE UNIQUE INDEX IF NOT EXISTS "workspace_invitations_token_key" ON "workspace_invitations"("token");

    -- Recreate index if not exists
    CREATE INDEX IF NOT EXISTS "workspace_invitations_email_idx" ON "workspace_invitations"("email");

    -- Recreate index if not exists
    CREATE INDEX IF NOT EXISTS "workspace_invitations_workspaceId_idx" ON "workspace_invitations"("workspaceId");

    -- Recreate index if not exists
    CREATE INDEX IF NOT EXISTS "workspace_audit_logs_workspaceId_createdAt_idx" ON "workspace_audit_logs"("workspaceId", "createdAt");

    -- Recreate index if not exists
    CREATE UNIQUE INDEX IF NOT EXISTS "workspace_invite_links_code_key" ON "workspace_invite_links"("code");

    -- Recreate index if not exists
    CREATE UNIQUE INDEX IF NOT EXISTS "channels_workspaceId_slug_key" ON "channels"("workspaceId", "slug");

    -- Recreate index if not exists
    CREATE UNIQUE INDEX IF NOT EXISTS "channel_members_channelId_userId_key" ON "channel_members"("channelId", "userId");

    -- Recreate index if not exists
    CREATE UNIQUE INDEX IF NOT EXISTS "threads_rootMessageId_key" ON "threads"("rootMessageId");

    -- Recreate index if not exists
    CREATE UNIQUE INDEX IF NOT EXISTS "thread_tags_threadId_tag_key" ON "thread_tags"("threadId", "tag");

    -- Recreate index if not exists
    CREATE INDEX IF NOT EXISTS "messages_channelId_timestamp_idx" ON "messages"("channelId", "timestamp");

    -- Recreate index if not exists
    CREATE INDEX IF NOT EXISTS "messages_threadId_idx" ON "messages"("threadId");

    -- Recreate index if not exists
    CREATE INDEX IF NOT EXISTS "message_reads_userId_idx" ON "message_reads"("userId");

    -- Recreate index if not exists
    CREATE INDEX IF NOT EXISTS "message_reads_messageId_idx" ON "message_reads"("messageId");

    -- Recreate index if not exists
    CREATE UNIQUE INDEX IF NOT EXISTS "message_reads_messageId_userId_key" ON "message_reads"("messageId", "userId");

    -- Recreate index if not exists
    CREATE UNIQUE INDEX IF NOT EXISTS "reactions_messageId_userId_emoji_key" ON "reactions"("messageId", "userId", "emoji");

    -- Recreate index if not exists
    CREATE INDEX IF NOT EXISTS "direct_messages_participant1Id_idx" ON "direct_messages"("participant1Id");

    -- Recreate index if not exists
    CREATE INDEX IF NOT EXISTS "direct_messages_participant2Id_idx" ON "direct_messages"("participant2Id");

    -- Recreate index if not exists
    CREATE UNIQUE INDEX IF NOT EXISTS "direct_messages_participant1Id_participant2Id_key" ON "direct_messages"("participant1Id", "participant2Id");

    -- Recreate index if not exists
    CREATE INDEX IF NOT EXISTS "dm_messages_dmId_idx" ON "dm_messages"("dmId");

    -- Recreate index if not exists
    CREATE INDEX IF NOT EXISTS "dm_messages_senderId_idx" ON "dm_messages"("senderId");

    -- Recreate index if not exists
    CREATE INDEX IF NOT EXISTS "dm_message_reads_userId_idx" ON "dm_message_reads"("userId");

    -- Recreate index if not exists
    CREATE INDEX IF NOT EXISTS "dm_message_reads_messageId_idx" ON "dm_message_reads"("messageId");

    -- Recreate index if not exists
    CREATE UNIQUE INDEX IF NOT EXISTS "dm_message_reads_messageId_userId_key" ON "dm_message_reads"("messageId", "userId");

    -- Recreate index if not exists
    CREATE UNIQUE INDEX IF NOT EXISTS "dm_reactions_messageId_userId_emoji_key" ON "dm_reactions"("messageId", "userId", "emoji");

    -- Recreate index if not exists
    CREATE INDEX IF NOT EXISTS "message_actions_messageId_idx" ON "message_actions"("messageId");

    -- Recreate index if not exists
    CREATE UNIQUE INDEX IF NOT EXISTS "message_actions_messageId_actionId_key" ON "message_actions"("messageId", "actionId");

    -- Recreate index if not exists
    CREATE INDEX IF NOT EXISTS "message_action_responses_messageId_idx" ON "message_action_responses"("messageId");

    -- Recreate index if not exists
    CREATE INDEX IF NOT EXISTS "message_action_responses_userId_idx" ON "message_action_responses"("userId");

    -- Recreate index if not exists
    CREATE UNIQUE INDEX IF NOT EXISTS "message_action_responses_actionId_userId_key" ON "message_action_responses"("actionId", "userId");

    -- Recreate index if not exists
    CREATE UNIQUE INDEX IF NOT EXISTS "invitations_token_key" ON "invitations"("token");

    -- Recreate index if not exists
    CREATE INDEX IF NOT EXISTS "invitations_email_idx" ON "invitations"("email");

    -- Recreate index if not exists
    CREATE INDEX IF NOT EXISTS "invitation_logs_invitationId_idx" ON "invitation_logs"("invitationId");

    -- Recreate index if not exists
    CREATE UNIQUE INDEX IF NOT EXISTS "api_keys_key_key" ON "api_keys"("key");

    -- Recreate index if not exists
    CREATE INDEX IF NOT EXISTS "api_keys_key_idx" ON "api_keys"("key");

    -- Recreate index if not exists
    CREATE INDEX IF NOT EXISTS "api_keys_userId_idx" ON "api_keys"("userId");

    -- Recreate index if not exists
    CREATE INDEX IF NOT EXISTS "webhooks_userId_idx" ON "webhooks"("userId");

    -- Recreate index if not exists
    CREATE INDEX IF NOT EXISTS "webhook_logs_webhookId_idx" ON "webhook_logs"("webhookId");

    -- Recreate index if not exists
    CREATE INDEX IF NOT EXISTS "webhook_logs_createdAt_idx" ON "webhook_logs"("createdAt");

    -- Recreate index if not exists
    CREATE INDEX IF NOT EXISTS "notifications_userId_isRead_idx" ON "notifications"("userId", "isRead");

    -- Recreate index if not exists
    CREATE INDEX IF NOT EXISTS "activity_logs_userId_idx" ON "activity_logs"("userId");

    -- Recreate index if not exists
    CREATE INDEX IF NOT EXISTS "activity_logs_entityType_entityId_idx" ON "activity_logs"("entityType", "entityId");

    -- Recreate index if not exists
    CREATE INDEX IF NOT EXISTS "activity_logs_createdAt_idx" ON "activity_logs"("createdAt");

    -- Recreate index if not exists
    CREATE INDEX IF NOT EXISTS "assistant_conversations_userId_idx" ON "assistant_conversations"("userId");

    -- Recreate index if not exists
    CREATE INDEX IF NOT EXISTS "assistant_messages_conversationId_idx" ON "assistant_messages"("conversationId");

    -- Recreate index if not exists
    CREATE INDEX IF NOT EXISTS "assistant_tool_usage_conversationId_idx" ON "assistant_tool_usage"("conversationId");

    -- Recreate index if not exists
    CREATE INDEX IF NOT EXISTS "assistant_tool_usage_toolName_idx" ON "assistant_tool_usage"("toolName");

    -- Recreate index if not exists
    CREATE INDEX IF NOT EXISTS "assistant_audit_logs_userId_idx" ON "assistant_audit_logs"("userId");

    -- Recreate index if not exists
    CREATE INDEX IF NOT EXISTS "assistant_audit_logs_resourceType_resourceId_idx" ON "assistant_audit_logs"("resourceType", "resourceId");

    -- Recreate index if not exists
    CREATE INDEX IF NOT EXISTS "assistant_audit_logs_createdAt_idx" ON "assistant_audit_logs"("createdAt");

    -- Recreate index if not exists
    CREATE INDEX IF NOT EXISTS "scheduled_notifications_userId_idx" ON "scheduled_notifications"("userId");

    -- Recreate index if not exists
    CREATE INDEX IF NOT EXISTS "scheduled_notifications_scheduledFor_idx" ON "scheduled_notifications"("scheduledFor");

    -- Recreate index if not exists
    CREATE INDEX IF NOT EXISTS "scheduled_notifications_isActive_isSent_idx" ON "scheduled_notifications"("isActive", "isSent");

    -- Recreate index if not exists
    CREATE INDEX IF NOT EXISTS "scheduled_notification_history_scheduledNotificationId_idx" ON "scheduled_notification_history"("scheduledNotificationId");

    -- Recreate index if not exists
    CREATE UNIQUE INDEX IF NOT EXISTS "device_tokens_token_key" ON "device_tokens"("token");

    -- Recreate index if not exists
    CREATE INDEX IF NOT EXISTS "device_tokens_userId_idx" ON "device_tokens"("userId");

    -- Recreate index if not exists
    CREATE INDEX IF NOT EXISTS "device_tokens_platform_idx" ON "device_tokens"("platform");

    -- Recreate index if not exists
    CREATE INDEX IF NOT EXISTS "device_tokens_token_idx" ON "device_tokens"("token");

    -- Recreate index if not exists
    CREATE INDEX IF NOT EXISTS "push_notification_logs_userId_idx" ON "push_notification_logs"("userId");

    -- Recreate index if not exists
    CREATE INDEX IF NOT EXISTS "push_notification_logs_notificationId_idx" ON "push_notification_logs"("notificationId");

    -- Recreate index if not exists
    CREATE INDEX IF NOT EXISTS "push_notification_logs_status_idx" ON "push_notification_logs"("status");

    -- Recreate index if not exists
    CREATE INDEX IF NOT EXISTS "notification_queue_status_scheduledFor_idx" ON "notification_queue"("status", "scheduledFor");

    -- Recreate index if not exists
    CREATE INDEX IF NOT EXISTS "notification_queue_userId_idx" ON "notification_queue"("userId");

    -- Recreate index if not exists
    CREATE INDEX IF NOT EXISTS "calls_channelName_idx" ON "calls"("channelName");

    -- Recreate index if not exists
    CREATE INDEX IF NOT EXISTS "calls_initiatorId_idx" ON "calls"("initiatorId");

    -- Recreate index if not exists
    CREATE INDEX IF NOT EXISTS "calls_status_idx" ON "calls"("status");

    -- Recreate index if not exists
    CREATE INDEX IF NOT EXISTS "calls_workspaceId_idx" ON "calls"("workspaceId");

    -- Recreate index if not exists
    CREATE INDEX IF NOT EXISTS "call_participants_callId_idx" ON "call_participants"("callId");

    -- Recreate index if not exists
    CREATE INDEX IF NOT EXISTS "call_participants_userId_idx" ON "call_participants"("userId");

    -- Recreate index if not exists
    CREATE UNIQUE INDEX IF NOT EXISTS "call_participants_callId_userId_key" ON "call_participants"("callId", "userId");

    -- Recreate index if not exists
    CREATE UNIQUE INDEX IF NOT EXISTS "custom_emojis_shortcode_workspaceId_key" ON "custom_emojis"("shortcode", "workspaceId");

    -- Recreate index if not exists
    CREATE UNIQUE INDEX IF NOT EXISTS "user_badge_assignments_userId_badgeId_key" ON "user_badge_assignments"("userId", "badgeId");

    -- Recreate index if not exists
    CREATE INDEX IF NOT EXISTS "channel_webhooks_channelId_idx" ON "channel_webhooks"("channelId");

    -- Recreate index if not exists
    CREATE INDEX IF NOT EXISTS "channel_webhook_logs_webhookId_idx" ON "channel_webhook_logs"("webhookId");

    -- Recreate index if not exists
    CREATE UNIQUE INDEX IF NOT EXISTS "channel_incoming_webhooks_token_key" ON "channel_incoming_webhooks"("token");

    -- Recreate index if not exists
    CREATE INDEX IF NOT EXISTS "channel_incoming_webhooks_channelId_idx" ON "channel_incoming_webhooks"("channelId");

    -- Recreate index if not exists
    CREATE INDEX IF NOT EXISTS "channel_incoming_webhooks_token_idx" ON "channel_incoming_webhooks"("token");

    -- Recreate index if not exists
    CREATE INDEX IF NOT EXISTS "channel_incoming_webhook_logs_webhookId_idx" ON "channel_incoming_webhook_logs"("webhookId");

    -- Recreate index if not exists
    CREATE INDEX IF NOT EXISTS "friends_userId_idx" ON "friends"("userId");

    -- Recreate index if not exists
    CREATE INDEX IF NOT EXISTS "friends_friendId_idx" ON "friends"("friendId");

    -- Recreate index if not exists
    CREATE UNIQUE INDEX IF NOT EXISTS "friends_userId_friendId_key" ON "friends"("userId", "friendId");

    -- Recreate index if not exists
    CREATE UNIQUE INDEX IF NOT EXISTS "oauth_clients_clientId_key" ON "oauth_clients"("clientId");

    -- Recreate index if not exists
    CREATE UNIQUE INDEX IF NOT EXISTS "oauth_tokens_accessToken_key" ON "oauth_tokens"("accessToken");

    -- Recreate index if not exists
    CREATE UNIQUE INDEX IF NOT EXISTS "oauth_tokens_refreshToken_key" ON "oauth_tokens"("refreshToken");

    -- Recreate index if not exists
    CREATE UNIQUE INDEX IF NOT EXISTS "oauth_refresh_tokens_token_key" ON "oauth_refresh_tokens"("token");

    -- Recreate index if not exists
    CREATE UNIQUE INDEX IF NOT EXISTS "oauth_access_tokens_token_key" ON "oauth_access_tokens"("token");

    -- Recreate index if not exists
    CREATE UNIQUE INDEX IF NOT EXISTS "personal_access_tokens_token_key" ON "personal_access_tokens"("token");

    -- Recreate index if not exists
    CREATE INDEX IF NOT EXISTS "friend_requests_senderId_idx" ON "friend_requests"("senderId");

    -- Recreate index if not exists
    CREATE INDEX IF NOT EXISTS "friend_requests_receiverId_idx" ON "friend_requests"("receiverId");

    -- Recreate index if not exists
    CREATE INDEX IF NOT EXISTS "friend_requests_status_idx" ON "friend_requests"("status");

    -- Recreate index if not exists
    CREATE UNIQUE INDEX IF NOT EXISTS "friend_requests_senderId_receiverId_key" ON "friend_requests"("senderId", "receiverId");

    -- Recreate index if not exists
    CREATE UNIQUE INDEX IF NOT EXISTS "shared_channels_channelId_workspaceId_key" ON "shared_channels"("channelId", "workspaceId");

    -- Recreate index if not exists
    CREATE UNIQUE INDEX IF NOT EXISTS "customer_profiles_userId_key" ON "customer_profiles"("userId");

    -- Recreate index if not exists
    CREATE INDEX IF NOT EXISTS "customer_profiles_workspaceId_idx" ON "customer_profiles"("workspaceId");

    -- Recreate index if not exists
    CREATE UNIQUE INDEX IF NOT EXISTS "support_tickets_channelId_key" ON "support_tickets"("channelId");

    -- Recreate index if not exists
    CREATE INDEX IF NOT EXISTS "support_tickets_workspaceId_status_idx" ON "support_tickets"("workspaceId", "status");

    -- Recreate index if not exists
    CREATE INDEX IF NOT EXISTS "support_tickets_assigneeId_idx" ON "support_tickets"("assigneeId");

    -- Recreate index if not exists
    CREATE UNIQUE INDEX IF NOT EXISTS "live_chat_sessions_channelId_key" ON "live_chat_sessions"("channelId");

    -- Recreate index if not exists
    CREATE INDEX IF NOT EXISTS "live_chat_sessions_workspaceId_status_idx" ON "live_chat_sessions"("workspaceId", "status");

    -- Recreate index if not exists
    CREATE UNIQUE INDEX IF NOT EXISTS "organizations_slug_key" ON "organizations"("slug");

    -- Recreate index if not exists
    CREATE INDEX IF NOT EXISTS "members_organizationId_idx" ON "members"("organizationId");

    -- Recreate index if not exists
    CREATE INDEX IF NOT EXISTS "members_userId_idx" ON "members"("userId");

    -- Recreate index if not exists
    CREATE INDEX IF NOT EXISTS "asset_usage_logs_assetId_assetType_idx" ON "asset_usage_logs"("assetId", "assetType");

    -- Recreate index if not exists
    CREATE INDEX IF NOT EXISTS "asset_usage_logs_userId_idx" ON "asset_usage_logs"("userId");

    -- Recreate index if not exists
    CREATE UNIQUE INDEX IF NOT EXISTS "bot_applications_clientId_key" ON "bot_applications"("clientId");

    -- Recreate index if not exists
    CREATE UNIQUE INDEX IF NOT EXISTS "bot_applications_botId_key" ON "bot_applications"("botId");

    -- Recreate index if not exists
    CREATE UNIQUE INDEX IF NOT EXISTS "bot_applications_verifyKey_key" ON "bot_applications"("verifyKey");

    -- Recreate index if not exists
    CREATE UNIQUE INDEX IF NOT EXISTS "bot_commands_applicationId_name_guildId_key" ON "bot_commands"("applicationId", "name", "guildId");

    -- Recreate index if not exists
    CREATE INDEX IF NOT EXISTS "blocked_users_blockerId_idx" ON "blocked_users"("blockerId");

    -- Recreate index if not exists
    CREATE INDEX IF NOT EXISTS "blocked_users_blockedUserId_idx" ON "blocked_users"("blockedUserId");

    -- Recreate index if not exists
    CREATE UNIQUE INDEX IF NOT EXISTS "blocked_users_blockerId_blockedUserId_key" ON "blocked_users"("blockerId", "blockedUserId");

    -- Recreate index if not exists
    CREATE INDEX IF NOT EXISTS "_ThreadMembers_B_index" ON "_ThreadMembers"("B");

    -- Add constraint verifications_userId_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'verifications_userId_fkey'
    ) THEN
        ALTER TABLE "verifications" ADD CONSTRAINT "verifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Add constraint sessions_userId_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'sessions_userId_fkey'
    ) THEN
        ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Add constraint account_userId_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'account_userId_fkey'
    ) THEN
        ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Add constraint workspaces_organizationId_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'workspaces_organizationId_fkey'
    ) THEN
        ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;

    -- Add constraint workspaces_ownerId_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'workspaces_ownerId_fkey'
    ) THEN
        ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;

    -- Add constraint workspace_departments_managerId_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'workspace_departments_managerId_fkey'
    ) THEN
        ALTER TABLE "workspace_departments" ADD CONSTRAINT "workspace_departments_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;

    -- Add constraint workspace_departments_channelId_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'workspace_departments_channelId_fkey'
    ) THEN
        ALTER TABLE "workspace_departments" ADD CONSTRAINT "workspace_departments_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "channels"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;

    -- Add constraint workspace_departments_workspaceId_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'workspace_departments_workspaceId_fkey'
    ) THEN
        ALTER TABLE "workspace_departments" ADD CONSTRAINT "workspace_departments_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Add constraint workspace_departments_parentId_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'workspace_departments_parentId_fkey'
    ) THEN
        ALTER TABLE "workspace_departments" ADD CONSTRAINT "workspace_departments_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "workspace_departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;

    -- Add constraint workspace_teams_workspaceId_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'workspace_teams_workspaceId_fkey'
    ) THEN
        ALTER TABLE "workspace_teams" ADD CONSTRAINT "workspace_teams_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Add constraint workspace_teams_appId_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'workspace_teams_appId_fkey'
    ) THEN
        ALTER TABLE "workspace_teams" ADD CONSTRAINT "workspace_teams_appId_fkey" FOREIGN KEY ("appId") REFERENCES "bot_applications"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;

    -- Add constraint workspace_teams_departmentId_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'workspace_teams_departmentId_fkey'
    ) THEN
        ALTER TABLE "workspace_teams" ADD CONSTRAINT "workspace_teams_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "workspace_departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;

    -- Add constraint workspace_team_members_teamId_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'workspace_team_members_teamId_fkey'
    ) THEN
        ALTER TABLE "workspace_team_members" ADD CONSTRAINT "workspace_team_members_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "workspace_teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Add constraint workspace_team_members_userId_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'workspace_team_members_userId_fkey'
    ) THEN
        ALTER TABLE "workspace_team_members" ADD CONSTRAINT "workspace_team_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Add constraint department_announcements_departmentId_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'department_announcements_departmentId_fkey'
    ) THEN
        ALTER TABLE "department_announcements" ADD CONSTRAINT "department_announcements_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "workspace_departments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Add constraint department_announcements_authorId_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'department_announcements_authorId_fkey'
    ) THEN
        ALTER TABLE "department_announcements" ADD CONSTRAINT "department_announcements_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;

    -- Add constraint workspace_api_tokens_workspaceId_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'workspace_api_tokens_workspaceId_fkey'
    ) THEN
        ALTER TABLE "workspace_api_tokens" ADD CONSTRAINT "workspace_api_tokens_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Add constraint workspace_api_tokens_createdById_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'workspace_api_tokens_createdById_fkey'
    ) THEN
        ALTER TABLE "workspace_api_tokens" ADD CONSTRAINT "workspace_api_tokens_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;

    -- Add constraint workspace_members_workspaceId_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'workspace_members_workspaceId_fkey'
    ) THEN
        ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Add constraint workspace_members_userId_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'workspace_members_userId_fkey'
    ) THEN
        ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Add constraint workspace_members_departmentId_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'workspace_members_departmentId_fkey'
    ) THEN
        ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "workspace_departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;

    -- Add constraint workspace_invitations_workspaceId_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'workspace_invitations_workspaceId_fkey'
    ) THEN
        ALTER TABLE "workspace_invitations" ADD CONSTRAINT "workspace_invitations_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Add constraint workspace_invitations_invitedBy_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'workspace_invitations_invitedBy_fkey'
    ) THEN
        ALTER TABLE "workspace_invitations" ADD CONSTRAINT "workspace_invitations_invitedBy_fkey" FOREIGN KEY ("invitedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;

    -- Add constraint workspace_invitations_userId_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'workspace_invitations_userId_fkey'
    ) THEN
        ALTER TABLE "workspace_invitations" ADD CONSTRAINT "workspace_invitations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;

    -- Add constraint workspace_webhooks_workspaceId_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'workspace_webhooks_workspaceId_fkey'
    ) THEN
        ALTER TABLE "workspace_webhooks" ADD CONSTRAINT "workspace_webhooks_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Add constraint workspace_webhook_logs_webhookId_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'workspace_webhook_logs_webhookId_fkey'
    ) THEN
        ALTER TABLE "workspace_webhook_logs" ADD CONSTRAINT "workspace_webhook_logs_webhookId_fkey" FOREIGN KEY ("webhookId") REFERENCES "workspace_webhooks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Add constraint workspace_integrations_workspaceId_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'workspace_integrations_workspaceId_fkey'
    ) THEN
        ALTER TABLE "workspace_integrations" ADD CONSTRAINT "workspace_integrations_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Add constraint workspace_audit_logs_workspaceId_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'workspace_audit_logs_workspaceId_fkey'
    ) THEN
        ALTER TABLE "workspace_audit_logs" ADD CONSTRAINT "workspace_audit_logs_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Add constraint workspace_invite_links_workspaceId_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'workspace_invite_links_workspaceId_fkey'
    ) THEN
        ALTER TABLE "workspace_invite_links" ADD CONSTRAINT "workspace_invite_links_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Add constraint workspace_invite_links_createdById_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'workspace_invite_links_createdById_fkey'
    ) THEN
        ALTER TABLE "workspace_invite_links" ADD CONSTRAINT "workspace_invite_links_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;

    -- Add constraint channels_departmentId_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'channels_departmentId_fkey'
    ) THEN
        ALTER TABLE "channels" ADD CONSTRAINT "channels_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "workspace_departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;

    -- Add constraint channels_parentId_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'channels_parentId_fkey'
    ) THEN
        ALTER TABLE "channels" ADD CONSTRAINT "channels_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "channels"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;

    -- Add constraint channels_workspaceId_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'channels_workspaceId_fkey'
    ) THEN
        ALTER TABLE "channels" ADD CONSTRAINT "channels_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Add constraint channels_createdById_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'channels_createdById_fkey'
    ) THEN
        ALTER TABLE "channels" ADD CONSTRAINT "channels_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;

    -- Add constraint channels_appId_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'channels_appId_fkey'
    ) THEN
        ALTER TABLE "channels" ADD CONSTRAINT "channels_appId_fkey" FOREIGN KEY ("appId") REFERENCES "bot_applications"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;

    -- Add constraint channel_members_channelId_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'channel_members_channelId_fkey'
    ) THEN
        ALTER TABLE "channel_members" ADD CONSTRAINT "channel_members_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Add constraint channel_members_userId_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'channel_members_userId_fkey'
    ) THEN
        ALTER TABLE "channel_members" ADD CONSTRAINT "channel_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Add constraint threads_channelId_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'threads_channelId_fkey'
    ) THEN
        ALTER TABLE "threads" ADD CONSTRAINT "threads_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Add constraint threads_creatorId_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'threads_creatorId_fkey'
    ) THEN
        ALTER TABLE "threads" ADD CONSTRAINT "threads_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;

    -- Add constraint threads_rootMessageId_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'threads_rootMessageId_fkey'
    ) THEN
        ALTER TABLE "threads" ADD CONSTRAINT "threads_rootMessageId_fkey" FOREIGN KEY ("rootMessageId") REFERENCES "messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;

    -- Add constraint thread_tags_threadId_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'thread_tags_threadId_fkey'
    ) THEN
        ALTER TABLE "thread_tags" ADD CONSTRAINT "thread_tags_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Add constraint messages_channelId_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'messages_channelId_fkey'
    ) THEN
        ALTER TABLE "messages" ADD CONSTRAINT "messages_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Add constraint messages_threadId_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'messages_threadId_fkey'
    ) THEN
        ALTER TABLE "messages" ADD CONSTRAINT "messages_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Add constraint messages_replyToId_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'messages_replyToId_fkey'
    ) THEN
        ALTER TABLE "messages" ADD CONSTRAINT "messages_replyToId_fkey" FOREIGN KEY ("replyToId") REFERENCES "messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;

    -- Add constraint messages_userId_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'messages_userId_fkey'
    ) THEN
        ALTER TABLE "messages" ADD CONSTRAINT "messages_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Add constraint message_reads_messageId_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'message_reads_messageId_fkey'
    ) THEN
        ALTER TABLE "message_reads" ADD CONSTRAINT "message_reads_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Add constraint message_reads_userId_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'message_reads_userId_fkey'
    ) THEN
        ALTER TABLE "message_reads" ADD CONSTRAINT "message_reads_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Add constraint reactions_messageId_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'reactions_messageId_fkey'
    ) THEN
        ALTER TABLE "reactions" ADD CONSTRAINT "reactions_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Add constraint reactions_userId_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'reactions_userId_fkey'
    ) THEN
        ALTER TABLE "reactions" ADD CONSTRAINT "reactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Add constraint reactions_customEmojiId_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'reactions_customEmojiId_fkey'
    ) THEN
        ALTER TABLE "reactions" ADD CONSTRAINT "reactions_customEmojiId_fkey" FOREIGN KEY ("customEmojiId") REFERENCES "custom_emojis"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;

    -- Add constraint message_mentions_messageId_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'message_mentions_messageId_fkey'
    ) THEN
        ALTER TABLE "message_mentions" ADD CONSTRAINT "message_mentions_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Add constraint attachments_messageId_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'attachments_messageId_fkey'
    ) THEN
        ALTER TABLE "attachments" ADD CONSTRAINT "attachments_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Add constraint direct_messages_participant1Id_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'direct_messages_participant1Id_fkey'
    ) THEN
        ALTER TABLE "direct_messages" ADD CONSTRAINT "direct_messages_participant1Id_fkey" FOREIGN KEY ("participant1Id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Add constraint direct_messages_participant2Id_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'direct_messages_participant2Id_fkey'
    ) THEN
        ALTER TABLE "direct_messages" ADD CONSTRAINT "direct_messages_participant2Id_fkey" FOREIGN KEY ("participant2Id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Add constraint dm_messages_dmId_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'dm_messages_dmId_fkey'
    ) THEN
        ALTER TABLE "dm_messages" ADD CONSTRAINT "dm_messages_dmId_fkey" FOREIGN KEY ("dmId") REFERENCES "direct_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Add constraint dm_messages_senderId_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'dm_messages_senderId_fkey'
    ) THEN
        ALTER TABLE "dm_messages" ADD CONSTRAINT "dm_messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Add constraint dm_messages_replyToId_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'dm_messages_replyToId_fkey'
    ) THEN
        ALTER TABLE "dm_messages" ADD CONSTRAINT "dm_messages_replyToId_fkey" FOREIGN KEY ("replyToId") REFERENCES "dm_messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;

    -- Add constraint dm_message_reads_messageId_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'dm_message_reads_messageId_fkey'
    ) THEN
        ALTER TABLE "dm_message_reads" ADD CONSTRAINT "dm_message_reads_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "dm_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Add constraint dm_message_reads_userId_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'dm_message_reads_userId_fkey'
    ) THEN
        ALTER TABLE "dm_message_reads" ADD CONSTRAINT "dm_message_reads_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Add constraint dm_reactions_messageId_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'dm_reactions_messageId_fkey'
    ) THEN
        ALTER TABLE "dm_reactions" ADD CONSTRAINT "dm_reactions_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "dm_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Add constraint dm_reactions_userId_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'dm_reactions_userId_fkey'
    ) THEN
        ALTER TABLE "dm_reactions" ADD CONSTRAINT "dm_reactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Add constraint dm_reactions_customEmojiId_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'dm_reactions_customEmojiId_fkey'
    ) THEN
        ALTER TABLE "dm_reactions" ADD CONSTRAINT "dm_reactions_customEmojiId_fkey" FOREIGN KEY ("customEmojiId") REFERENCES "custom_emojis"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;

    -- Add constraint dm_attachments_messageId_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'dm_attachments_messageId_fkey'
    ) THEN
        ALTER TABLE "dm_attachments" ADD CONSTRAINT "dm_attachments_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "dm_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Add constraint message_actions_messageId_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'message_actions_messageId_fkey'
    ) THEN
        ALTER TABLE "message_actions" ADD CONSTRAINT "message_actions_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Add constraint message_action_responses_actionId_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'message_action_responses_actionId_fkey'
    ) THEN
        ALTER TABLE "message_action_responses" ADD CONSTRAINT "message_action_responses_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "message_actions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Add constraint message_action_responses_userId_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'message_action_responses_userId_fkey'
    ) THEN
        ALTER TABLE "message_action_responses" ADD CONSTRAINT "message_action_responses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Add constraint invitations_invitedBy_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'invitations_invitedBy_fkey'
    ) THEN
        ALTER TABLE "invitations" ADD CONSTRAINT "invitations_invitedBy_fkey" FOREIGN KEY ("invitedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;

    -- Add constraint invitations_channelId_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'invitations_channelId_fkey'
    ) THEN
        ALTER TABLE "invitations" ADD CONSTRAINT "invitations_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Add constraint invitation_logs_invitationId_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'invitation_logs_invitationId_fkey'
    ) THEN
        ALTER TABLE "invitation_logs" ADD CONSTRAINT "invitation_logs_invitationId_fkey" FOREIGN KEY ("invitationId") REFERENCES "invitations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Add constraint api_keys_userId_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'api_keys_userId_fkey'
    ) THEN
        ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Add constraint webhooks_userId_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'webhooks_userId_fkey'
    ) THEN
        ALTER TABLE "webhooks" ADD CONSTRAINT "webhooks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Add constraint webhook_logs_webhookId_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'webhook_logs_webhookId_fkey'
    ) THEN
        ALTER TABLE "webhook_logs" ADD CONSTRAINT "webhook_logs_webhookId_fkey" FOREIGN KEY ("webhookId") REFERENCES "webhooks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Add constraint notifications_userId_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'notifications_userId_fkey'
    ) THEN
        ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Add constraint activity_logs_userId_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'activity_logs_userId_fkey'
    ) THEN
        ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Add constraint assistant_conversations_userId_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'assistant_conversations_userId_fkey'
    ) THEN
        ALTER TABLE "assistant_conversations" ADD CONSTRAINT "assistant_conversations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Add constraint assistant_messages_conversationId_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'assistant_messages_conversationId_fkey'
    ) THEN
        ALTER TABLE "assistant_messages" ADD CONSTRAINT "assistant_messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "assistant_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Add constraint assistant_tool_usage_conversationId_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'assistant_tool_usage_conversationId_fkey'
    ) THEN
        ALTER TABLE "assistant_tool_usage" ADD CONSTRAINT "assistant_tool_usage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "assistant_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Add constraint assistant_audit_logs_userId_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'assistant_audit_logs_userId_fkey'
    ) THEN
        ALTER TABLE "assistant_audit_logs" ADD CONSTRAINT "assistant_audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Add constraint scheduled_notifications_userId_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'scheduled_notifications_userId_fkey'
    ) THEN
        ALTER TABLE "scheduled_notifications" ADD CONSTRAINT "scheduled_notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Add constraint scheduled_notification_history_scheduledNotificationId_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'scheduled_notification_history_scheduledNotificationId_fkey'
    ) THEN
        ALTER TABLE "scheduled_notification_history" ADD CONSTRAINT "scheduled_notification_history_scheduledNotificationId_fkey" FOREIGN KEY ("scheduledNotificationId") REFERENCES "scheduled_notifications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Add constraint device_tokens_userId_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'device_tokens_userId_fkey'
    ) THEN
        ALTER TABLE "device_tokens" ADD CONSTRAINT "device_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Add constraint push_notification_logs_userId_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'push_notification_logs_userId_fkey'
    ) THEN
        ALTER TABLE "push_notification_logs" ADD CONSTRAINT "push_notification_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Add constraint push_notification_logs_notificationId_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'push_notification_logs_notificationId_fkey'
    ) THEN
        ALTER TABLE "push_notification_logs" ADD CONSTRAINT "push_notification_logs_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "notifications"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;

    -- Add constraint notification_queue_userId_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'notification_queue_userId_fkey'
    ) THEN
        ALTER TABLE "notification_queue" ADD CONSTRAINT "notification_queue_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Add constraint calls_initiatorId_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'calls_initiatorId_fkey'
    ) THEN
        ALTER TABLE "calls" ADD CONSTRAINT "calls_initiatorId_fkey" FOREIGN KEY ("initiatorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;

    -- Add constraint call_participants_callId_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'call_participants_callId_fkey'
    ) THEN
        ALTER TABLE "call_participants" ADD CONSTRAINT "call_participants_callId_fkey" FOREIGN KEY ("callId") REFERENCES "calls"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Add constraint call_participants_userId_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'call_participants_userId_fkey'
    ) THEN
        ALTER TABLE "call_participants" ADD CONSTRAINT "call_participants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Add constraint custom_emojis_workspaceId_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'custom_emojis_workspaceId_fkey'
    ) THEN
        ALTER TABLE "custom_emojis" ADD CONSTRAINT "custom_emojis_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Add constraint user_badges_workspaceId_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'user_badges_workspaceId_fkey'
    ) THEN
        ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Add constraint user_badge_assignments_badgeId_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'user_badge_assignments_badgeId_fkey'
    ) THEN
        ALTER TABLE "user_badge_assignments" ADD CONSTRAINT "user_badge_assignments_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "user_badges"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Add constraint channel_webhooks_channelId_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'channel_webhooks_channelId_fkey'
    ) THEN
        ALTER TABLE "channel_webhooks" ADD CONSTRAINT "channel_webhooks_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Add constraint channel_webhooks_createdBy_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'channel_webhooks_createdBy_fkey'
    ) THEN
        ALTER TABLE "channel_webhooks" ADD CONSTRAINT "channel_webhooks_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Add constraint channel_webhook_logs_webhookId_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'channel_webhook_logs_webhookId_fkey'
    ) THEN
        ALTER TABLE "channel_webhook_logs" ADD CONSTRAINT "channel_webhook_logs_webhookId_fkey" FOREIGN KEY ("webhookId") REFERENCES "channel_webhooks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Add constraint channel_incoming_webhooks_channelId_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'channel_incoming_webhooks_channelId_fkey'
    ) THEN
        ALTER TABLE "channel_incoming_webhooks" ADD CONSTRAINT "channel_incoming_webhooks_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Add constraint channel_incoming_webhooks_createdBy_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'channel_incoming_webhooks_createdBy_fkey'
    ) THEN
        ALTER TABLE "channel_incoming_webhooks" ADD CONSTRAINT "channel_incoming_webhooks_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Add constraint channel_incoming_webhook_logs_webhookId_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'channel_incoming_webhook_logs_webhookId_fkey'
    ) THEN
        ALTER TABLE "channel_incoming_webhook_logs" ADD CONSTRAINT "channel_incoming_webhook_logs_webhookId_fkey" FOREIGN KEY ("webhookId") REFERENCES "channel_incoming_webhooks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Add constraint friends_userId_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'friends_userId_fkey'
    ) THEN
        ALTER TABLE "friends" ADD CONSTRAINT "friends_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Add constraint friends_friendId_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'friends_friendId_fkey'
    ) THEN
        ALTER TABLE "friends" ADD CONSTRAINT "friends_friendId_fkey" FOREIGN KEY ("friendId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Add constraint oauth_clients_userId_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'oauth_clients_userId_fkey'
    ) THEN
        ALTER TABLE "oauth_clients" ADD CONSTRAINT "oauth_clients_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Add constraint oauth_tokens_clientId_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'oauth_tokens_clientId_fkey'
    ) THEN
        ALTER TABLE "oauth_tokens" ADD CONSTRAINT "oauth_tokens_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "oauth_clients"("clientId") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Add constraint oauth_tokens_userId_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'oauth_tokens_userId_fkey'
    ) THEN
        ALTER TABLE "oauth_tokens" ADD CONSTRAINT "oauth_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Add constraint oauth_refresh_tokens_clientId_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'oauth_refresh_tokens_clientId_fkey'
    ) THEN
        ALTER TABLE "oauth_refresh_tokens" ADD CONSTRAINT "oauth_refresh_tokens_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "oauth_clients"("clientId") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Add constraint oauth_refresh_tokens_userId_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'oauth_refresh_tokens_userId_fkey'
    ) THEN
        ALTER TABLE "oauth_refresh_tokens" ADD CONSTRAINT "oauth_refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Add constraint oauth_refresh_tokens_sessionId_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'oauth_refresh_tokens_sessionId_fkey'
    ) THEN
        ALTER TABLE "oauth_refresh_tokens" ADD CONSTRAINT "oauth_refresh_tokens_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Add constraint oauth_access_tokens_clientId_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'oauth_access_tokens_clientId_fkey'
    ) THEN
        ALTER TABLE "oauth_access_tokens" ADD CONSTRAINT "oauth_access_tokens_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "oauth_clients"("clientId") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Add constraint oauth_access_tokens_userId_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'oauth_access_tokens_userId_fkey'
    ) THEN
        ALTER TABLE "oauth_access_tokens" ADD CONSTRAINT "oauth_access_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Add constraint oauth_access_tokens_sessionId_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'oauth_access_tokens_sessionId_fkey'
    ) THEN
        ALTER TABLE "oauth_access_tokens" ADD CONSTRAINT "oauth_access_tokens_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Add constraint oauth_access_tokens_refreshId_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'oauth_access_tokens_refreshId_fkey'
    ) THEN
        ALTER TABLE "oauth_access_tokens" ADD CONSTRAINT "oauth_access_tokens_refreshId_fkey" FOREIGN KEY ("refreshId") REFERENCES "oauth_refresh_tokens"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Add constraint oauth_consents_userId_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'oauth_consents_userId_fkey'
    ) THEN
        ALTER TABLE "oauth_consents" ADD CONSTRAINT "oauth_consents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Add constraint oauth_consents_clientId_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'oauth_consents_clientId_fkey'
    ) THEN
        ALTER TABLE "oauth_consents" ADD CONSTRAINT "oauth_consents_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "oauth_clients"("clientId") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Add constraint personal_access_tokens_userId_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'personal_access_tokens_userId_fkey'
    ) THEN
        ALTER TABLE "personal_access_tokens" ADD CONSTRAINT "personal_access_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Add constraint friend_requests_senderId_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'friend_requests_senderId_fkey'
    ) THEN
        ALTER TABLE "friend_requests" ADD CONSTRAINT "friend_requests_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Add constraint friend_requests_receiverId_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'friend_requests_receiverId_fkey'
    ) THEN
        ALTER TABLE "friend_requests" ADD CONSTRAINT "friend_requests_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Add constraint shared_channels_channelId_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'shared_channels_channelId_fkey'
    ) THEN
        ALTER TABLE "shared_channels" ADD CONSTRAINT "shared_channels_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Add constraint shared_channels_workspaceId_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'shared_channels_workspaceId_fkey'
    ) THEN
        ALTER TABLE "shared_channels" ADD CONSTRAINT "shared_channels_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Add constraint customer_profiles_userId_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'customer_profiles_userId_fkey'
    ) THEN
        ALTER TABLE "customer_profiles" ADD CONSTRAINT "customer_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Add constraint customer_profiles_workspaceId_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'customer_profiles_workspaceId_fkey'
    ) THEN
        ALTER TABLE "customer_profiles" ADD CONSTRAINT "customer_profiles_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Add constraint support_tickets_workspaceId_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'support_tickets_workspaceId_fkey'
    ) THEN
        ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Add constraint support_tickets_customerId_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'support_tickets_customerId_fkey'
    ) THEN
        ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customer_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Add constraint support_tickets_assigneeId_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'support_tickets_assigneeId_fkey'
    ) THEN
        ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;

    -- Add constraint support_tickets_channelId_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'support_tickets_channelId_fkey'
    ) THEN
        ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "channels"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;

    -- Add constraint live_chat_sessions_workspaceId_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'live_chat_sessions_workspaceId_fkey'
    ) THEN
        ALTER TABLE "live_chat_sessions" ADD CONSTRAINT "live_chat_sessions_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Add constraint live_chat_sessions_customerId_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'live_chat_sessions_customerId_fkey'
    ) THEN
        ALTER TABLE "live_chat_sessions" ADD CONSTRAINT "live_chat_sessions_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customer_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;

    -- Add constraint live_chat_sessions_ticketId_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'live_chat_sessions_ticketId_fkey'
    ) THEN
        ALTER TABLE "live_chat_sessions" ADD CONSTRAINT "live_chat_sessions_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "support_tickets"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;

    -- Add constraint live_chat_sessions_channelId_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'live_chat_sessions_channelId_fkey'
    ) THEN
        ALTER TABLE "live_chat_sessions" ADD CONSTRAINT "live_chat_sessions_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Add constraint members_organizationId_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'members_organizationId_fkey'
    ) THEN
        ALTER TABLE "members" ADD CONSTRAINT "members_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Add constraint members_userId_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'members_userId_fkey'
    ) THEN
        ALTER TABLE "members" ADD CONSTRAINT "members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Add constraint organization_invitations_organizationId_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'organization_invitations_organizationId_fkey'
    ) THEN
        ALTER TABLE "organization_invitations" ADD CONSTRAINT "organization_invitations_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Add constraint organization_invitations_inviterId_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'organization_invitations_inviterId_fkey'
    ) THEN
        ALTER TABLE "organization_invitations" ADD CONSTRAINT "organization_invitations_inviterId_fkey" FOREIGN KEY ("inviterId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Add constraint profile_assets_workspaceId_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'profile_assets_workspaceId_fkey'
    ) THEN
        ALTER TABLE "profile_assets" ADD CONSTRAINT "profile_assets_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Add constraint stickers_workspaceId_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'stickers_workspaceId_fkey'
    ) THEN
        ALTER TABLE "stickers" ADD CONSTRAINT "stickers_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Add constraint soundboard_sounds_workspaceId_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'soundboard_sounds_workspaceId_fkey'
    ) THEN
        ALTER TABLE "soundboard_sounds" ADD CONSTRAINT "soundboard_sounds_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Add constraint bot_applications_ownerId_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'bot_applications_ownerId_fkey'
    ) THEN
        ALTER TABLE "bot_applications" ADD CONSTRAINT "bot_applications_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Add constraint bot_applications_botId_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'bot_applications_botId_fkey'
    ) THEN
        ALTER TABLE "bot_applications" ADD CONSTRAINT "bot_applications_botId_fkey" FOREIGN KEY ("botId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;

    -- Add constraint bot_applications_workspaceId_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'bot_applications_workspaceId_fkey'
    ) THEN
        ALTER TABLE "bot_applications" ADD CONSTRAINT "bot_applications_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;

    -- Add constraint bot_applications_organizationId_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'bot_applications_organizationId_fkey'
    ) THEN
        ALTER TABLE "bot_applications" ADD CONSTRAINT "bot_applications_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Add constraint bot_commands_applicationId_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'bot_commands_applicationId_fkey'
    ) THEN
        ALTER TABLE "bot_commands" ADD CONSTRAINT "bot_commands_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "bot_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Add constraint blocked_users_blockerId_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'blocked_users_blockerId_fkey'
    ) THEN
        ALTER TABLE "blocked_users" ADD CONSTRAINT "blocked_users_blockerId_fkey" FOREIGN KEY ("blockerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Add constraint blocked_users_blockedUserId_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'blocked_users_blockedUserId_fkey'
    ) THEN
        ALTER TABLE "blocked_users" ADD CONSTRAINT "blocked_users_blockedUserId_fkey" FOREIGN KEY ("blockedUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Add constraint system_announcements_adminId_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'system_announcements_adminId_fkey'
    ) THEN
        ALTER TABLE "system_announcements" ADD CONSTRAINT "system_announcements_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;

    -- Add constraint _ThreadMembers_A_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = '_ThreadMembers_A_fkey'
    ) THEN
        ALTER TABLE "_ThreadMembers" ADD CONSTRAINT "_ThreadMembers_A_fkey" FOREIGN KEY ("A") REFERENCES "threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Add constraint _ThreadMembers_B_fkey if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = '_ThreadMembers_B_fkey'
    ) THEN
        ALTER TABLE "_ThreadMembers" ADD CONSTRAINT "_ThreadMembers_B_fkey" FOREIGN KEY ("B") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
