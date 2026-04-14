'use client';

import { useEffect, useState, useMemo, lazy, Suspense } from 'react';

const VideoCallContent = lazy(
  () => import('./video-call-content').then(mod => ({ default: mod.VideoCallContent }))
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

export function VideoCall(props: VideoCallProps) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VideoCallContent {...props} />
    </Suspense>
  );
}
