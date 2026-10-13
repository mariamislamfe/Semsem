import type { Metadata, Viewport } from "next";
import { Amiri, Aref_Ruqaa, Fraunces, IBM_Plex_Sans_Arabic } from "next/font/google";
import { MotionPrefProvider } from "@/components/MotionPref";
import { SmoothScroll } from "@/components/SmoothScroll";
import "./globals.css";

const ruqaa = Aref_Ruqaa({
  subsets: ["arabic", "latin"],
  weight: ["400", "700"],
  variable: "--font-ruqaa",
  display: "swap",
});

const plex = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-plex",
  display: "swap",
});

const amiri = Amiri({
  subsets: ["arabic", "latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--font-amiri",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-fraunces",
  display: "swap",
});

export const metadata: Metadata = {
  title: "سمسم — خيمة سحور رمضانية",
  description:
    "سمسم: خيمة سحور رمضانية. لمّة، أكل، وسهرة لحد الفجر. النسخة دي تجريبية — المنيو والصور مؤقتة.",
  openGraph: {
    title: "سمسم — الليلة لسه مبدأتش",
    description: "خيمة سحور رمضانية. ادخل الخيمة واتفرج على السفرة.",
    locale: "ar_EG",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b0807",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${ruqaa.variable} ${plex.variable} ${fraunces.variable} ${amiri.variable}`}
    >
      <body>
        <MotionPrefProvider>
          <SmoothScroll />
          {children}
        </MotionPrefProvider>
      </body>
    </html>
  );
}
