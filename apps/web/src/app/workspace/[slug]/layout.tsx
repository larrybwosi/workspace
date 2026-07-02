import { Metadata } from 'next';
import WorkspaceLayoutClient from './workspace-layout-client';

export const metadata: Metadata = {
  title: 'Workspace',
  description: 'View and manage your workspace',
};

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return <WorkspaceLayoutClient>{children}</WorkspaceLayoutClient>;
}
