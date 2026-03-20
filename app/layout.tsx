import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="scrollbar-track-transparent scrollbar-thumb-foreground/10"
    >
      <body>
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
