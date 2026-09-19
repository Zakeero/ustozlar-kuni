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
      <div className="card rounded-2xl p-6 text-center">
        <p className="text-3xl">✅</p>
        <p className="mt-2 font-semibold text-white">
          Siz bu ustozga allaqachon ovoz bergansiz
        </p>
        <p className="mt-1 text-sm text-white/50">
          Qolgan ovozlaringizni boshqa ustozlarga bering.
        </p>
      </div>
    );
  }

  if (done) {
    return (
      <div className="card animate-in rounded-2xl p-6 text-center">
        <p className="text-4xl">🎉</p>
        <p className="mt-3 text-lg font-semibold text-white">
          Ovozingiz qabul qilindi!
        </p>
        <p className="mt-1 text-sm text-white/55">
          {teacherName} uchun rahmat aytdingiz.
        </p>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <button
            onClick={() => router.push("/men")}
            className="rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-5 py-2.5 text-sm font-semibold text-black"
          >
            Do'stlarni taklif qilish
          </button>
          <button
            onClick={() => router.push("/filiallar")}
            className="rounded-xl border border-white/12 px-5 py-2.5 text-sm text-white/80"
          >
            Yana ovoz berish
          </button>
        </div>
      </div>
    );
  }

  if (votesLeft <= 0) {
    return (
      <div className="card rounded-2xl p-6 text-center">
        <p className="text-3xl">🔒</p>
        <p className="mt-2 font-semibold text-white">Ovozlaringiz tugadi</p>
        <p className="mt-1 text-sm text-white/50">
          Do'stingizni taklif qiling — har biri uchun +1 ovoz olasiz.
        </p>
        <button
          onClick={() => router.push("/men")}
          className="mt-4 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-5 py-2.5 text-sm font-semibold text-black"
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
    <div className="space-y-5">
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white/50">
          Qaysi nominatsiyaga ovoz berasiz?
        </h2>
        <div className="grid gap-2">
          {NOMINATIONS.map((n) => {
            const active = nomination === n.key;
            return (
              <button
                key={n.key}
                type="button"
                onClick={() => setNomination(n.key)}
                className={`flex items-center gap-3 rounded-2xl border p-3.5 text-left transition ${
                  active
                    ? "border-amber-400/50 bg-amber-400/10"
                    : "border-white/8 bg-white/4 hover:bg-white/6"
                }`}
              >
                <span
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${n.accent} text-xl`}
                >
                  {n.emoji}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-white">{n.title}</span>
                  <span className="block text-xs text-white/45">{n.description}</span>
                </span>
                <span
                  className={`h-5 w-5 shrink-0 rounded-full border-2 transition ${
                    active ? "border-amber-400 bg-amber-400" : "border-white/20"
                  }`}
                />
              </button>
            );
          })}
        </div>
      </div>

      {askStudent && (
        <div>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-white/50">
            Siz kimsiz?
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {[
              { v: true, label: "O'quvchiman", icon: "🎓" },
              { v: false, label: "Mehmonman", icon: "👋" },
            ].map((o) => (
              <button
                key={String(o.v)}
                type="button"
                onClick={() => setIsStudent(o.v)}
                className={`rounded-xl border p-3 text-sm transition ${
                  isStudent === o.v
                    ? "border-amber-400/50 bg-amber-400/10 text-white"
                    : "border-white/8 bg-white/4 text-white/70"
                }`}
              >
                <span className="mr-1.5">{o.icon}</span>
                {o.label}
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-xs text-white/35">
            O'quvchilar va mehmonlar ovozi alohida hisoblanadi.
          </p>
        </div>
      )}

      <div>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-white/50">
          Ustozingizga iliq so'z{" "}
          <span className="font-normal normal-case text-white/30">(ixtiyoriy)</span>
        </h2>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value.slice(0, 500))}
          rows={3}
          placeholder="Ustozim menga nimani o'rgatdi…"
          className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none transition focus:border-amber-400/40"
        />
        <p className="mt-1 text-right text-xs text-white/30">{comment.length}/500</p>
        <p className="text-xs text-white/40">
          Barcha iliq so'zlar 1-oktyabrda ustozlarga albom qilib topshiriladi.
        </p>
      </div>

      {error && (
        <p className="rounded-xl border border-rose-400/25 bg-rose-400/10 px-4 py-2.5 text-sm text-rose-100">
          {error}
        </p>
      )}

      <button
        onClick={submit}
        disabled={loading}
        className="w-full rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-6 py-3.5 text-sm font-bold text-black transition hover:brightness-110 disabled:opacity-50"
      >
        {loading ? "Yuborilmoqda…" : `Ovoz berish (${votesLeft} ta qoldi)`}
      </button>
    </div>
  );
}
