'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@repo/shared';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Building2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function NewOrganizationPage() {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await authClient.organization.create({
        name,
        slug,
      });

      if (error) {
        toast.error(error.message || 'Failed to create organization');
      } else {
        toast.success('Organization created successfully');
        router.push(`/organization/${data.slug}/settings`);
      }
    } catch (err) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setName(value);
    // Simple slugify
    setSlug(value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-muted/30">
      <div className="w-full max-w-md space-y-4">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </Button>

        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto size-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
              <Building2 className="size-6" />
            </div>
            <CardTitle className="text-2xl">Create Organization</CardTitle>
            <CardDescription>
              Organizations allow you to manage multiple workspaces and programmatic access.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Organization Name</Label>
                <Input
                  id="name"
                  placeholder="Acme Corp"
                  value={name}
                  onChange={handleNameChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Organization Slug</Label>
                <div className="flex items-center">
                  <span className="bg-muted px-3 py-2 border border-r-0 rounded-l-md text-sm text-muted-foreground">
                    org/
                  </span>
                  <Input
                    id="slug"
                    className="rounded-l-none"
                    placeholder="acme-corp"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    required
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Creating...' : 'Create Organization'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
