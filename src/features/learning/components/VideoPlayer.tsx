"use client";

import { useEffect, useRef } from "react";
import { VideoOff } from "lucide-react";
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
      <div className="surface-deep relative flex aspect-video w-full flex-col items-center justify-center gap-4 overflow-hidden rounded-2xl px-6 text-center">
        <span
          aria-hidden
          className="grid size-14 place-items-center rounded-2xl bg-white/10 text-gold-200 ring-1 ring-inset ring-white/15"
        >
          <VideoOff className="size-6" strokeWidth={1.75} />
        </span>
        <p className="max-w-sm text-sm leading-relaxed text-white/75 sm:text-[15px]">
          {t("learn.videoUnavailable")}
        </p>
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
      className="block aspect-video w-full rounded-2xl bg-black"
      onTimeUpdate={(e) => {
        const el = e.currentTarget;
        onTimeUpdate?.(el.currentTime, el.duration);
      }}
      onEnded={onEnded}
    />
  );
}
