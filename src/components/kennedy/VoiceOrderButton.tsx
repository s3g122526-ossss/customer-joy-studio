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
      {/* Small caddy-style launcher: Takii, the voice guide */}
      <motion.button
        type="button"
        onClick={() => {
          setOpen(true);
          void greet();
        }}
        initial={{ opacity: 0, y: 20, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 22, delay: 0.8 }}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-5 right-4 z-[150] flex items-center gap-2 rounded-full border border-gold/40 bg-charcoal/90 py-1.5 pl-1.5 pr-3 shadow-[0_10px_26px_rgba(0,0,0,0.35)] backdrop-blur sm:bottom-8 sm:right-8"
        aria-label="Takii — your voice guide. Urdu mein baat karein"
      >
        <span className="relative flex h-8 w-8 shrink-0 items-center justify-center">
          <motion.span
            className="absolute inset-0 rounded-full bg-gold/40"
            animate={{ scale: [1, 1.6], opacity: [0.5, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
            aria-hidden="true"
          />
          <img
            src={caddyAvatar}
            alt=""
            aria-hidden="true"
            className="relative h-8 w-8 rounded-full border border-gold/70 object-cover"
          />
          <span
            className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border border-charcoal bg-emerald-400"
            aria-hidden="true"
          />
        </span>
        <span className="flex flex-col items-start leading-none">
          <span className="font-display text-xs font-extrabold uppercase tracking-wide text-cream">
            Takii
          </span>
          <span className="mt-0.5 text-[0.6rem] tracking-[0.14em] text-gold">Voice guide</span>
        </span>
        <Mic className="h-3.5 w-3.5 text-gold" aria-hidden="true" />
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
              className="flex max-h-[80vh] w-full max-w-sm flex-col overflow-hidden rounded-t-3xl bg-cream shadow-[0_-20px_60px_rgba(0,0,0,0.35)] sm:rounded-3xl"
            >
              <div className="flex items-center gap-3 bg-charcoal px-4 py-3 text-cream">
                <img
                  src={caddyAvatar}
                  alt="Takii, your voice guide"
                  className="h-9 w-9 rounded-full border border-gold/70 object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-display text-sm font-extrabold uppercase tracking-wide">
                    Takii · Voice guide
                  </p>
                  <p className="font-body text-[0.7rem] text-cream/75">
                    Urdu mein bolein — menu, mashwara aur order.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Band karein"
                  className="rounded-full bg-cream/15 p-1.5"
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
