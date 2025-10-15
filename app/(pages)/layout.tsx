import { ConditionalLayout } from "../../components/layout/ConditionalLayout";

export default function PagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ConditionalLayout>
      {children}
    </ConditionalLayout>
  );
}
