import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/app/components/theme-provider';

const inter = Inter({ subsets: ['latin'] });

export default function RiceSessionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={inter.className}>
      {children}
    </div>
  );
} 