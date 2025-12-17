import "./globals.css";

export const metadata = {
  title: "NBA Insights",
  description: "Positive EV and live NBA edges",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background text-zinc-100 antialiased">
        {children}
      </body>
    </html>
  );
}
