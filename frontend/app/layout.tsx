import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gift Concierge | Edible Arrangements",
  description: "Find the perfect gift with our AI-powered gift concierge",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-pattern min-h-screen">
        {/* Decorative background blobs */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className="blob absolute -top-32 -right-32 w-96 h-96 bg-forest-400/5" />
          <div className="blob absolute top-1/2 -left-48 w-80 h-80 bg-gold-400/10" />
          <div className="blob absolute -bottom-24 right-1/4 w-64 h-64 bg-berry-400/5" />
        </div>

        {/* Main content */}
        <div className="relative z-10">
          {children}
        </div>
      </body>
    </html>
  );
}
