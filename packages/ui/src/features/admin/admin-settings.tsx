"use client"

import * as React from "react"
import { Settings, Globe, Bell, Mail, Database } from 'lucide-react'
import { Card } from "../../ui/card"
import { Label } from "../../ui/label"
import { Input } from "../../ui/input"
import { Button } from "../../ui/button"
import { Switch } from "../../ui/switch"
import { Textarea } from "../../ui/textarea"

export function AdminSettings() {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary" />
          General Settings
        </h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Workspace Name</Label>
            <Input defaultValue="Dealio" />
          </div>
          <div className="space-y-2">
            <Label>Workspace Description</Label>
            <Textarea defaultValue="Enterprise project management and collaboration platform" />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          Notification Settings
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Email Notifications</Label>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <Label>Push Notifications</Label>
            <Switch defaultChecked />
          </div>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button size="lg">Save Changes</Button>
      </div>
    </div>
  )
}
