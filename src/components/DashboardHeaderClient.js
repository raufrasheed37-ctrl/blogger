"use client";

import { useEffect, useState } from "react";

function AvatarMark({ initial = "D" }) {
  return (
    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-linear-to-br from-orange-400 via-amber-500 to-rose-500 p-0.5 shadow-[0_18px_60px_rgba(255,106,0,0.25)]">
      <div className="flex h-full w-full items-center justify-center rounded-full border border-white/10 bg-[#12161d] text-xl font-semibold text-white">
        {initial}
      </div>
    </div>
  );
}

export default function DashboardHeaderClient({ displayName, username, initial, subscribersCount = null, children }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  if (!mounted) return null;

  return (
    <>
      <section className="w-full rounded-4xl border border-white/8 bg-white/3 px-5 py-6 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:px-8 sm:py-8">
        <div className="flex flex-col items-center gap-5 text-center">
          <AvatarMark initial={initial} />

          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/4 px-3 py-1 text-xs font-medium text-white/80">
              {displayName}
            </div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{displayName}</h1>
            <p className="text-sm text-white/60">{username}</p>
            <p className="text-sm text-white/70">
              {subscribersCount === null ? "Loading subscribers..." : `${subscribersCount} subscribers`}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">{children}</div>
        </div>
      </section>
    </>
  );
}

