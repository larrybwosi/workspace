## Scheduled Notifications

Process scheduled notifications that are due to be sent.

### Endpoint
\`\`\`
POST /api/cron/scheduled-notifications
\`\`\`

### Schedule
Every 5 minutes

### What It Does
- Finds all scheduled notifications that are due
- Sends notifications to users
- Handles recurring notifications (daily, weekly, monthly)
- Logs success/failure for each notification
- Calculates next schedule time for recurring notifications

### Notification Types
- **Once**: Single notification at specific time
- **Daily**: Repeats every N days
- **Weekly**: Repeats on specific days of week
- **Monthly**: Repeats on specific days of month

### Usage via Assistant
Users can create scheduled notifications via the AI assistant:
\`\`\`
"Remind me about the project deadline tomorrow at 9am"
"Create a daily notification at 8am to check my tasks"
"Send me a weekly reminder every Monday at 10am"
\`\`\`
