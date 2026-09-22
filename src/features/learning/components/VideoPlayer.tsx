"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { VideoOff } from "lucide-react";
import { useT } from "@/i18n/client";

type Props = {
  src?: string | null;
  initialPositionSec?: number;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onEnded?: () => void;
  poster?: string | null;
  /**
   * What the stage shows when the lesson has no video. The player draws the
   * course's own poster art here; without it, a plain night frame and the
   * standard message.
   */
  fallback?: ReactNode;
};

const isHls = (url: string) => /\.m3u8(\?|$)/i.test(url);

export function VideoPlayer({
  src,
  initialPositionSec = 0,
  onTimeUpdate,
  onEnded,
  poster,
  fallback,
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
    if (fallback) return <>{fallback}</>;
    // The stage is a dark screen in both editions, so its colours are fixed
    // rather than theme tokens: the back-cover black, a step below the night
    // paper (#0b1320), with a faint ring, so it keeps an edge in the dark
    // edition instead of melting into the page.
    return (
      <div className="relative flex aspect-video w-full flex-col items-center justify-center gap-4 overflow-hidden bg-[#060b14] px-6 text-center shadow-[inset_0_0_0_1px_rgb(238_232_220/0.1)]">
        <span
          aria-hidden="true"
          className="grid size-14 place-items-center rounded-full text-[#d6bb6a] shadow-[inset_0_0_0_1px_rgb(200_169_81/0.55)]"
        >
          <VideoOff className="size-6" strokeWidth={1.75} />
        </span>
        <p className="max-w-sm text-[15px] leading-relaxed text-[#eee8dc]">{t("learn.videoUnavailable")}</p>
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
      className="block aspect-video w-full bg-black"
      onTimeUpdate={(e) => {
        const el = e.currentTarget;
        onTimeUpdate?.(el.currentTime, el.duration);
      }}
      onEnded={onEnded}
    />
  );
}
