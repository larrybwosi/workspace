import { useEffect, useState, useMemo, Suspense, lazy } from 'react';

const VideoCallContent = lazy(
  () => import('./video-call-content').then(mod => ({ default: mod.VideoCallContent })),
);

interface VideoCallProps {
  callId: string;
  channelName: string;
  type: 'voice' | 'video';
  token: string;
  uid: number;
  appId: string;
  onEnd: () => void;
}

export function VideoCall({ callId, channelName, type, token, uid, appId, onEnd }: VideoCallProps) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
        <div className="text-white">Loading call...</div>
      </div>
    );
  }

  return (
    <Suspense fallback={<div className="fixed inset-0 bg-black z-50 flex items-center justify-center text-white">Loading call content...</div>}>
      <VideoCallContent
        callId={callId}
        channelName={channelName}
        type={type}
        onEnd={onEnd}
        token={token}
        uid={uid}
        appId={appId}
      />
    </Suspense>
  );
}
