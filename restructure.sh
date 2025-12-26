#!/bin/bash

# 1. Create the new directory structure
echo "📂 Creating new folder structure..."
mkdir -p components/features/admin
mkdir -p components/features/calendar
mkdir -p components/features/chat
mkdir -p components/features/projects
mkdir -p components/features/tasks
mkdir -p components/features/workspace
mkdir -p components/features/assistant
mkdir -p components/features/social
mkdir -p components/layout
mkdir -p components/shared

# 2. Move ADMIN related components
echo "🚚 Moving Admin components..."
mv components/admin-*.tsx components/features/admin/ 2>/dev/null
mv components/api-keys-panel.tsx components/features/admin/ 2>/dev/null
mv components/webhooks-*.tsx components/features/admin/ 2>/dev/null
mv components/webhook-*.tsx components/features/admin/ 2>/dev/null
mv components/integration-stats.tsx components/features/admin/ 2>/dev/null

# 3. Move CALENDAR related components
echo "🚚 Moving Calendar components..."
mv components/calendar-*.tsx components/features/calendar/ 2>/dev/null
mv components/event-*.tsx components/features/calendar/ 2>/dev/null

# 4. Move CHAT / MESSAGING related components
echo "🚚 Moving Chat components..."
mv components/message-*.tsx components/features/chat/ 2>/dev/null
mv components/thread-view.tsx components/features/chat/ 2>/dev/null
mv components/mention-*.tsx components/features/chat/ 2>/dev/null
mv components/reaction-*.tsx components/features/chat/ 2>/dev/null
mv components/direct-message*.tsx components/features/chat/ 2>/dev/null
mv components/call-notification.tsx components/features/chat/ 2>/dev/null
mv components/video-call*.tsx components/features/chat/ 2>/dev/null
# Move the existing message-types folder
if [ -d "components/message-types" ]; then
    mv components/message-types components/features/chat/
fi

# 5. Move PROJECTS components
echo "🚚 Moving Project components..."
mv components/project-*.tsx components/features/projects/ 2>/dev/null
mv components/sprint-*.tsx components/features/projects/ 2>/dev/null
mv components/kanban-*.tsx components/features/projects/ 2>/dev/null
mv components/gantt-*.tsx components/features/projects/ 2>/dev/null

# 6. Move TASKS components
echo "🚚 Moving Task components..."
mv components/task-*.tsx components/features/tasks/ 2>/dev/null
mv components/day-tasks-*.tsx components/features/tasks/ 2>/dev/null
mv components/work-breakdown-*.tsx components/features/tasks/ 2>/dev/null

# 7. Move WORKSPACE components
echo "🚚 Moving Workspace components..."
mv components/create-channel-*.tsx components/features/workspace/ 2>/dev/null
mv components/create-workspace-*.tsx components/features/workspace/ 2>/dev/null
mv components/invite-*.tsx components/features/workspace/ 2>/dev/null
mv components/members-panel.tsx components/features/workspace/ 2>/dev/null
mv components/member-selector.tsx components/features/workspace/ 2>/dev/null
mv components/workspace-*.tsx components/features/workspace/ 2>/dev/null
# Move the existing workspace folder (handling the merge carefully)
if [ -d "components/workspace" ]; then
    mv components/workspace/* components/features/workspace/
    rmdir components/workspace
fi

# 8. Move ASSISTANT / AI components
echo "🚚 Moving Assistant components..."
mv components/assistant-*.tsx components/features/assistant/ 2>/dev/null
mv components/custom-fields-manager.tsx components/features/assistant/ 2>/dev/null

# 9. Move SOCIAL / FRIENDS components
echo "🚚 Moving Social components..."
mv components/user-profile-*.tsx components/features/social/ 2>/dev/null
mv components/user-badge-*.tsx components/features/social/ 2>/dev/null

# 10. Move LAYOUT components
echo "🚚 Moving Layout components..."
mv components/sidebar.tsx components/layout/ 2>/dev/null
mv components/top-bar.tsx components/layout/ 2>/dev/null
mv components/dynamic-header.tsx components/layout/ 2>/dev/null
mv components/theme-*.tsx components/layout/ 2>/dev/null
mv components/search-view.tsx components/layout/ 2>/dev/null

# 11. Move SHARED / UTILITY components (The leftovers)
echo "🚚 Moving Shared components..."
mv components/emoji-picker.tsx components/shared/ 2>/dev/null
mv components/custom-emoji-picker.tsx components/shared/ 2>/dev/null
mv components/icon-picker.tsx components/shared/ 2>/dev/null
mv components/file-upload.tsx components/shared/ 2>/dev/null
mv components/rich-text-editor.tsx components/shared/ 2>/dev/null
mv components/markdown-renderer.tsx components/shared/ 2>/dev/null
mv components/syntax-highlighter.tsx components/shared/ 2>/dev/null
mv components/context-menu.tsx components/shared/ 2>/dev/null
mv components/info-panel.tsx components/shared/ 2>/dev/null
mv components/user-mention-selector.tsx components/shared/ 2>/dev/null
mv components/watcher-*.tsx components/shared/ 2>/dev/null

echo "--------------------------------------------------------"
echo "✅ Restructure complete!"
echo "⚠️  ACTION REQUIRED: You must now update imports in your files."
echo "   (Example: import { Sidebar } from './sidebar' -> './layout/sidebar')"
echo "--------------------------------------------------------"
