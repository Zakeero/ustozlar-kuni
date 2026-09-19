interface Item {
  id: number;
  full_name: string;
  photo_url: string | null;
}

/**
 * Ustozlar lentasi — rasmlar sekin suzib turadi.
 * Bazadan olinadi, ya'ni admin panelga ustoz qo'shilgani sayin o'zi to'ladi.
 */
export default function TeacherMarquee({ items }: { items: Item[] }) {
  if (items.length < 5) return null;

  // Uzluksiz aylanish uchun ro'yxat ikki marta takrorlanadi
  const loop = [...items, ...items];
  const duration = Math.max(30, items.length * 3.2);

  return (
    <section
      className="relative mt-8 overflow-hidden py-1"
      aria-label="Ustozlarimiz"
    >
      <div
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12"
        style={{
          background: "linear-gradient(90deg, var(--cream), transparent)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12"
        style={{
          background: "linear-gradient(270deg, var(--cream), transparent)",
        }}
      />

      <div
        className="marquee-track flex w-max gap-3"
        style={{ animationDuration: `${duration}s` }}
      >
        {loop.map((t, i) => (
          <figure
            key={`${t.id}-${i}`}
            className="flex w-[84px] shrink-0 flex-col items-center gap-1.5"
            aria-hidden={i >= items.length}
          >
            {t.photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={t.photo_url}
                alt={t.full_name}
                width={72}
                height={72}
                loading="lazy"
                className="h-[72px] w-[72px] rounded-full object-cover ring-2 ring-white"
                style={{ boxShadow: "0 8px 20px -10px rgba(122,31,8,.5)" }}
              />
            ) : (
              <span
                className="flex h-[72px] w-[72px] items-center justify-center rounded-full text-lg font-extrabold text-white ring-2 ring-white"
                style={{ background: "linear-gradient(140deg,#FF8A5C,#EF5123)" }}
              >
                {t.full_name
                  .split(/\s+/)
                  .slice(0, 2)
                  .map((w) => w[0]?.toUpperCase())
                  .join("")}
              </span>
            )}
            <figcaption className="muted w-full truncate text-center text-[0.65rem] font-semibold">
              {t.full_name.split(/\s+/)[0]}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
