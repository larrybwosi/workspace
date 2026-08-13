# Recipe: Handling File Uploads

Scrymechat API supports uploading files to channels and direct messages. Files can be sent as standalone messages or as part of a text message.

## Overview

File uploads are handled using `multipart/form-data`. You can upload a file while sending a message by including a `file` field in your request.

---

## Uploading a File with a Message

To send a message with an attachment, use the `POST /v3/workspaces/:slug/messages` endpoint with `multipart/form-data`.

### Node.js Example (using the `@scryme/chat` SDK)

```typescript
import { ScrymeSDK } from '@scryme/chat';
import FormData from 'form-data';
import fs from 'fs';

const sdk = new ScrymeSDK({
  baseURL: 'https://api.chat.scryme.tech',
  clientId: 'YOUR_CLIENT_ID',
  clientSecret: 'YOUR_CLIENT_SECRET',
});

async function uploadFile(channelId: string, filePath: string) {
  const form = new FormData();
  form.append('content', 'Here is the file you requested!');
  form.append('file', fs.createReadStream(filePath));

  // The SDK automatically handles authentication headers and base URL.
  // We simply pass the form along with its calculated headers.
  const message = await sdk.channel.message.create(channelId, form as any, {
    headers: {
      ...form.getHeaders(),
    },
  });

  return message;
}
```

### Python Example (using `requests`)

```python
import requests

def upload_file(workspace_slug, channel_id, file_path):
    url = f"https://api.chat.scryme.tech/v3/workspaces/{workspace_slug}/messages"
    headers = {"Authorization": f"Bearer {YOUR_ACCESS_TOKEN}"}

    files = {
        "file": open(file_path, "rb")
    }
    data = {
        "channelId": channel_id,
        "content": "Check out this document."
    }

    response = requests.post(url, headers=headers, data=data, files=files)
    return response.json()
```

---

## Supported File Types & Limits

- **Maximum File Size**: 50MB per file.
- **Allowed Types**: Most common file types are supported, including images (PNG, JPG, GIF), documents (PDF, DOCX, XLSX), and archives (ZIP).
- **Multiple Attachments**: Currently, the `file` field supports a single file per request. To attach multiple files, you can send them as an array of objects in the `attachments` field if they are already hosted online.

---

## Attachments Schema

When you receive a message with a file via a Webhook or the API, the `attachments` field will contain an array of objects:

```json
{
  "attachments": [
    {
      "name": "report.pdf",
      "type": "application/pdf",
      "url": "https://storage.chat.scryme.tech/assets/...",
      "size": "102456"
    }
  ]
}
```

## Updating Channel Icons

You can also use file uploads to update a channel's icon.

**Endpoint:** `POST /v3/workspaces/:slug/channels/:channelId/icon`

```bash
curl -X POST https://api.chat.scryme.tech/v3/workspaces/my-workspace/channels/chan_123/icon \
  -H "Authorization: Bearer <token>" \
  -F "file=@/path/to/icon.png"
```
