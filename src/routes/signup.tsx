import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Bike, Crown, Eye, EyeOff, Lock, Mail, Phone, UserRound } from "lucide-react";
import { toast } from "sonner";

import { VoltScene, VoltStrength } from "@/components/auth/chef-volt";
import { EMAIL_RE, pickLine, useChefVolt } from "@/hooks/use-chef-volt";
import { ROLE_COPY, ROLE_HOME, signUpLocal, type AccountRole } from "@/lib/auth";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Create Your Account — Kennedy Moon Grill" },
      {
        name: "description",
        content:
          "Join Kennedy Moon Grill as a customer, staff member or rider — Chef Volt, our dough-guarding robot, sets up your console.",
      },
      { property: "og:title", content: "Create Your Account — Kennedy Moon Grill" },
      {
        property: "og:description",
        content: "Sign up as customer, staff or rider — each role gets its own dashboard.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SignupPage,
});

const ROLES: { key: AccountRole; icon: typeof UserRound }[] = [
  { key: "customer", icon: UserRound },
  { key: "staff", icon: Crown },
  { key: "rider", icon: Bike },
];

function SignupPage() {
  const navigate = useNavigate();
  const volt = useChefVolt("New here? Let's get you a crust card.");
  const [role, setRole] = useState<AccountRole>("customer");
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [showPass, setShowPass] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (volt.done) return;
    if (!form.name.trim()) return volt.complain("I still don't know your name, hungry stranger.");
    if (!form.phone.trim()) return volt.complain("A phone number, please — riders need someone to call.");
    if (!EMAIL_RE.test(form.email.trim())) return volt.complain("That email isn't a real delivery address.");
    if (!form.password) return volt.complain("A password would help. Even a small one.");

    const account = signUpLocal({ ...form, role });
    volt.celebrate(`Account baked, ${account.name.split(" ")[0]}. First slice is on me.`);
    toast.success(`Account ready, ${account.name.split(" ")[0]}`, {
      description: `Taking you to the ${ROLE_COPY[role].destination.toLowerCase()}.`,
    });
    setTimeout(() => navigate({ to: ROLE_HOME[role] }), 950);
  }

  return (
    <VoltScene
      volt={volt}
      eyebrow="Join the grill"
      title="Create account"
      subtitle="Choose your role — customer, staff or rider — and Chef Volt builds the matching dashboard."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-extrabold text-flame hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-5">
        <div>
          <p className="mb-2 font-display text-[10px] font-extrabold tracking-[0.2em] text-charcoal/60 uppercase">
            I'm signing up as
          </p>
          <div className="space-y-2">
            {ROLES.map(({ key, icon: Icon }) => (
              <motion.button
                key={key}
                type="button"
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setRole(key);
                  volt.setMoodSafe("watching");
                  volt.say(`${ROLE_COPY[key].label}. Noted on the box.`);
                }}
                className={cn("role-tile flex w-full items-center gap-3", role === key && "role-tile-active")}
              >
                <span
                  className={cn(
                    "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                    role === key ? "bg-flame/15 text-flame" : "bg-charcoal/8 text-charcoal/50",
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block font-display text-xs font-extrabold tracking-[0.14em] text-charcoal uppercase">
                    {ROLE_COPY[key].label}
                  </span>
                  <span className="block text-[11px] leading-snug text-charcoal/60">{ROLE_COPY[key].tagline}</span>
                </span>
                <span
                  className={cn(
                    "ml-auto h-3.5 w-3.5 shrink-0 rounded-full border-2",
                    role === key ? "border-flame bg-flame" : "border-charcoal/25",
                  )}
                />
              </motion.button>
            ))}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="auth-field-wrap block">
            <UserRound className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-charcoal/40" />
            <input
              value={form.name}
              placeholder="Full name"
              className="auth-field"
              autoComplete="name"
              onFocus={() => {
                volt.setTurned(false);
                volt.setMoodSafe("watching");
                volt.say(pickLine(["A visitor. State your name.", "Typing detected. I'm watching."]));
                volt.follow(form.name);
              }}
              onChange={(e) => {
                setForm((f) => ({ ...f, name: e.target.value }));
                volt.follow(e.target.value);
                const v = e.target.value.trim();
                if (v.length >= 2) volt.say(`${v}. Solid name. Written on the box.`);
                else if (v.length === 0) volt.say("Deleted. Already forgotten. Mostly.");
              }}
            />
          </label>
          <label className="auth-field-wrap block">
            <Phone className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-charcoal/40" />
            <input
              value={form.phone}
              placeholder="03xx xxxxxxx"
              className="auth-field"
              autoComplete="tel"
              onFocus={() => {
                volt.setTurned(false);
                volt.setMoodSafe("watching");
                volt.say("A number for the rider. He knocks twice.");
              }}
              onChange={(e) => {
                setForm((f) => ({ ...f, phone: e.target.value }));
                volt.follow(e.target.value);
              }}
            />
          </label>
        </div>

        <label className="auth-field-wrap block">
          <Mail className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-charcoal/40" />
          <input
            type="email"
            value={form.email}
            placeholder="you@email.com"
            className="auth-field"
            autoComplete="email"
            onFocus={() => {
              volt.setTurned(false);
              volt.setMoodSafe("watching");
              volt.say("Email next. No spam — I only send pizza.");
              volt.follow(form.email);
            }}
            onChange={(e) => {
              setForm((f) => ({ ...f, email: e.target.value }));
              volt.follow(e.target.value);
              if (EMAIL_RE.test(e.target.value.trim())) {
                volt.setMoodSafe("happy");
                volt.say(pickLine(["Now that's a proper email. Respect.", "Valid address. Quietly delighted."]));
              } else {
                volt.setMoodSafe("watching");
                if (e.target.value.includes("@")) volt.say("Close. My sensors say: not yet.");
              }
            }}
          />
        </label>

        <div>
          <label className="auth-field-wrap block">
            <Lock className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-charcoal/40" />
            <input
              type={showPass ? "text" : "password"}
              value={form.password}
              placeholder="Create a password"
              className="auth-field pr-12"
              autoComplete="new-password"
              onFocus={() => {
                volt.setMoodSafe("shy");
                volt.setTurned(true);
                volt.resetLook();
                volt.say("A secret? Say no more. *turns around*");
              }}
              onBlur={(e) => {
                if ((e.relatedTarget as HTMLElement | null)?.dataset?.["peek"]) return;
                volt.setTurned(false);
              }}
              onChange={(e) => {
                setForm((f) => ({ ...f, password: e.target.value }));
                volt.scorePassword(e.target.value);
              }}
            />
            <button
              type="button"
              data-peek="1"
              aria-label={showPass ? "Hide password" : "Show password"}
              className="absolute top-1/2 right-4 -translate-y-1/2 text-charcoal/45 transition hover:text-flame"
              onClick={() => {
                setShowPass((s) => !s);
                if (!showPass) volt.say("Revealing it? Good thing I'm facing the wall.");
              }}
            >
              {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </label>
          <VoltStrength volt={volt} />
        </div>

        <button
          ref={volt.btnRef}
          type="submit"
          className="auth-cta"
          onMouseEnter={() => volt.hype(true)}
          onMouseLeave={() => volt.hype(false)}
          onFocus={() => volt.hype(true)}
          onBlur={() => volt.hype(false)}
          onPointerDown={() => {
            volt.setPressedMood(true);
            volt.say(pickLine(["Ahh. That's the stuff.", "Mmm. Satisfying.", "Beep. Do that again."]));
          }}
          onPointerUp={() => volt.setPressedMood(false)}
        >
          <span aria-hidden>🍕</span>
          {volt.done ? "Welcome aboard ✓" : `Create account & open ${ROLE_COPY[role].destination}`}
        </button>
      </form>
    </VoltScene>
  );
}
