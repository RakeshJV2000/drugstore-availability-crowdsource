import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { ThemeToggle } from '@/components/ThemeToggle';
import { UserButton } from '@/components/UserButton';
import Providers from './providers';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(() => { try { const ls = localStorage.getItem('theme'); const m = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches; const t = ls === 'light' || ls === 'dark' ? ls : (m ? 'dark' : 'light'); if (t === 'dark') document.documentElement.classList.add('dark'); } catch(_){} })();`,
          }}
        />
      </head>
      <body className="min-h-full font-sans bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
        <Providers>
          <header className="px-4 py-3 border-b dark:border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <a href="/" className="font-bold">medmonitor</a>
              <nav className="flex gap-3 text-sm">
                <a href="/report" className="hover:underline">Report</a>
                <a href="/admin" className="hover:underline">Admin</a>
              </nav>
            </div>
            <div className="flex items-center gap-2">
              <UserButton />
              <ThemeToggle />
            </div>
          </header>
          <main className="p-4 mx-auto w-full max-w-5xl">{children}</main>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
