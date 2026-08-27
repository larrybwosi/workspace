# Custom Message Schema & UI Customization

The Custom Message system enables developers integrating with Scryme Chat to define structured, type-safe custom messages that render dynamically in the UI. developers can customize UI layouts, input validation, themes, icons, and custom node renderers.

## Predefined Custom Message Schemas

The SDK (`@scryme/chat`) and shared package (`@repo/shared`) provide schema validation helpers and type builders for common UI message patterns:

- `APPROVAL`: Interactive approval request card with Approve/Reject actions.
- `REPORT`: Data report card with summary text, metrics grid, and action links.
- `FORM`: Interactive form with text, textarea, select, and checkbox inputs.
- `FEEDBACK`: Feedback/survey request card.
- `TASK_CARD`: Task card with status, assignee, due date, and completion action.
- `SURVEY`: Quick multi-field survey form.
- `GENERIC`: Node-based UI configuration.

---

## SDK Usage Examples (`@scryme/chat`)

### 1. Creating an Approval Custom Message

```typescript
import { ScrymeSDK, createApprovalMessage } from '@scryme/chat';

const sdk = new ScrymeSDK({ token: 'YOUR_ACCESS_TOKEN' });

// Create schema payload using helper builder
const approvalSchema = createApprovalMessage({
  title: 'Expense Reimbursement',
  description: 'Requested by Jane Doe for $450.00',
  fields: [
    { label: 'Category', value: 'Travel' },
    { label: 'Amount', value: '$450.00' },
  ],
  callbackId: 'expense-101',
  priority: 'urgent',
  theme: {
    borderColor: '#38bdf8',
  },
});

// Post to channel via SDK
await sdk.channel.message.create('channel_123', {
  content: 'New expense reimbursement approval requested.',
  metadata: approvalSchema,
});
```

### 2. Creating an Interactive Form Custom Message

```typescript
import { ScrymeSDK, createFormMessage } from '@scryme/chat';

const sdk = new ScrymeSDK();

const formSchema = createFormMessage({
  title: 'Customer Feedback Form',
  description: 'Please let us know how we did!',
  submitCallbackId: 'feedback_submit_1',
  fields: [
    {
      id: 'rating',
      label: 'Rating',
      type: 'select',
      required: true,
      options: [
        { label: 'Excellent', value: '5' },
        { label: 'Good', value: '4' },
        { label: 'Average', value: '3' },
      ],
    },
    {
      id: 'comments',
      label: 'Comments',
      type: 'textarea',
      placeholder: 'Share details about your experience...',
    },
  ],
});

await sdk.channel.message.create('channel_123', {
  content: 'Customer feedback requested',
  metadata: formSchema,
});
```

---

## UI Customization (`@repo/ui`)

The `<CustomMessage />` React component supports extensive customization options for developer integrations:

```tsx
import { CustomMessage } from '@repo/ui';
import { Rocket, Sparkles } from 'lucide-react';

export function ChatFeedMessage({ message }) {
  return (
    <CustomMessage
      message={message}
      onAction={async (actionId, payload) => {
        console.log('Action triggered:', actionId, payload);
      }}
      // Register custom Lucide or React icons mapped by string name
      customIcons={{
        Rocket,
        Sparkles,
      }}
      // Register custom node renderers for custom element types
      customRenderers={{
        'Custom.Chart': ({ node, values, data }) => (
          <div className="p-4 bg-slate-900 text-white rounded-lg">
            Custom Chart Element: {node.properties?.title}
          </div>
        ),
      }}
      className="my-custom-message-container"
    />
  );
}
```

---

## Theme Configuration in Metadata

Custom message metadata can specify theme overrides:

```json
{
  "version": "v1",
  "type": "APPROVAL",
  "context": {
    "title": "Branded Card",
    "priority": "normal"
  },
  "theme": {
    "backgroundColor": "#0f172a",
    "textColor": "#f8fafc",
    "borderColor": "#334155",
    "accentColor": "#38bdf8",
    "className": "custom-card-shadow"
  },
  "root": {
    "type": "Layout.Card",
    "children": []
  }
}
```
