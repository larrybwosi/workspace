'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/dialog';
import { Button } from '../../components/button';
import { Input } from '../../components/input';
import { Textarea } from '../../components/textarea';
import { Label } from '../../components/label';
import { useCreateSupportTicket } from '@repo/api-client';
import { toast } from 'sonner';

interface CreateTicketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
}

export function CreateTicketDialog({ open, onOpenChange, workspaceId }: CreateTicketDialogProps) {
  const [subject, setSubject] = React.useState('');
  const [message, setMessage] = React.useState('');
  const createTicketMutation = useCreateSupportTicket();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) return;

    createTicketMutation.mutate(
      {
        workspaceId,
        subject,
        initialMessage: message,
      },
      {
        onSuccess: () => {
          toast.success('Support ticket created successfully');
          onOpenChange(false);
          setSubject('');
          setMessage('');
        },
        onError: () => {
          toast.error('Failed to create support ticket');
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Support Ticket</DialogTitle>
            <DialogDescription>
              Describe your issue and an agent will get back to you as soon as possible.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                placeholder="What do you need help with?"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                placeholder="Provide more details about your request..."
                value={message}
                onChange={e => setMessage(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createTicketMutation.isPending}>
              {createTicketMutation.isPending ? 'Creating...' : 'Create Ticket'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
