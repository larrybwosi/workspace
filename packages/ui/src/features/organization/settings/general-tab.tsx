'use client';

import { useState, useEffect } from 'react';
import { Upload, Building2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../../components/card';
import { Input } from '../../../components/input';
import { Label } from '../../../components/label';
import { Button } from '../../../components/button';
import { toast } from 'sonner';
import { useOrganization, useUpdateOrganization } from '@repo/api-client';

interface GeneralTabProps {
  orgSlug: string;
}

export function GeneralTab({ orgSlug }: GeneralTabProps) {
  const { data: organization } = useOrganization(orgSlug);
  const updateOrganization = useUpdateOrganization(orgSlug);

  const [name, setName] = useState('');
  const [logo, setLogo] = useState('');
  const [banner, setBanner] = useState('');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  useEffect(() => {
    if (organization) {
      setName(organization.name || '');
      setLogo(organization.logo || '');
      setBanner(organization.banner || '');
    }
  }, [organization]);

  const handleSave = async () => {
    try {
      await updateOrganization.mutateAsync({
        name,
        logo,
        banner,
      });
      toast.success('Organization settings saved');
    } catch {
      toast.error('Failed to save settings');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'banner') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const setUploading = type === 'logo' ? setUploadingLogo : setUploadingBanner;
    setUploading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      if (type === 'logo') {
        setLogo(data.url);
      } else {
        setBanner(data.url);
      }
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} uploaded successfully`);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(`Failed to upload ${type}`);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Organization Settings</h2>
        <p className="text-muted-foreground">Manage your organization's profile and branding</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Organization Profile</CardTitle>
          <CardDescription>Update your organization's public information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col gap-6">
            <div className="space-y-2">
              <Label>Organization Banner</Label>
              <div
                className="h-40 w-full rounded-lg bg-muted flex items-center justify-center border-2 border-dashed border-border overflow-hidden relative group cursor-pointer"
                style={banner ? { backgroundImage: `url(${banner})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
              >
                {!banner && <div className="text-muted-foreground flex flex-col items-center gap-2">
                  <Upload className="h-8 w-8" />
                  <span className="text-xs">Upload organization banner</span>
                </div>}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Label className="cursor-pointer bg-background/90 px-4 py-2 rounded-md text-sm font-medium">
                    {uploadingBanner ? 'Uploading...' : banner ? 'Change Banner' : 'Upload Banner'}
                    <Input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={e => handleFileUpload(e, 'banner')}
                      disabled={uploadingBanner}
                    />
                  </Label>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground">Recommended size: 1200x400px</p>
            </div>

            <div className="flex items-center gap-6">
              <div className="relative group">
                <div className="size-24 rounded-2xl bg-primary/10 flex items-center justify-center text-primary overflow-hidden border-2 border-background shadow-xl">
                  {logo ? (
                    <img src={logo} alt="Organization Logo" className="h-full w-full object-cover" />
                  ) : (
                    <Building2 className="size-12" />
                  )}
                </div>
                <Label className="absolute -bottom-2 -right-2 size-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center cursor-pointer shadow-lg hover:scale-110 transition-transform">
                  <Upload className="size-5" />
                  <Input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={e => handleFileUpload(e, 'logo')}
                    disabled={uploadingLogo}
                  />
                </Label>
              </div>
              <div className="flex-1 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Organization Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="My Organization"
                    required
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="bg-muted/30 border-t p-4">
          <Button onClick={handleSave} disabled={updateOrganization.isPending}>
            {updateOrganization.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
