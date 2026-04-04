import { Suspense } from "react";
import WidgetClient from "./client";
import { Skeleton } from "@/components/ui/skeleton";

export default function WidgetPage() {
  return (
    <Suspense fallback={<WidgetSkeleton />}>
      <WidgetClient />
    </Suspense>
  );
}

function WidgetSkeleton() {
  return (
    <div className="flex flex-col h-screen p-4 space-y-4 bg-background">
      <div className="flex items-center space-x-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
      <div className="flex-1 space-y-4 overflow-hidden">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-start space-x-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-[80%]" />
              <Skeleton className="h-4 w-[60%]" />
            </div>
          </div>
        ))}
      </div>
      <Skeleton className="h-20 w-full rounded-lg" />
    </div>
  );
}
