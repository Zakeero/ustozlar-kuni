import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SITE } from "@/lib/config";

export const metadata: Metadata = {
  title: `${SITE.title} — ${SITE.org}`,
  description:
    "Ustozingizga minnatdorchilik bildiring va uni nominatsiyalardan biriga nomzod qilib ko'rsating.",
  openGraph: {
    title: `${SITE.title} — ${SITE.org}`,
    description: "Yilning eng yaxshi ustozini birga aniqlaymiz.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#070b16",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="uz">
      <body className="font-sans antialiased">
        <div className="mx-auto w-full max-w-3xl px-4 pb-24 pt-6">{children}</div>
      </body>
    </html>
  );
}
