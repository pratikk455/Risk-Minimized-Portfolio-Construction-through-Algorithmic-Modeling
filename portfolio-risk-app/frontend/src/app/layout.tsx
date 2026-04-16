import type { Metadata } from 'next'
import { Inter, Poppins, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import Providers from '@/components/Providers'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-poppins',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Hedgewise - Smart Portfolio Management',
  description: 'Advanced portfolio construction with risk minimization',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${poppins.variable} ${jetbrainsMono.variable}`}>
      <body className="font-poppins antialiased">
        <Providers>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: 'rgba(255,255,255,0.92)',
                color: '#0B0E14',
                fontFamily: 'var(--font-poppins)',
                borderRadius: '16px',
                padding: '14px 18px',
                fontSize: '14px',
                fontWeight: '500',
                border: '1px solid rgba(228,232,240,0.8)',
                boxShadow: '0 8px 32px rgba(15,23,42,0.10)',
                backdropFilter: 'blur(12px)',
              },
              success: {
                iconTheme: {
                  primary: '#00B36A',
                  secondary: '#FFFFFF',
                },
              },
              error: {
                iconTheme: {
                  primary: '#EF4444',
                  secondary: '#FFFFFF',
                },
              },
            }}
          />
        </Providers>
      </body>
    </html>
  )
}