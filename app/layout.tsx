import './globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-full font-sans">
        <header className="px-4 py-3 border-b flex items-center gap-4">
          <a href="/" className="font-bold">DrugShortage</a>
          <nav className="flex gap-3 text-sm">
            <a href="/report" className="hover:underline">Report</a>
            <a href="/admin" className="hover:underline">Admin</a>
          </nav>
        </header>
        <main className="p-4 mx-auto w-full max-w-5xl">{children}</main>
      </body>
    </html>
  );
}
