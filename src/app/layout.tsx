import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SITE } from "@/lib/config";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

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
  themeColor: "#EF5123",
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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700;12..96,800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        {/* Telegram Mini App — sayt Telegram ichida ochilganda ishlaydi */}
        <script src="https://telegram.org/js/telegram-web-app.js" async />
      </head>
      <body className="font-sans antialiased">
        <SiteHeader />
        <div className="mx-auto w-full max-w-3xl px-4 pb-20">{children}</div>
        <SiteFooter />
      </body>
    </html>
  );
}
