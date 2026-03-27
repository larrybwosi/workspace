import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function ApiDocsPage() {
  return (
    <div className="container mx-auto py-10 px-4 max-w-5xl">
      <div className="space-y-4 mb-10">
        <h1 className="text-4xl font-bold tracking-tight">API Documentation V1</h1>
        <p className="text-xl text-muted-foreground">
          Integrate Dealio's messaging capabilities into your organization's workflow.
        </p>
      </div>

      <Tabs defaultValue="auth" className="space-y-8">
        <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
          <TabsTrigger value="auth">Authentication</TabsTrigger>
          <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="oauth2">OAuth2</TabsTrigger>
          <TabsTrigger value="n8n">n8n Integration</TabsTrigger>
        </TabsList>

        <TabsContent value="auth" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Authentication Methods</CardTitle>
              <CardDescription>
                We support three ways to authenticate your requests. All requests must be made over HTTPS.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">1. Personal Access Tokens (PAT)</h3>
                <p className="text-sm text-muted-foreground">
                  Best for scripts and personal integrations. Generate these in your user settings.
                </p>
                <div className="bg-muted p-3 rounded-md font-mono text-sm">
                  Authorization: Bearer pat_xxxxxxxxxxxxxxxx
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-semibold">2. Workspace API Tokens</h3>
                <p className="text-sm text-muted-foreground">
                  Scoped to a specific workspace. Ideal for workspace-wide bots and integrations.
                </p>
                <div className="bg-muted p-3 rounded-md font-mono text-sm">
                  Authorization: Bearer wst_xxxxxxxxxxxxxxxx
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-semibold">3. OAuth2 Access Tokens</h3>
                <p className="text-sm text-muted-foreground">
                  Recommended for third-party applications. Uses the standard OAuth2 authorization code flow.
                </p>
                <div className="bg-muted p-3 rounded-md font-mono text-sm">
                  Authorization: Bearer [access_token]
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="endpoints" className="space-y-6">
          <div className="grid gap-6">
            {/* Messages API */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Messages</CardTitle>
                  <Badge>POST</Badge>
                </div>
                <CardDescription className="font-mono">/api/v1/messages</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm">Send a message to a specific channel.</p>
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Request Body</h4>
                  <pre className="bg-muted p-3 rounded-md text-xs overflow-auto">
{`{
  "channelId": "clx...",
  "content": "Hello world!",
  "messageType": "standard",
  "actions": [
    {
      "actionId": "approve",
      "label": "Approve",
      "style": "primary"
    }
  ]
}`}
                  </pre>
                </div>
              </CardContent>
            </Card>

            {/* Channels API */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>List Channels</CardTitle>
                  <Badge variant="outline">GET</Badge>
                </div>
                <CardDescription className="font-mono">/api/v1/channels</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm">Returns a list of channels accessible to the token.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Create Channel</CardTitle>
                  <Badge>POST</Badge>
                </div>
                <CardDescription className="font-mono">/api/v1/channels</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-4">Create a new channel in a workspace.</p>
                <pre className="bg-muted p-3 rounded-md text-xs overflow-auto">
{`{
  "name": "new-project",
  "workspaceId": "ws_...",
  "type": "public"
}`}
                </pre>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Outgoing Webhooks</CardTitle>
              <CardDescription>
                Receive real-time notifications when events occur in Dealio.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm">Supported Events:</p>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li><code>message.created</code></li>
                <li><code>message.updated</code></li>
                <li><code>channel.created</code></li>
                <li><code>member.joined</code></li>
              </ul>

              <div className="space-y-2 mt-6">
                <h4 className="text-sm font-semibold">Security</h4>
                <p className="text-sm text-muted-foreground">
                  Each payload is signed with your webhook secret using HMAC-SHA256. The signature is sent in the <code>X-Webhook-Signature</code> header.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="n8n" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>n8n Integration Guide</CardTitle>
              <CardDescription>
                Connect Dealio to n8n to automate your messaging workflows.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">1. Sending Messages via HTTP Request Node</h3>
                <p className="text-sm text-muted-foreground">
                  Use the <strong>HTTP Request</strong> node in n8n to send messages to Dealio channels.
                </p>
                <div className="bg-muted p-4 rounded-md space-y-2">
                  <p className="text-xs font-mono"><strong>Method:</strong> POST</p>
                  <p className="text-xs font-mono"><strong>URL:</strong> https://your-domain.com/api/v1/messages</p>
                  <p className="text-xs font-mono"><strong>Authentication:</strong> Header Auth</p>
                  <p className="text-xs font-mono"><strong>Name:</strong> Authorization</p>
                  <p className="text-xs font-mono"><strong>Value:</strong> Bearer [YOUR_PAT_TOKEN]</p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">2. Using Incoming Webhooks</h3>
                <p className="text-sm text-muted-foreground">
                  For simpler integrations, use an incoming webhook URL. No complex auth headers required in n8n.
                </p>
                <div className="bg-muted p-4 rounded-md space-y-2">
                  <p className="text-xs font-mono"><strong>URL:</strong> https://your-domain.com/api/webhooks/incoming/[TOKEN]</p>
                  <pre className="text-xs overflow-auto">
{`{
  "content": "Alert from n8n: High server load detected!",
  "messageType": "alert"
}`}
                  </pre>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">3. Real-world ERP Example</h3>
                <p className="text-sm text-muted-foreground">
                  Notify a sales channel when a new invoice is created in your ERP.
                </p>
                <pre className="bg-muted p-3 rounded-md text-xs overflow-auto">
{`{
  "content": "💰 New Invoice Created: #INV-2024-001",
  "metadata": {
    "amount": "$5,000",
    "customer": "Acme Corp",
    "link": "https://erp.acme.com/invoices/001"
  }
}`}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="oauth2" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>OAuth2 Implementation</CardTitle>
              <CardDescription> Standard OAuth2 endpoints for application integration.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Authorize</h3>
                <code className="text-xs bg-muted p-1 block rounded">GET /api/auth/oauth2/authorize?client_id=...&redirect_uri=...&response_type=code</code>
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Token Exchange</h3>
                <code className="text-xs bg-muted p-1 block rounded">POST /api/auth/oauth2/token</code>
                <p className="text-xs text-muted-foreground">Supports <code>grant_type=authorization_code</code> and <code>grant_type=refresh_token</code></p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
