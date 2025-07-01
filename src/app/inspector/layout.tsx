import { MobileNav } from '@/components/inspector/MobileNav';

export default function InspectorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mobile-safe-area flex flex-col h-screen">
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
        <MobileNav />
      </div>
    </div>
  );
}