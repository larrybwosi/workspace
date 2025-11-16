# Voice and Video Calling with Agora

This system provides enterprise-grade voice and video calling capabilities using Agora RTC SDK with screen sharing support.

## Features

- **High-Quality Video Calls**: Crystal clear HD video calling with adaptive bitrate
- **Voice-Only Calls**: Lightweight audio-only communication
- **Screen Sharing**: Share your screen with other participants
- **Real-time Controls**: Mute/unmute, enable/disable video, manage participants
- **Call History**: Track all calls with duration and participants
- **Push Notifications**: Receive incoming call alerts across all devices
- **Grid View**: Automatic layout adjustment based on participant count
- **Call Recording**: Optional call recording (requires additional setup)

## Setup

### 1. Agora Account Setup

1. Create an account at [Agora.io](https://www.agora.io)
2. Create a new project in the Agora Console
3. Enable the RTC (Real-Time Communication) service
4. Copy your App ID and generate an App Certificate

### 2. Environment Variables

Add the following to your environment variables:

\`\`\`env
# Agora Configuration
NEXT_PUBLIC_AGORA_APP_ID=your_app_id_here
AGORA_APP_CERTIFICATE=your_app_certificate_here
\`\`\`

### 3. Install Dependencies

The system uses the following packages:

\`\`\`bash
npm install agora-rtc-react agora-token agora-rtc-sdk-ng
\`\`\`

## Usage

### Starting a Call

\`\`\`typescript
// Start a voice call
const startVoiceCall = async (participantIds: string[]) => {
  const response = await fetch('/api/calls', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'voice',
      participantIds
    })
  })
  
  const { call } = await response.json()
  // Navigate to call UI or show call modal
}

// Start a video call
const startVideoCall = async (participantIds: string[]) => {
  const response = await fetch('/api/calls', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'video',
      participantIds
    })
  })
  
  const { call } = await response.json()
  // Navigate to call UI or show call modal
}
\`\`\`

### Handling Incoming Calls

\`\`\`typescript
import { useAbly } from '@/hooks/use-ably'
import { CallNotification } from '@/components/call-notification'

function MyComponent() {
  const [incomingCall, setIncomingCall] = useState(null)

  useAbly('user-notifications', (message) => {
    if (message.name === 'call-incoming') {
      setIncomingCall(message.data)
    }
  })

  const acceptCall = () => {
    // Join call
    router.push(`/call/${incomingCall.callId}`)
  }

  const declineCall = async () => {
    await fetch(`/api/calls/${incomingCall.callId}`, {
      method: 'PATCH',
      body: JSON.stringify({ action: 'decline' })
    })
    setIncomingCall(null)
  }

  return incomingCall ? (
    <CallNotification
      callId={incomingCall.callId}
      initiatorName={incomingCall.initiatorName}
      type={incomingCall.type}
      onAccept={acceptCall}
      onDecline={declineCall}
    />
  ) : null
}
\`\`\`

## API Routes

### POST /api/calls

Create a new call

**Request Body:**
\`\`\`json
{
  "type": "voice" | "video",
  "participantIds": ["user1", "user2"]
}
\`\`\`

**Response:**
\`\`\`json
{
  "call": {
    "id": "call_123",
    "channelName": "call-1234567890-abc123",
    "type": "video",
    "status": "pending",
    "participants": [...]
  }
}
\`\`\`

### POST /api/agora/token

Generate Agora RTC token

**Request Body:**
\`\`\`json
{
  "channelName": "call-1234567890-abc123",
  "uid": 0,
  "role": "publisher"
}
\`\`\`

**Response:**
\`\`\`json
{
  "token": "generated_token",
  "appId": "your_app_id",
  "channelName": "call-1234567890-abc123",
  "uid": 12345,
  "expiresAt": "2024-01-15T10:30:00Z"
}
\`\`\`

### PATCH /api/calls/:callId

Update call status or participant state

**Request Body:**
\`\`\`json
{
  "action": "join" | "leave" | "updateState",
  "muted": false,
  "videoOff": false
}
\`\`\`

## Components

### VideoCall

Main video call component with full UI

\`\`\`tsx
import { VideoCall } from '@/components/video-call'

<VideoCall
  callId="call_123"
  channelName="call-1234567890-abc123"
  type="video"
  onEnd={() => router.push('/chat')}
/>
\`\`\`

### CallNotification

Incoming call notification popup

\`\`\`tsx
import { CallNotification } from '@/components/call-notification'

<CallNotification
  callId="call_123"
  initiatorName="John Doe"
  initiatorAvatar="/avatar.jpg"
  type="video"
  onAccept={handleAccept}
  onDecline={handleDecline}
/>
\`\`\`

## Features in Detail

### Screen Sharing

Click the screen share button during a call to share your screen. Participants will see your screen in their video grid.

### Call History

All calls are automatically logged with:
- Participants
- Duration
- Start/end times
- Call type

Access call history via:
\`\`\`typescript
const { calls } = await fetch('/api/calls?status=ended').then(r => r.json())
\`\`\`

### Quality Settings

Agora automatically adjusts video quality based on network conditions. Advanced settings can be configured in the Agora Console.

## Troubleshooting

### Camera/Microphone Not Working

- Ensure browser permissions are granted
- Check device privacy settings
- Try a different browser
- Verify HTTPS is being used

### No Video/Audio

- Check Agora App ID and Certificate
- Verify token generation is working
- Ensure network allows UDP/TCP connections
- Check firewall settings

### Poor Quality

- Test network speed
- Reduce video resolution in settings
- Close other bandwidth-intensive applications
- Consider using voice-only mode

## Security

- All tokens expire after 1 hour by default
- Tokens are generated server-side only
- App Certificate is never exposed to clients
- All API endpoints require authentication
- Call records include audit trails

## Best Practices

1. **Always request permissions** before starting a call
2. **Show loading states** while connecting
3. **Handle network disconnections** gracefully
4. **Provide visual feedback** for muted/video-off states
5. **Clean up resources** when calls end
6. **Test on multiple devices** and browsers
7. **Monitor call quality** metrics

## Advanced Configuration

For advanced features like call recording, live streaming, or AI noise suppression, refer to the [Agora Documentation](https://docs.agora.io).
