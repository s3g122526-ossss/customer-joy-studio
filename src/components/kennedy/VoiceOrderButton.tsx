import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Mic, Square, X, Loader2, Volume2, Sparkles, Wand2 } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { voiceOrder } from "@/lib/voice.functions";
import { playUrduVoice } from "@/lib/sfx";


type Turn = { role: "user" | "assistant"; content: string };

export function VoiceOrderButton() {
  const call = useServerFn(voiceOrder);
  const [open, setOpen] = useState(false);
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [turns, setTurns] = useState<Turn[]>([]);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [turns, busy]);

  const send = useCallback(
    async (blob: Blob) => {
      setBusy(true);
      setError(null);
      try {
        const buf = await blob.arrayBuffer();
        const bytes = new Uint8Array(buf);
        let bin = "";
        for (let i = 0; i < bytes.length; i += 0x8000)
          bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
        const res = await call({
          data: { audioBase64: btoa(bin), mime: blob.type || "audio/webm", history: turns },
        });
        setTurns((prev) => [
          ...prev,
          ...(res.transcript ? [{ role: "user" as const, content: res.transcript }] : []),
          { role: "assistant" as const, content: res.text },
        ]);
        if (res.audio) {
          audioRef.current?.pause();
          const audio = new Audio(`data:audio/mpeg;base64,${res.audio}`);
          audioRef.current = audio;
          void audio.play().catch(() => undefined);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Kuch ghalat ho gaya.");
      } finally {
        setBusy(false);
      }
    },
    [call, turns],
  );

  const start = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4";
      const rec = new MediaRecorder(stream, { mimeType: mime });
      chunksRef.current = [];
      rec.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        void send(new Blob(chunksRef.current, { type: mime }));
      };
      recorderRef.current = rec;
      rec.start();
      setRecording(true);
    } catch {
      setError("Microphone ki ijazat dein.");
    }
  }, [send]);

  const stop = useCallback(() => {
    recorderRef.current?.stop();
    recorderRef.current = null;
    setRecording(false);
  }, []);

  /**
   * Plays the pre-loaded Urdu welcome clip (public/audio/urdu-ai.mp3).
   * If the clip isn't bundled yet, the browser speaks the same line in Urdu.
   */
  const greet = useCallback(async () => {
    const played = await playUrduVoice();
    if (played) return;
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const utter = new SpeechSynthesisUtterance(
      "السلام علیکم! کینیڈی مون گرل میں خوش آمدید۔ بتائیے آج کیا آرڈر کریں؟",
    );
    utter.lang = "ur-PK";
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  }, []);


  return (
    <>
      <motion.button
        type="button"
        onClick={() => {
          setOpen(true);
          void greet();
        }}

        initial={{ opacity: 0, y: 24, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 22, delay: 0.8 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.94 }}
        className="magic-voice fixed bottom-5 right-4 z-[150] sm:bottom-8 sm:right-8"
        aria-label="Magic Urdu voice order guide — AI se Urdu mein baat karein"
      >
        <span
          className="magic-voice__spark h-1.5 w-1.5"
          style={{ top: "-4px", left: "18%", animationDelay: "0s" }}
          aria-hidden="true"
        />
        <span
          className="magic-voice__spark h-1 w-1"
          style={{ bottom: "-2px", right: "26%", animationDelay: "0.8s" }}
          aria-hidden="true"
        />
        <span
          className="magic-voice__spark h-1 w-1"
          style={{ top: "30%", right: "-5px", animationDelay: "1.5s" }}
          aria-hidden="true"
        />
        <motion.span
          className="relative flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-gold to-flame"
          animate={{ rotate: [0, -14, 12, 0] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
        >
          <motion.span
            className="absolute inset-0 rounded-full bg-gold/60"
            animate={{ scale: [1, 1.8], opacity: [0.55, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
            aria-hidden="true"
          />
          <Wand2 className="relative h-4 w-4 text-charcoal" aria-hidden="true" />
        </motion.span>
        <span className="flex flex-col items-start leading-none">
          <span className="text-[0.62rem] tracking-[0.22em] text-gold">Magic Guide</span>
          <span className="mt-1">
            <span className="hidden sm:inline">Urdu Voice Order</span>
            <span className="sm:hidden">Urdu Order</span>
          </span>
        </span>
        <motion.span
          animate={{ scale: [1, 1.25, 1], rotate: [0, 18, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        >
          <Sparkles className="h-4 w-4 text-gold" aria-hidden="true" />
        </motion.span>

      </motion.button>


      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] flex items-end justify-center bg-charcoal/60 p-0 backdrop-blur-sm sm:items-center sm:p-6"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ y: 60, opacity: 0, scale: 0.97 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="flex max-h-[88vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-cream shadow-[0_-20px_60px_rgba(0,0,0,0.35)] sm:rounded-3xl"
            >
              <div className="flex items-center justify-between bg-flame px-5 py-4 text-cream">
                <div>
                  <p className="font-display text-lg font-extrabold uppercase">Kennedy Voice AI</p>
                  <p className="font-body text-xs text-cream/85">
                    Urdu mein bolein — menu, mashwara aur order.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Band karein"
                  className="rounded-full bg-cream/20 p-2"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>

              <div ref={scrollRef} className="min-h-[180px] flex-1 space-y-3 overflow-y-auto p-5">
                {turns.length === 0 && !busy && (
                  <p className="rounded-2xl bg-charcoal/5 p-4 text-center font-body text-sm text-charcoal/70">
                    Mic dabayein aur boliye: “Mujhe do spicy white pizza chahiye.”
                  </p>
                )}
                {turns.map((t, i) => (
                  <div
                    key={i}
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 font-body text-sm ${
                      t.role === "user"
                        ? "ml-auto bg-flame text-cream"
                        : "mr-auto bg-charcoal/8 text-charcoal"
                    }`}
                  >
                    {t.content}
                  </div>
                ))}
                {busy && (
                  <div className="mr-auto flex items-center gap-2 rounded-2xl bg-charcoal/8 px-4 py-2.5 font-body text-sm text-charcoal/70">
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Soch raha hoon…
                  </div>
                )}
                {error && (
                  <p className="rounded-2xl bg-flame/10 px-4 py-2.5 font-body text-sm text-flame-dark">
                    {error}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-center gap-3 border-t border-charcoal/10 bg-cream px-5 py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
                <motion.button
                  type="button"
                  disabled={busy}
                  onClick={recording ? stop : start}
                  whileTap={{ scale: 0.94 }}
                  className={`flex h-16 w-16 items-center justify-center rounded-full text-cream shadow-[0_14px_30px_rgba(180,40,20,0.35)] disabled:opacity-50 ${
                    recording ? "bg-charcoal" : "bg-flame"
                  }`}
                  aria-label={recording ? "Recording rokein" : "Bolna shuru karein"}
                >
                  {recording ? (
                    <Square className="h-6 w-6" aria-hidden="true" />
                  ) : (
                    <Mic className="h-7 w-7" aria-hidden="true" />
                  )}
                </motion.button>
                <p className="font-body text-xs text-charcoal/60">
                  {recording ? "Sun raha hoon… rokne ke liye dabayein" : "Bolne ke liye dabayein"}
                </p>
                <Volume2 className="h-4 w-4 text-charcoal/40" aria-hidden="true" />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
