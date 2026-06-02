"use client";

import { useEffect, useRef } from "react";
import { useT } from "@/i18n/client";

type Props = {
  src?: string | null;
  initialPositionSec?: number;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onEnded?: () => void;
  poster?: string | null;
};

const isHls = (url: string) => /\.m3u8(\?|$)/i.test(url);

export function VideoPlayer({
  src,
  initialPositionSec = 0,
  onTimeUpdate,
  onEnded,
  poster,
}: Props) {
  const ref = useRef<HTMLVideoElement>(null);
  const t = useT();

  useEffect(() => {
    const v = ref.current;
    if (!v || !src) return;

    let destroy: (() => void) | undefined;
    let cancelled = false;

    const onLoaded = () => {
      if (initialPositionSec > 0 && initialPositionSec < (v.duration || Infinity)) {
        v.currentTime = initialPositionSec;
      }
    };
    v.addEventListener("loadedmetadata", onLoaded);

    if (isHls(src)) {
      if (v.canPlayType("application/vnd.apple.mpegurl")) {
        // Safari / iOS — native HLS
        v.src = src;
      } else {
        import("hls.js").then(({ default: Hls }) => {
          if (cancelled) return;
          if (!Hls.isSupported()) {
            v.src = src;
            return;
          }
          const hls = new Hls({
            enableWorker: true,
            lowLatencyMode: false,
            backBufferLength: 60,
          });
          hls.loadSource(src);
          hls.attachMedia(v);
          destroy = () => hls.destroy();
        });
      }
    } else {
      v.src = src;
    }

    return () => {
      cancelled = true;
      v.removeEventListener("loadedmetadata", onLoaded);
      destroy?.();
    };
  }, [src, initialPositionSec]);

  if (!src) {
    return (
      <div className="flex aspect-video w-full items-center justify-center rounded-xl bg-muted text-sm text-muted-foreground">
        {t("learn.videoUnavailable")}
      </div>
    );
  }

  return (
    <video
      ref={ref}
      controls
      preload="metadata"
      poster={poster ?? undefined}
      playsInline
      className="aspect-video w-full rounded-xl bg-black"
      onTimeUpdate={(e) => {
        const el = e.currentTarget;
        onTimeUpdate?.(el.currentTime, el.duration);
      }}
      onEnded={onEnded}
    />
  );
}
