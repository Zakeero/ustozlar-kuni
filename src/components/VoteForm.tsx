"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { NOMINATIONS, type NominationKey } from "@/lib/config";

interface Props {
  teacherId: number;
  teacherName: string;
  branchId: number;
  askStudent: boolean;
  votesLeft: number;
  alreadyVoted: boolean;
}

export default function VoteForm({
  teacherId,
  teacherName,
  branchId,
  askStudent,
  votesLeft,
  alreadyVoted,
}: Props) {
  const router = useRouter();
  const [nomination, setNomination] = useState<NominationKey | null>(null);
  const [comment, setComment] = useState("");
  const [isStudent, setIsStudent] = useState<boolean | null>(
    askStudent ? null : true,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (alreadyVoted) {
    return (
      <div className="card p-7 text-center">
        <p className="text-4xl">✅</p>
        <p className="font-display mt-3 text-lg text-[color:var(--ember)]">
          Siz bu ustozga allaqachon ovoz bergansiz
        </p>
        <p className="muted mt-1.5 text-sm">
          Qolgan ovozlaringizni boshqa ustozlarga bering.
        </p>
      </div>
    );
  }

  if (done) {
    return (
      <div className="card-brand animate-in p-8 text-center">
        <div className="relative">
          <p className="text-5xl">🎉</p>
          <p className="font-display mt-4 text-2xl text-white">
            Ovozingiz qabul qilindi!
          </p>
          <p className="mt-2 text-sm text-white/80">
            {teacherName} uchun rahmat aytdingiz.
          </p>
          <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
            <button
              onClick={() => router.push("/men")}
              className="btn btn-light"
            >
              Do'stlarni taklif qilish
            </button>
            <button
              onClick={() => router.push("/filiallar")}
              className="btn !bg-white/12 !text-white ring-1 ring-white/25 hover:!bg-white/20"
            >
              Yana ovoz berish
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (votesLeft <= 0) {
    return (
      <div className="card p-7 text-center">
        <p className="text-4xl">🔒</p>
        <p className="font-display mt-3 text-lg text-[color:var(--ember)]">
          Ovozlaringiz tugadi
        </p>
        <p className="muted mt-1.5 text-sm">
          Do'stingizni taklif qiling — har biri uchun +1 ovoz olasiz.
        </p>
        <button
          onClick={() => router.push("/men")}
          className="btn btn-primary mt-5"
        >
          Taklif havolamni olish
        </button>
      </div>
    );
  }

  async function submit() {
    if (!nomination) {
      setError("Nominatsiyani tanlang.");
      return;
    }
    if (askStudent && isStudent === null) {
      setError("Kim ekaningizni belgilang.");
      return;
    }
    setLoading(true);
    setError(null);

    const res = await fetch("/api/vote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        teacherId,
        nomination,
        comment,
        isStudent: askStudent ? isStudent : undefined,
        branchId: askStudent && isStudent ? branchId : null,
      }),
    });
    const data = await res.json();
    setLoading(false);

    if (!data.ok) {
      setError(data.message ?? "Xatolik yuz berdi.");
      return;
    }
    setDone(true);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="eyebrow mb-3">Qaysi nominatsiyaga ovoz berasiz?</h2>
        <div className="grid gap-2.5">
          {NOMINATIONS.map((n) => {
            const active = nomination === n.key;
            return (
              <button
                key={n.key}
                type="button"
                onClick={() => setNomination(n.key)}
                className="flex items-center gap-3.5 rounded-2xl border p-3.5 text-left transition"
                style={{
                  borderColor: active ? n.tint : "var(--line)",
                  background: active
                    ? `color-mix(in srgb, ${n.tint} 8%, white)`
                    : "rgba(255,255,255,.7)",
                  boxShadow: active
                    ? `0 10px 26px -14px ${n.tint}`
                    : "0 1px 2px rgba(122,31,8,.04)",
                }}
              >
                <span
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-[1.35rem]"
                  style={{ background: n.accent }}
                >
                  {n.emoji}
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className="block font-bold leading-tight"
                    style={{ color: n.tint }}
                  >
                    {n.title}
                  </span>
                  <span className="muted mt-0.5 block text-[0.78rem] leading-snug">
                    {n.description}
                  </span>
                </span>
                <span
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition"
                  style={{
                    borderColor: active ? n.tint : "rgba(122,31,8,.18)",
                    background: active ? n.tint : "transparent",
                  }}
                >
                  {active && (
                    <span className="h-1.5 w-1.5 rounded-full bg-white" />
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {askStudent && (
        <div>
          <h2 className="eyebrow mb-2.5">Siz kimsiz?</h2>
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { v: true, label: "O'quvchiman", icon: "🎓" },
              { v: false, label: "Mehmonman", icon: "👋" },
            ].map((o) => {
              const active = isStudent === o.v;
              return (
                <button
                  key={String(o.v)}
                  type="button"
                  onClick={() => setIsStudent(o.v)}
                  className={`rounded-2xl border p-3.5 text-sm font-bold transition ${
                    active
                      ? "border-[color:var(--brand)] bg-[color:var(--sand)] text-[color:var(--brand-700)]"
                      : "border-[color:var(--line)] bg-white/70 text-[color:var(--muted)]"
                  }`}
                >
                  <span className="mr-1.5">{o.icon}</span>
                  {o.label}
                </button>
              );
            })}
          </div>
          <p className="muted mt-2 text-xs">
            O'quvchilar va mehmonlar ovozi alohida hisoblanadi.
          </p>
        </div>
      )}

      <div>
        <h2 className="eyebrow mb-2.5">
          Ustozingizga iliq so'z{" "}
          <span className="font-semibold normal-case tracking-normal text-[color:var(--muted)]">
            (ixtiyoriy)
          </span>
        </h2>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value.slice(0, 500))}
          rows={3}
          placeholder="Ustozim menga nimani o'rgatdi…"
          className="input resize-none"
        />
        <div className="mt-1.5 flex items-start justify-between gap-3">
          <p className="muted text-xs">
            Barcha iliq so'zlar 1-oktyabrda ustozlarga albom qilib topshiriladi.
          </p>
          <span className="muted shrink-0 text-xs tabular-nums">
            {comment.length}/500
          </span>
        </div>
      </div>

      {error && (
        <p className="rounded-2xl border border-[color:var(--brand-300)] bg-[color:var(--sand)] px-4 py-3 text-sm font-medium text-[color:var(--brand-700)]">
          {error}
        </p>
      )}

      <button
        onClick={submit}
        disabled={loading}
        className="btn btn-primary w-full !py-4 !text-base"
      >
        {loading ? "Yuborilmoqda…" : `Ovoz berish · ${votesLeft} ta qoldi`}
      </button>
    </div>
  );
}
