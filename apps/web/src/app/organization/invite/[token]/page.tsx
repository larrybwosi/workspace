import { Metadata } from 'next';
import OrgInviteClient from './invite-client';

export const metadata: Metadata = {
  title: 'Organization Invitation | Scrymechat',
  description: 'Join an organization on Scrymechat',
};

export default function OrganizationInvitePage() {
  return <OrgInviteClient />;
}
