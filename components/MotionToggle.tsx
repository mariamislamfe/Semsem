"use client";

import { useMotionPref } from "./MotionPref";

export function MotionToggle() {
  const { reduced, toggle } = useMotionPref();
  return (
    <button type="button" onClick={toggle} aria-pressed={reduced} className="underline decoration-dotted underline-offset-4 hover:text-amber">
      {reduced ? "شغّل الحركة" : "قلّل الحركة"}
    </button>
  );
}
