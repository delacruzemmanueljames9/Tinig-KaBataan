import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth/auth-context';
import { EcosystemProvider } from '@/lib/store/ecosystem-context';
import { CrisisBanner } from '@/components/layout/CrisisBanner';

export const metadata: Metadata = {
  title: 'Tinig KaBataan (TK) | Your Voice Matters. Your Mind Matters.',
  description:
    'A unified digital organization and ecosystem for Filipino youth, offering accessible mental health support, civic participation, leadership development, and investigative publication.',
  keywords: [
    'Tinig KaBataan',
    'Mental Health Philippines',
    'Youth Empowerment',
    'Philippine Youth Organization',
    'Free Mental Health Support',
    'NCMH 1553',
    'Peer Counseling',
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-900 antialiased selection:bg-tk-lavender selection:text-tk-deepblue">
        <AuthProvider>
          <EcosystemProvider>
            <CrisisBanner />
            <div className="flex-1 flex flex-col">{children}</div>
          </EcosystemProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
