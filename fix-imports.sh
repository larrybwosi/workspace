#!/bin/bash

# Define the target files: all .ts, .tsx, .js, .jsx files in app, components, hooks, lib
# We exclude node_modules and .next
FILES=$(find app components hooks lib -type f \( -name "*.tsx" -o -name "*.ts" -o -name "*.js" -o -name "*.jsx" \))

echo "🔎 Scanning and updating imports in $(echo "$FILES" | wc -l) files..."

# Function to update imports
# Usage: move_import "pattern_to_match" "new_subdirectory"
# Example: move_import "admin-.*" "features/admin"
move_import() {
    local pattern=$1
    local destination=$2

    # Explanation of the sed command:
    # s| ... | ... |g  -> Substitute command
    # from ['"]        -> Matches 'from "' or 'from ''
    # .*\/components\/ -> Matches anything ending in /components/ (handles @/components/ or ../components/)
    # ($pattern)       -> Matches the filename prefix we are looking for
    # ['"]             -> Matches the closing quote
    #
    # We replace it by injecting the new destination folder before the filename.

    # We use perl instead of sed here because it handles "lookarounds" and non-greedy matching much better on Linux
    # allowing us to be safer about only changing Import statements.
    
    perl -pi -e "s|(from ['\"].*\/components\/)($pattern)|test(\$2) ? \"\$1$destination/\$2\" : \"\$&\"|ge" $FILES
    
    # Simple check to see if we are matching exact filenames not covered by wildcards
    # The Perl logic: Capture the path up to components/, capture the file, insert destination in middle.
}

echo "🛠  Fixing ADMIN imports..."
move_import "admin-.*" "features/admin"
move_import "api-keys-panel" "features/admin"
move_import "webhooks-panel" "features/admin"
move_import "integration-stats" "features/admin"

echo "🛠  Fixing CALENDAR imports..."
move_import "calendar-.*" "features/calendar"
move_import "event-.*" "features/calendar"

echo "🛠  Fixing CHAT imports..."
move_import "message-.*" "features/chat"
move_import "thread-view" "features/chat"
move_import "mention-.*" "features/chat"
move_import "reaction-.*" "features/chat"
move_import "direct-message.*" "features/chat"
move_import "call-notification" "features/chat"
move_import "video-call.*" "features/chat"
move_import "message-types" "features/chat"

echo "🛠  Fixing PROJECT imports..."
move_import "project-.*" "features/projects"
move_import "sprint-.*" "features/projects"
move_import "kanban-.*" "features/projects"
move_import "gantt-.*" "features/projects"

echo "🛠  Fixing TASK imports..."
move_import "task-.*" "features/tasks"
move_import "day-tasks-.*" "features/tasks"
move_import "work-breakdown-.*" "features/tasks"

echo "🛠  Fixing WORKSPACE imports..."
move_import "workspace-.*" "features/workspace"
move_import "create-channel-.*" "features/workspace"
move_import "create-workspace-.*" "features/workspace"
move_import "members-panel" "features/workspace"
move_import "member-selector" "features/workspace"
move_import "invite-.*" "features/workspace"
# Handle the workspace folder merge
move_import "workspace\/" "features/workspace"

echo "🛠  Fixing ASSISTANT imports..."
move_import "assistant-.*" "features/assistant"
move_import "custom-fields-manager" "features/assistant"

echo "🛠  Fixing SOCIAL imports..."
move_import "user-profile-.*" "features/social"
move_import "user-badge-.*" "features/social"

echo "🛠  Fixing LAYOUT imports..."
move_import "sidebar" "layout"
move_import "top-bar" "layout"
move_import "dynamic-header" "layout"
move_import "theme-.*" "layout"
move_import "search-view" "layout"

echo "🛠  Fixing SHARED imports..."
move_import "emoji-picker" "shared"
move_import "custom-emoji-picker" "shared"
move_import "icon-picker" "shared"
move_import "file-upload" "shared"
move_import "rich-text-editor" "shared"
move_import "markdown-renderer" "shared"
move_import "syntax-highlighter" "shared"
move_import "context-menu" "shared"
move_import "info-panel" "shared"
move_import "user-mention-selector" "shared"
move_import "watcher-.*" "shared"

echo "--------------------------------------------------------"
echo "✅ Imports update process finished."
echo "👉 Please check 'git diff' to verify the changes look correct."
echo "👉 You may still need to manually fix relative imports inside the components themselves."
echo "--------------------------------------------------------"

