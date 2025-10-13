import { Providers } from "../providers";
import "../globals.css";
import { ConditionalLayout } from "../../components/layout/ConditionalLayout";

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  // Await params before using its properties (Next.js 15 requirement)
  const { locale } = await params;
  
  // Set document direction for RTL languages
  const isRTL = locale === 'ar';
  
  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} lang={locale}>
      <Providers>
        <ConditionalLayout>
          {children}
        </ConditionalLayout>
      </Providers>
    </div>
  );
}