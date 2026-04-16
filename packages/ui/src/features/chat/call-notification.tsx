'use client';
import { useEffect, useState } from 'react';
import { Phone, Video, X } from 'lucide-react';
import { Button } from '../../components/button';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/avatar';
import { motion, AnimatePresence } from 'framer-motion';

interface CallNotificationProps {
  callId: string;
  initiatorName: string;
  initiatorAvatar: string;
  type: 'voice' | 'video';
  onAccept: () => void;
  onDecline: () => void;
}

export function CallNotification({
  callId,
  initiatorName,
  initiatorAvatar,
  type,
  onAccept,
  onDecline,
}: CallNotificationProps) {
  const [isRinging, setIsRinging] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => {
      onDecline();
    }, 30000);
    return () => clearTimeout(timeout);
  }, [onDecline]);

  return (
    <AnimatePresence>
      {isRinging && (
        <motion.div
          initial={{ opacity: 0, y: -8, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.97 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="fixed top-4 right-4 z-50"
        >
          <div className="w-[320px] rounded-sm bg-[#1e1f22] border border-[#2e2f34] shadow-2xl overflow-hidden">
            {/* Top accent bar */}
            <div className="h-[3px] w-full bg-[#5865f2]" />

            <div className="px-4 pt-3.5 pb-4">
              {/* Header row */}
              <div className="flex items-center gap-3 mb-3.5">
                <div className="relative">
                  <Avatar className="h-10 w-10 rounded-sm">
                    <AvatarImage src={initiatorAvatar} alt={initiatorName} />
                    <AvatarFallback className="rounded-sm bg-[#5865f2] text-white text-xs font-semibold">
                      {initiatorName.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {/* Pulsing ring */}
                  <span className="absolute inset-0 rounded-sm ring-2 ring-[#5865f2] animate-ping opacity-30" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-white leading-tight truncate">{initiatorName}</p>
                  <p className="text-[11px] text-[#949ba4] mt-0.5 flex items-center gap-1">
                    {type === 'video' ? <Video className="h-3 w-3" /> : <Phone className="h-3 w-3" />}
                    Incoming {type} call
                  </p>
                </div>

                <button
                  onClick={onDecline}
                  className="h-6 w-6 flex items-center justify-center rounded-sm text-[#949ba4] hover:text-white hover:bg-[#2e2f34] transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2">
                <button
                  onClick={onDecline}
                  className="flex-1 h-8 rounded-sm bg-[#ed4245] hover:bg-[#c03537] text-white text-[12px] font-semibold transition-colors"
                >
                  Decline
                </button>
                <button
                  onClick={onAccept}
                  className="flex-1 h-8 rounded-sm bg-[#23a55a] hover:bg-[#1a7d44] text-white text-[12px] font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  {type === 'video' ? <Video className="h-3.5 w-3.5" /> : <Phone className="h-3.5 w-3.5" />}
                  Accept
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
