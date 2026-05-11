"use client";

import { useEffect, useState, useTransition } from "react";
import { X, Loader2, ArrowUpRight, Clock, Banknote, AlertCircle } from "lucide-react";
import { getWalletData, withdrawBalance, initiateConnectOnboarding } from "@/lib/actions/wallet";
import { formatPrice } from "@/lib/utils";
import type { WalletData, WalletTransaction } from "@/lib/actions/wallet";

interface Props {
  onClose: () => void;
}

const TYPE_LABEL: Record<WalletTransaction["type"], string> = {
  sale_pending:         "Salg modtaget",
  release_to_available: "Midler frigivet",
  payout:               "Udbetaling",
  refund:               "Refusion",
  adjustment:           "Justering",
};

const STATUS_STYLE: Record<WalletTransaction["status"], string> = {
  pending:   "text-amber-600",
  available: "text-green-600",
  paid_out:  "text-ink-dim",
  failed:    "text-red-500",
  refunded:  "text-blue-500",
};

const STATUS_LABEL: Record<WalletTransaction["status"], string> = {
  pending:   "AFVENTENDE",
  available: "TILGÆNGELIG",
  paid_out:  "UDBETALT",
  failed:    "FEJLET",
  refunded:  "REFUNDERET",
};

export function WalletModal({ onClose }: Props) {
  const [data,    setData]    = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [withdrawPending,    startWithdraw]    = useTransition();
  const [connectPending,     setConnectPending] = useState(false);

  // Lock background scroll
  useEffect(() => {
    document.body.style.overflow   = "hidden";
    document.body.style.touchAction = "none";
    return () => {
      document.body.style.overflow   = "";
      document.body.style.touchAction = "";
    };
  }, []);

  // Load wallet data on mount
  useEffect(() => {
    getWalletData().then((result) => {
      setLoading(false);
      if (result.error) setError(result.error);
      else if (result.data) setData(result.data);
    });
  }, []);

  const handleWithdraw = () => {
    setError(null);
    setSuccess(null);
    startWithdraw(async () => {
      const result = await withdrawBalance();
      if (result.error) {
        setError(result.error);
        return;
      }
      setSuccess("Udbetaling gennemført! Pengene er på vej til din konto.");
      // Refresh wallet data
      const refreshed = await getWalletData();
      if (refreshed.data) setData(refreshed.data);
    });
  };

  const handleConnectOnboarding = async () => {
    setError(null);
    setConnectPending(true);
    const result = await initiateConnectOnboarding();
    setConnectPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    if (result.url) {
      window.location.href = result.url;
    }
  };

  const wallet       = data?.wallet;
  const transactions = data?.transactions ?? [];
  const onboarded    = data?.connectOnboarded ?? false;
  const accountId    = data?.connectAccountId ?? null;

  const availableBalance = wallet?.available_balance ?? 0;
  const pendingBalance   = wallet?.pending_balance   ?? 0;
  const canWithdraw      = availableBalance > 0 && onboarded;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-0 sm:px-4">
      <div className="w-full sm:max-w-md bg-white border border-brown/20 flex flex-col max-h-[92vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-brown/10 shrink-0">
          <div>
            <p className="font-mono text-[9px] tracking-widest text-ink-dim uppercase">NORD STUDIOS</p>
            <h2
              className="font-display font-semibold text-brown text-xl"
              style={{ letterSpacing: "-0.02em" }}
            >
              Din saldo
            </h2>
          </div>
          <button onClick={onClose} className="text-ink-dim hover:text-ink">
            <X size={18} />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={20} className="animate-spin text-ink-dim" />
            </div>
          ) : (
            <>
              {/* Balance cards */}
              <div className="grid grid-cols-2 divide-x divide-brown/10 border-b border-brown/10">
                <div className="px-6 py-5">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Clock size={11} className="text-amber-500" />
                    <p className="font-mono text-[9px] tracking-widest text-ink-dim uppercase">
                      Afventende
                    </p>
                  </div>
                  <p
                    className="font-display font-semibold text-brown"
                    style={{ fontSize: 22, letterSpacing: "-0.02em" }}
                  >
                    {formatPrice(pendingBalance)}
                  </p>
                  {pendingBalance > 0 && (
                    <p className="font-mono text-[9px] tracking-wider text-ink-dim mt-1 leading-relaxed">
                      Frigives ved levering
                    </p>
                  )}
                </div>

                <div className="px-6 py-5">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Banknote size={11} className="text-green-600" />
                    <p className="font-mono text-[9px] tracking-widest text-ink-dim uppercase">
                      Tilgængelig
                    </p>
                  </div>
                  <p
                    className="font-display font-semibold text-brown"
                    style={{ fontSize: 22, letterSpacing: "-0.02em" }}
                  >
                    {formatPrice(availableBalance)}
                  </p>
                  {availableBalance > 0 && (
                    <p className="font-mono text-[9px] tracking-wider text-green-600 mt-1">
                      Klar til udbetaling
                    </p>
                  )}
                </div>
              </div>

              {/* Status messages */}
              {(error || success) && (
                <div className="px-6 pt-4">
                  {error && (
                    <div className="flex items-start gap-2 border border-red-200 bg-red-50 px-3 py-2">
                      <AlertCircle size={13} className="text-red-500 mt-0.5 shrink-0" />
                      <p className="font-mono text-[10px] tracking-wider text-red-600">{error}</p>
                    </div>
                  )}
                  {success && (
                    <p className="font-mono text-[10px] tracking-wider text-green-600 border border-green-200 bg-green-50 px-3 py-2">
                      {success}
                    </p>
                  )}
                </div>
              )}

              {/* Payout actions */}
              <div className="px-6 py-5 border-b border-brown/10 flex flex-col gap-3">

                {/* No bank account connected */}
                {!accountId && (
                  <button
                    onClick={handleConnectOnboarding}
                    disabled={connectPending}
                    className="w-full h-12 bg-brown text-cream font-mono text-[11px] tracking-widest uppercase hover:bg-brown-deep transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {connectPending ? (
                      <><Loader2 size={13} className="animate-spin" /> HENTER...</>
                    ) : (
                      <><ArrowUpRight size={13} /> TILKNYT BANKKONTO</>
                    )}
                  </button>
                )}

                {/* Account connected but onboarding incomplete */}
                {accountId && !onboarded && (
                  <button
                    onClick={handleConnectOnboarding}
                    disabled={connectPending}
                    className="w-full h-12 border border-brown font-mono text-[11px] tracking-widest text-brown uppercase hover:bg-brown hover:text-cream transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {connectPending ? (
                      <><Loader2 size={13} className="animate-spin" /> HENTER...</>
                    ) : (
                      "FULDFØR STRIPE-OPSÆTNING"
                    )}
                  </button>
                )}

                {/* Ready to withdraw */}
                {onboarded && (
                  <button
                    onClick={handleWithdraw}
                    disabled={!canWithdraw || withdrawPending}
                    className="w-full h-12 bg-brown text-cream font-mono text-[11px] tracking-widest uppercase hover:bg-brown-deep transition-colors disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2"
                  >
                    {withdrawPending ? (
                      <><Loader2 size={13} className="animate-spin" /> BEHANDLER...</>
                    ) : (
                      <><ArrowUpRight size={13} /> UDBETAL SALDO</>
                    )}
                  </button>
                )}

                {/* Helper text */}
                {availableBalance === 0 && !pendingBalance && (
                  <p className="font-mono text-[9px] tracking-wider text-ink-dim text-center">
                    Ingen saldo klar til udbetaling endnu.
                  </p>
                )}
                {pendingBalance > 0 && availableBalance === 0 && (
                  <p className="font-mono text-[9px] tracking-wider text-ink-dim text-center">
                    Din saldo frigives når køber bekræfter modtagelse af pakken.
                  </p>
                )}
                {onboarded && availableBalance > 0 && (
                  <p className="font-mono text-[9px] tracking-wider text-ink-dim text-center">
                    Udbetaling på {formatPrice(availableBalance)} sendes til din tilknyttede konto.
                  </p>
                )}
              </div>

              {/* Transaction history */}
              {transactions.length > 0 && (
                <div className="px-6 py-5">
                  <p className="font-mono text-[9px] tracking-widest text-ink-dim uppercase mb-4">
                    Transaktioner
                  </p>
                  <div className="flex flex-col divide-y divide-brown/10">
                    {transactions.map((txn) => (
                      <div key={txn.id} className="flex items-center justify-between py-3">
                        <div className="flex-1 min-w-0 pr-4">
                          <p className="font-body text-sm text-ink">
                            {TYPE_LABEL[txn.type]}
                          </p>
                          {txn.description && (
                            <p className="font-mono text-[9px] tracking-wider text-ink-dim mt-0.5">
                              {txn.description}
                            </p>
                          )}
                          <p className="font-mono text-[9px] tracking-wider text-ink-dim mt-0.5">
                            {new Date(txn.created_at).toLocaleDateString("da-DK", {
                              day:   "numeric",
                              month: "long",
                              year:  "numeric",
                            })}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p
                            className={`font-display font-semibold text-base ${
                              txn.type === "payout" ? "text-ink-mid" : "text-brown"
                            }`}
                            style={{ letterSpacing: "-0.01em" }}
                          >
                            {txn.type === "payout" ? "−" : "+"}{formatPrice(txn.amount)}
                          </p>
                          <p className={`font-mono text-[9px] tracking-wider mt-0.5 ${STATUS_STYLE[txn.status]}`}>
                            {STATUS_LABEL[txn.status]}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {transactions.length === 0 && !loading && (
                <div className="px-6 py-10 text-center">
                  <p className="font-mono text-[10px] tracking-widest text-ink-dim uppercase">
                    Ingen transaktioner endnu
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
