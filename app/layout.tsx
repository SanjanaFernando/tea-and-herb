import type { Metadata } from "next";
import { Cursor, MotionProvider } from "@/components/motion";
import { Footer, Header } from "@/components/site-shell";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Tea & Herb Company | Ceylon, considered",
  description: "A Ceylon tea house, maker and export partner. Thoughtfully made in Colombo, Sri Lanka.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" suppressHydrationWarning>
    <head><script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} /></head>
    <body>
      <div className="preloader" aria-hidden="true">
        <div className="preloader-inner">
          <span className="preloader-mark"><span>T</span><i>&amp;</i><span>H</span></span>
          <span className="preloader-text">Ceylon, considered</span>
          <span className="preloader-bar"><span /></span>
        </div>
      </div>
      <div className="scroll-progress" aria-hidden="true" />
      <Cursor />
      <MotionProvider />
      <Header />
      {children}
      <Footer />
    </body>
  </html>;
}
