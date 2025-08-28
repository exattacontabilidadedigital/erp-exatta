'use client';

import { usePathname } from 'next/navigation';
import Header from '@/components/ui/header';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const pathname = usePathname();
  
  // Páginas que não devem mostrar o header
  const authPages = ['/login', '/register', '/forgot-password', '/reset-password'];
  const shouldShowHeader = !authPages.includes(pathname);

  return (
    <>
      {shouldShowHeader && <Header />}
      <main className={shouldShowHeader ? "min-h-screen" : "min-h-screen"}>
        {children}
      </main>
    </>
  );
}
