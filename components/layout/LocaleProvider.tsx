'use client';

import { useEffect } from 'react';

interface LocaleProviderProps {
  locale: string;
  children: React.ReactNode;
}

export function LocaleProvider({ locale, children }: LocaleProviderProps) {
  useEffect(() => {
    // Update HTML attributes based on locale
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
  }, [locale]);

  return <>{children}</>;
}