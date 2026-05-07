import * as React from 'react';
import { Megaphone, Send, History, ExternalLink, Image as ImageIcon, Loader2 } from 'lucide-react';
import { useAnnouncements, useSendAnnouncement } from '@repo/api-client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@repo/ui/components/card';
import { Button } from '@repo/ui/components/button';
import { Input } from '@repo/ui/components/input';
import { Textarea } from '@repo/ui/components/textarea';
import { Label } from '@repo/ui/components/label';
import { ScrollArea } from '@repo/ui/components/scroll-area';
import { TopBar } from '@repo/ui/layout/top-bar';
import { AdminSidebar } from '@repo/ui/layout/admin-sidebar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@repo/ui/components/table';
import { toast } from 'sonner';

export function AdminAnnouncementsPage() {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const { data: announcements, isLoading } = useAnnouncements();
  const sendAnnouncement = useSendAnnouncement();

  const [formData, setFormData] = React.useState({
    title: '',
    content: '',
    linkUrl: '',
    imageUrl: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.content) {
      toast.error('Title and Content are required');
      return;
    }

    try {
      await sendAnnouncement.mutateAsync(formData);
      toast.success('Announcement sent successfully to all users');
      setFormData({
        title: '',
        content: '',
        linkUrl: '',
        imageUrl: '',
      });
    } catch (error) {
      toast.error('Failed to send announcement');
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar
          onMenuClick={() => setSidebarOpen(true)}
          channelName="System Announcements"
          channelDescription="Send system-wide notifications to all users"
        />

        <ScrollArea className="flex-1 p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Megaphone className="h-8 w-8 text-primary" />
                System Announcements
              </h1>
              <p className="text-muted-foreground mt-1">
                Reach everyone in the system with important updates, news, or feature releases.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Send className="h-5 w-5" />
                    New Announcement
                  </CardTitle>
                  <CardDescription>
                    This will be sent to all users in real-time.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        placeholder="e.g., New Feature Released!"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="content">Content</Label>
                      <Textarea
                        id="content"
                        placeholder="Describe the update..."
                        className="min-h-[100px]"
                        value={formData.content}
                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="linkUrl">Link URL (Optional)</Label>
                      <Input
                        id="linkUrl"
                        type="url"
                        placeholder="https://..."
                        value={formData.linkUrl}
                        onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="imageUrl">Image URL (Optional)</Label>
                      <Input
                        id="imageUrl"
                        type="url"
                        placeholder="https://..."
                        value={formData.imageUrl}
                        onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={sendAnnouncement.isPending}
                    >
                      {sendAnnouncement.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Send className="h-4 w-4 mr-2" />
                      )}
                      Send to Everyone
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5" />
                    Announcement History
                  </CardTitle>
                  <CardDescription>
                    Previous announcements sent to all users.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex justify-center p-8">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead>Admin</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {announcements?.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                No announcements sent yet.
                              </TableCell>
                            </TableRow>
                          ) : (
                            announcements?.map((announcement: any) => (
                              <TableRow key={announcement.id}>
                                <TableCell className="font-medium">
                                  <div>
                                    <p>{announcement.title}</p>
                                    <p className="text-xs text-muted-foreground line-clamp-1">
                                      {announcement.content}
                                    </p>
                                  </div>
                                </TableCell>
                                <TableCell>{announcement.admin?.name || 'Unknown'}</TableCell>
                                <TableCell className="whitespace-nowrap">
                                  {new Date(announcement.createdAt).toLocaleDateString()}
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-2">
                                    {announcement.linkUrl && (
                                      <Button variant="ghost" size="icon" asChild>
                                        <a href={announcement.linkUrl} target="_blank" rel="noopener noreferrer">
                                          <ExternalLink className="h-4 w-4" />
                                        </a>
                                      </Button>
                                    )}
                                    {announcement.imageUrl && (
                                      <Button variant="ghost" size="icon" onClick={() => window.open(announcement.imageUrl, '_blank')}>
                                        <ImageIcon className="h-4 w-4" />
                                      </Button>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
