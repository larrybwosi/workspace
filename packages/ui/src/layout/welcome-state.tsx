'use client';

import { Card, CardContent } from "../components/card";
import { MessageSquare, Users, Sparkles } from "lucide-react";

export function WelcomeState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-background/50 backdrop-blur-sm">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="space-y-4">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary/10 text-primary mb-2">
            <Sparkles className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back!</h1>
          <p className="text-muted-foreground text-lg">
            Select a conversation to start messaging or explore your workspaces.
          </p>
        </div>

        <div className="grid gap-4">
          <Card className="rounded-lg border-dashed bg-muted/30">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="h-10 w-10 rounded-md bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div className="text-left">
                <p className="font-medium">Direct Messages</p>
                <p className="text-sm text-muted-foreground">Chat with your friends and colleagues 1-on-1.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-lg border-dashed bg-muted/30">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="h-10 w-10 rounded-md bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0">
                <Users className="h-5 w-5" />
              </div>
              <div className="text-left">
                <p className="font-medium">Workspaces</p>
                <p className="text-sm text-muted-foreground">Collaborate with your teams in dedicated channels.</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <p className="text-xs text-muted-foreground">
          Use the sidebar on the left to navigate between your DMs and workspaces.
        </p>
      </div>
    </div>
  );
}
