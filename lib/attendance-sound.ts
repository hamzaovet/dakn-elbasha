// Professional Audio & Desktop Notification System for Attendance & Alerts

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioCtx) {
      audioCtx = new AudioCtx();
    }
  }
  return audioCtx;
}

// Auto-unlock audio on user interaction
if (typeof window !== "undefined") {
  const unlock = () => {
    const ctx = getAudioContext();
    if (ctx && ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }
  };
  window.addEventListener("click", unlock, { once: false });
  window.addEventListener("keydown", unlock, { once: false });
  window.addEventListener("touchstart", unlock, { once: false });
}

/**
 * Play a crystal-clear, luxury two-tone chime (Ding-Dong) for staff attendance
 */
export function playAttendanceChime(type: "CHECK_IN" | "CHECK_OUT" = "CHECK_IN") {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;
    
    // Check-in: Rising pleasant harmonic chime (Ding-Dong: G5 -> C6)
    // Check-out: Gentle descending chime (C6 -> G5)
    const notes =
      type === "CHECK_IN"
        ? [
            { freq: 783.99, delay: 0, duration: 0.35, gain: 0.35 },    // G5
            { freq: 1046.5, delay: 0.18, duration: 0.55, gain: 0.4 },  // C6
            { freq: 1318.51, delay: 0.36, duration: 0.7, gain: 0.25 }, // E6
          ]
        : [
            { freq: 1046.5, delay: 0, duration: 0.3, gain: 0.3 },      // C6
            { freq: 783.99, delay: 0.18, duration: 0.5, gain: 0.35 },  // G5
          ];

    notes.forEach(({ freq, delay, duration, gain }) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + delay);

      gainNode.gain.setValueAtTime(0.001, now + delay);
      gainNode.gain.exponentialRampToValueAtTime(gain, now + delay + 0.03);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + delay + duration);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(now + delay);
      osc.stop(now + delay + duration + 0.05);
    });
  } catch (err) {
    console.warn("Audio chime failed:", err);
  }
}

/**
 * Send a native Windows desktop notification if permitted
 */
export function sendDesktopNotification(title: string, body: string) {
  if (typeof window === "undefined" || !("Notification" in window)) return;

  if (Notification.permission === "granted") {
    try {
      new Notification(title, {
        body,
        icon: "/basha.ico",
        badge: "/basha.ico",
        silent: true, // We already play our custom chime
      });
    } catch {}
  } else if (Notification.permission !== "denied") {
    Notification.requestPermission().then((perm) => {
      if (perm === "granted") {
        try {
          new Notification(title, { body, icon: "/basha.ico", silent: true });
        } catch {}
      }
    });
  }
}
