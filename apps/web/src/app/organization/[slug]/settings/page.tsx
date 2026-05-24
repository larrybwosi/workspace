import { Metadata } from 'next';
import OrganizationSettingsClient from './client';

export const metadata: Metadata = {
  title: 'Organization Settings | Scrymechat',
  description: 'Manage your organization settings and provisioned workspaces.',
};

export default function OrganizationSettingsPage() {
  return <OrganizationSettingsClient />;
}
