import PassengerSidebar from '@/components/passenger/PassengerSidebar';

export default function PassengerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-slate-50/50">
      <PassengerSidebar />
      <main className="flex-1 relative overflow-y-auto h-screen">
        <div className="max-w-7xl mx-auto min-h-full">
          {children}
        </div>
      </main>
    </div>
  );
}