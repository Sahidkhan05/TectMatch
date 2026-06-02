import "./globals.css";

export const metadata = {
  title: "TectMatch",
  description: "AI-powered resume screening for hiring teams",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
