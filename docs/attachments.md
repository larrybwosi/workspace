# File Attachments System

## Overview

The file attachment system allows users to upload and share files in messages, notes, and projects. Files are stored in Sanity CMS and can be managed through the application.

## Features

- **Multi-file Upload**: Upload multiple files simultaneously
- **File Type Support**: Images, videos, documents, archives, and more
- **Size Limits**: Maximum 50MB per file
- **Progress Tracking**: Real-time upload progress
- **File Management**: View, download, and delete uploaded files
- **Security**: Authentication required for all upload operations

## Usage

### In Messages

1. Click the paperclip icon in the message composer
2. Select files to upload or drag and drop
3. Review selected files and click "Upload All"
4. Files are attached to the message when you send it

### In Projects

Files can be attached to:
- Task descriptions and comments
- Project documentation
- Sprint reviews
- Milestone deliverables

### In Notes

Attach files to notes for:
- Reference materials
- Meeting recordings
- Design mockups
- Technical specifications

## API Reference

### Upload Endpoint

**POST** `/api/upload`

Upload a file to Sanity CMS.

**Headers:**
- `Content-Type: multipart/form-data`
- Authentication required (session cookie)

**Request Body:**
\`\`\`
FormData with:
- file: File (required)
\`\`\`

**Response:**
\`\`\`json
{
  "id": "string",
  "url": "string",
  "name": "string",
  "type": "string",
  "size": number,
  "assetId": "string",
  "metadata": {
    "dimensions": { "width": number, "height": number },
    "duration": number
  }
}
\`\`\`

### Delete Endpoint

**DELETE** `/api/upload?assetId={assetId}`

Delete a file from Sanity CMS.

**Query Parameters:**
- `assetId`: string (required) - The Sanity asset ID

**Response:**
\`\`\`json
{
  "success": true,
  "message": "Asset deleted successfully"
}
\`\`\`

## Environment Variables

Add these to your `.env.local`:

\`\`\`env
NEXT_PUBLIC_SANITY_PROJECT_ID=your_project_id
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_WRITE_TOKEN=your_write_token
\`\`\`

## File Type Icons

The system automatically assigns icons based on file type:
- 🖼️ Images
- 🎥 Videos
- 🎵 Audio
- 📄 PDFs
- 📝 Documents
- 📊 Spreadsheets
- 📽️ Presentations
- 🗜️ Archives
- 📎 Other files

## Best Practices

1. **Optimize Images**: Compress images before uploading to reduce file size
2. **Use Descriptive Names**: Name files clearly for easy identification
3. **Clean Up**: Delete unused attachments to save storage
4. **Security**: Never upload sensitive data without encryption
5. **File Types**: Ensure files are in supported formats

## Limitations

- Maximum file size: 50MB per file
- Supported formats: All common file types
- Storage: Subject to Sanity plan limits
- Concurrent uploads: Sequential processing for reliability

## Integration with Other Features

### Messages
- Attachments are stored with message metadata
- Real-time synchronization via Ably
- Visible in message threads

### Notes
- Files attached to notes are version-controlled
- Support for linking files across notes
- Preview available for images and PDFs

### Projects
- Task attachments tracked in project analytics
- File history maintained for audit trails
- Access control based on project permissions
