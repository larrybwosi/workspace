"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function DeveloperPortal() {
  const [apps, setApps] = useState<any[]>([]);
  const [name, setName] = useState("");

  useEffect(() => {
    fetch("/api/developer/applications")
      .then(res => res.json())
      .then(data => setApps(data));
  }, []);

  const createApp = async () => {
    const res = await fetch("/api/developer/applications", {
      method: "POST",
      body: JSON.stringify({ name }),
    });
    const newApp = await res.json();
    setApps([...apps, newApp]);
    setName("");
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Developer Portal</h1>

      <div className="mb-12">
        <h2 className="text-xl font-semibold mb-4">Create New Application</h2>
        <div className="flex gap-4">
          <Input
            placeholder="Application Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Button onClick={createApp}>Create</Button>
        </div>
      </div>

      <div className="grid gap-6">
        <h2 className="text-xl font-semibold">Your Applications</h2>
        {apps.map(app => (
          <Card key={app.id}>
            <CardHeader>
              <CardTitle>{app.name}</CardTitle>
              <CardDescription>ID: {app.id} | Client ID: {app.clientId}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <span>Bot User: {app.bot?.name || "No bot created"}</span>
                {!app.bot && (
                   <Button variant="secondary" onClick={async () => {
                     const res = await fetch(`/api/developer/applications/${app.id}/bot`, { method: "POST" });
                     const data = await res.json();
                     // Reload to show bot
                     window.location.reload();
                   }}>Create Bot</Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
