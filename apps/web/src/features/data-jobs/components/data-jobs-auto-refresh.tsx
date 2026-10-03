"use client";

import { useEffect } from "react";

import { useRouter } from "next/navigation";

import { LoaderCircle } from "lucide-react";

type DataJobsAutoRefreshProps = {
  enabled: boolean;
};

export function DataJobsAutoRefresh({ enabled }: DataJobsAutoRefreshProps) {
  const router = useRouter();

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const timer = window.setInterval(() => {
      router.refresh();
    }, 1_500);

    return () => {
      window.clearInterval(timer);
    };
  }, [enabled, router]);

  if (!enabled) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <LoaderCircle className="size-3.5 animate-spin" />
      Processing jobs…
    </div>
  );
}
