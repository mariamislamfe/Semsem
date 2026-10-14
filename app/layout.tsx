import type { Metadata, Viewport } from "next";
import { Alexandria, Aref_Ruqaa } from "next/font/google";
import { MotionPrefProvider } from "@/components/MotionPref";
import { SmoothScroll } from "@/components/SmoothScroll";
import "./globals.css";

const ruqaa = Aref_Ruqaa({
  subsets: ["arabic", "latin"],
  weight: ["400", "700"],
  variable: "--font-ruqaa",
  display: "swap",
});

// Alexandria — an Arabic/Latin family by Egyptian type designer Mohamed Gaber.
const alexandria = Alexandria({
  subsets: ["arabic", "latin"],
  weight: "variable",
  variable: "--font-alexandria",
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
      className={`${ruqaa.variable} ${alexandria.variable}`}
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
