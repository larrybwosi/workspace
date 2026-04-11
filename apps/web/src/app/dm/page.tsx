'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDMConversations } from '@repo/api-client';
import { Loader2 } from 'lucide-react';

export default function DMsPage() {
  const router = useRouter();
  const { data: dmConversations, isLoading } = useDMConversations();

  useEffect(() => {
    if (!isLoading) {
      if (dmConversations && dmConversations.length > 0) {
        const firstDM = dmConversations[0];
        const otherUser = firstDM.members.find((m: any) => m.id !== firstDM.creatorId) ?? firstDM.members[0];
        router.replace(`/dm/${otherUser.id}`);
      } else {
        router.replace('/');
      }
    }
  }, [dmConversations, isLoading, router]);

  return (
    <div className="h-screen flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
