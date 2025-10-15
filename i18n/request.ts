import {notFound} from 'next/navigation';
import {getRequestConfig} from 'next-intl/server';

// Can be imported from a shared config
const locales = ['en', 'fr', 'ar'];

export default getRequestConfig(async ({ locale }) => {
  const fallbackLocale = 'fr';
  const normalizedLocale: string = locale ?? fallbackLocale;

  if (!locales.includes(normalizedLocale)) {
    notFound();
  }

  return {
    locale: normalizedLocale,
    messages: (await import(`../messages/${normalizedLocale}.json`)).default
  };
});
