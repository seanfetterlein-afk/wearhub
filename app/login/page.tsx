"use client";

import { useState, useTransition, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight, ArrowLeft, AlertCircle, CheckCircle } from "lucide-react";
import { PageShell } from "@/components/ui/PageShell";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type Mode = "login" | "signup";
type Step = "email" | "otp";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginPageInner />
    </Suspense>
  );
}

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") ?? "/";

  const [mode, setMode] = useState<Mode>("login");
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const switchMode = (next: Mode) => {
    setMode(next);
    setStep("email");
    setError(null);
    setSuccess(null);
    setOtp("");
    setUsername("");
  };

  const handleSendOtp = (e: React.SyntheticEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const supabase = createClient();

      if (mode === "signup") {
        if (!username.trim()) {
          setError("Vælg et brugernavn.");
          return;
        }
        sessionStorage.setItem("pending_username", username.trim());
      }

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: mode === "signup",
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        console.error("[OTP] Supabase error:", error);
        sessionStorage.removeItem("pending_username");

        const msg = error.message ?? "";
        if (msg.toLowerCase().includes("signups not allowed") || msg.toLowerCase().includes("user not found")) {
          setError("Ingen konto fundet med denne email. Opret en konto i stedet.");
        } else if (error.status === 429 || msg.toLowerCase().includes("rate limit")) {
          setError("For mange forsøg. Vent venligst et minut og prøv igen.");
        } else {
          // Show the real error so we can debug it
          setError(`Fejl: ${msg || "Ukendt fejl fra Supabase"}`);
        }
        return;
      }

      setSuccess("Kode sendt! Tjek din email.");
      setStep("otp");
    });
  };

  const handleVerifyOtp = (e: React.SyntheticEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const supabase = createClient();

      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: "email",
      });

      if (error) {
        setError("Forkert eller udløbet kode. Prøv igen.");
        return;
      }

      // Save username to profile after signup
      const pendingUsername = sessionStorage.getItem("pending_username");
      if (pendingUsername && data.user) {
        sessionStorage.removeItem("pending_username");
        await (supabase.from("profiles") as any)
          .update({ username: pendingUsername, display_name: pendingUsername })
          .eq("id", data.user.id);
      }

      router.push(redirectTo);
      router.refresh();
    });
  };

  const handleResend = () => {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const supabase = createClient();
      await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: mode === "signup" },
      });
      setSuccess("Ny kode sendt.");
    });
  };

  return (
    <PageShell noFooter>
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-[380px]">


          {/* Mode tabs */}
          {step === "email" && (
            <div className="flex border border-black/10 mb-6 overflow-hidden">
              <ModeTab active={mode === "login"} onClick={() => switchMode("login")}>LOG IND</ModeTab>
              <ModeTab active={mode === "signup"} onClick={() => switchMode("signup")}>OPRET KONTO</ModeTab>
            </div>
          )}

          <div className="border border-black/10 p-8 bg-white">
            {step === "email" ? (
              <>
                <h1 className="font-display font-semibold text-black text-2xl mb-1" style={{ letterSpacing: "-0.03em" }}>
                  {mode === "login" ? "Velkommen tilbage." : "Bliv en del af Nord Studios."}
                </h1>
                <p className="text-[#AAAAAA] text-sm mb-7">
                  {mode === "login"
                    ? "Vi sender en engangskode til din email."
                    : "Opret en gratis konto på under 1 minut."}
                </p>

                {error && <ErrorBanner message={error} />}

                <form onSubmit={handleSendOtp} className="flex flex-col gap-4">
                  {mode === "signup" && (
                    <Field label="Brugernavn">
                      <input
                        type="text"
                        value={username}
                        onChange={e => setUsername(e.target.value.replace(/\s/g, "").toLowerCase())}
                        required
                        placeholder="nikekid_cph"
                        className={inputCls}
                        autoComplete="username"
                        autoFocus
                      />
                    </Field>
                  )}

                  <Field label="Email">
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      placeholder="din@email.dk"
                      className={inputCls}
                      autoComplete="email"
                      autoFocus={mode === "login"}
                    />
                  </Field>

                  <button
                    type="submit"
                    disabled={isPending}
                    className="w-full h-12 bg-black text-white font-mono text-[11px] tracking-widest uppercase flex items-center justify-center gap-2 hover:bg-black/80 transition-colors disabled:opacity-50 mt-2"
                  >
                    {isPending ? "SENDER..." : (
                      <>{mode === "login" ? "SEND KODE" : "OPRET KONTO"} <ArrowRight size={13} /></>
                    )}
                  </button>
                </form>

                <p className="text-center font-mono text-[10px] tracking-wider text-[#AAAAAA] mt-5">
                  {mode === "login" ? (
                    <>Ingen konto?{" "}
                      <button onClick={() => switchMode("signup")} className="text-black underline underline-offset-2">Opret gratis</button>
                    </>
                  ) : (
                    <>Har du allerede en konto?{" "}
                      <button onClick={() => switchMode("login")} className="text-black underline underline-offset-2">Log ind</button>
                    </>
                  )}
                </p>
              </>
            ) : (
              <>
                <button
                  onClick={() => { setStep("email"); setOtp(""); setError(null); setSuccess(null); }}
                  className="flex items-center gap-1.5 text-[#AAAAAA] hover:text-black font-mono text-[10px] tracking-wider uppercase mb-6 transition-colors"
                >
                  <ArrowLeft size={12} /> TILBAGE
                </button>

                <h1 className="font-display font-semibold text-black text-2xl mb-1" style={{ letterSpacing: "-0.03em" }}>
                  Tjek din email
                </h1>
                <p className="text-[#AAAAAA] text-sm mb-7">
                  Vi har sendt en kode til <span className="text-black font-medium">{email}</span>
                </p>

                {error && <ErrorBanner message={error} />}
                {success && <SuccessBanner message={success} />}

                <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
                  <Field label="Kode">
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={otp}
                      onChange={e => setOtp(e.target.value.replace(/\D/g, ""))}
                      required
                      placeholder="00000000"
                      className={`${inputCls} text-center text-xl tracking-[0.5em]`}
                      autoFocus
                    />
                  </Field>

                  <button
                    type="submit"
                    disabled={isPending || otp.length < 4}
                    className="w-full h-12 bg-black text-white font-mono text-[11px] tracking-widest uppercase flex items-center justify-center gap-2 hover:bg-black/80 transition-colors disabled:opacity-50 mt-2"
                  >
                    {isPending ? "BEKRÆFTER..." : <>BEKRÆFT <ArrowRight size={13} /></>}
                  </button>
                </form>

                <button
                  onClick={handleResend}
                  disabled={isPending}
                  className="w-full text-center font-mono text-[10px] tracking-wider text-[#AAAAAA] hover:text-black uppercase mt-4 transition-colors disabled:opacity-50"
                >
                  Send kode igen
                </button>
              </>
            )}
          </div>

          <p className="text-center font-mono text-[9px] tracking-wider text-[#AAAAAA] mt-5 leading-relaxed">
            Ved at fortsætte accepterer du vores{" "}
            <Link href="/terms" className="underline underline-offset-2 hover:text-black">vilkår</Link>{" "}og{" "}
            <Link href="/privacy" className="underline underline-offset-2 hover:text-black">privatlivspolitik</Link>.
          </p>
        </div>
      </div>
    </PageShell>
  );
}

const inputCls =
  "w-full h-11 px-3.5 border border-black/20 bg-transparent font-body text-sm text-black placeholder:text-[#AAAAAA] outline-none focus:border-black/50 transition-colors";

function ModeTab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex-1 py-2.5 font-mono text-[11px] tracking-widest uppercase transition-colors",
        active ? "bg-black text-white" : "bg-white text-[#AAAAAA] hover:text-black",
      )}
    >
      {children}
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="font-mono text-[10px] tracking-widest text-[#AAAAAA] uppercase">{label}</label>
      {children}
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2 bg-red-50 border border-red-200 px-3 py-2.5 mb-5">
      <AlertCircle size={14} className="shrink-0 mt-0.5 text-red-600" />
      <p className="text-sm text-red-700">{message}</p>
    </div>
  );
}

function SuccessBanner({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2 bg-green-50 border border-green-200 px-3 py-2.5 mb-5">
      <CheckCircle size={14} className="shrink-0 mt-0.5 text-green-600" />
      <p className="text-sm text-green-700">{message}</p>
    </div>
  );
}
