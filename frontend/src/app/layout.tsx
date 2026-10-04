import type { Metadata } from 'next';
import { Caveat, Plus_Jakarta_Sans, Space_Grotesk } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import { SidebarProvider } from '@/context/SidebarContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { themeInitScript } from '@/context/themeScript';
import { AuthProvider } from '@/hooks/auth/AuthContext';

const sans = Plus_Jakarta_Sans({
  subsets: ['latin', 'latin-ext', 'vietnamese'],
  variable: '--font-jakarta',
  display: 'swap',
});

const display = Space_Grotesk({
  subsets: ['latin', 'latin-ext', 'vietnamese'],
  weight: ['500', '700'],
  variable: '--font-grotesk',
  display: 'swap',
});

const hand = Caveat({
  subsets: ['latin', 'latin-ext'],
  weight: ['600', '700'],
  variable: '--font-caveat',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Journify – Lập kế hoạch du lịch Việt Nam',
    template: '%s | Journify',
  },
  description: 'Lên lộ trình du lịch theo ngày, tạo lịch trình bằng AI từ dữ liệu địa điểm thật và chia sẻ trải nghiệm với cộng đồng.',
  applicationName: 'Journify',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning className={`${sans.variable} ${display.variable} ${hand.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="font-sans dark:bg-gray-900">
        <Script
          src="https://cdn.payos.vn/payos-checkout/v1/stable/payos-initialize.js"
          strategy="lazyOnload"
        />
        <AuthProvider>
          <ThemeProvider>
            <SidebarProvider>
              {children}
            </SidebarProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
