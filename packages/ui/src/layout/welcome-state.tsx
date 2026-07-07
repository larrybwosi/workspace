'use client';

import { Card, CardContent } from '../components/card';
import { MessageSquare, Users, Sparkles } from 'lucide-react';

export function WelcomeState() {
  return (
    <div className="relative flex-1 flex flex-col items-center justify-center p-8 bg-background/50 backdrop-blur-sm overflow-hidden">
      {/* Ambient glow */}
      <div aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-[420px] w-[420px] rounded-full bg-primary/10 blur-3xl" />
      </div>

      <div className="relative max-w-md w-full space-y-10 text-center animate-in fade-in-0 slide-in-from-bottom-2 duration-500">
        {/* Header */}
        <div className="space-y-4">
          <div className="relative inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/15 shadow-sm">
            <Sparkles className="h-7 w-7" strokeWidth={1.75} />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">Welcome back</h1>
            <p className="text-muted-foreground text-base leading-relaxed max-w-sm mx-auto">
              Select a conversation to start messaging, or explore your workspaces below.
            </p>
          </div>
        </div>

        {/* Options */}
        <div className="grid gap-3">
          <Card className="group rounded-xl border border-border/60 bg-card/50 shadow-none transition-all duration-200 hover:border-blue-500/40 hover:bg-purple-500/3 hover:shadow-sm">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0 ring-1 ring-blue-500/10 transition-transform duration-200 group-hover:scale-105">
                <MessageSquare className="h-5 w-5" strokeWidth={1.75} />
              </div>
              <div className="text-left">
                <p className="font-medium text-foreground">Direct messages</p>
                <p className="text-sm text-muted-foreground">Chat one-on-one with friends and colleagues.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="group rounded-xl border border-border/60 bg-card/50 shadow-none transition-all duration-200 hover:border-purple-500/40 hover:bg-purple-500/3 hover:shadow-sm">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="h-10 w-10 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0 ring-1 ring-purple-500/10 transition-transform duration-200 group-hover:scale-105">
                <Users className="h-5 w-5" strokeWidth={1.75} />
              </div>
              <div className="text-left">
                <p className="font-medium text-foreground">Workspaces</p>
                <p className="text-sm text-muted-foreground">Collaborate with your team in dedicated channels.</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer hint */}
        <p className="text-xs text-muted-foreground/80">Use the sidebar to navigate between your DMs and workspaces.</p>
      </div>
    </div>
  );
}
