'use client';

export default function CommunityGuidelinesPage() {
  return (
    <div className="pt-32 pb-20 w-[90%] md:w-[85%] mx-auto max-w-4xl min-h-screen">
      <h1 className="text-4xl font-bold mb-8 text-slate-900">Community Guidelines</h1>
      
      <div className="prose prose-slate prose-lg max-w-none">
        <p className="lead text-xl text-slate-500 mb-10">
          At Veluxeride, we are committed to building a safe, respectful, and reliable community. These guidelines help ensure a positive experience for everyone.
        </p>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">1. Respect Each Other</h2>
          <p className="text-slate-600 mb-4">
            Treat everyone with respect. Always be polite and considerate to your driver and fellow passengers. Discriminatory behavior, harassment, or aggressive language is strictly prohibited and will result in immediate account suspension.
          </p>
          <ul className="list-disc pl-6 space-y-2 text-slate-600">
            <li>No shouting, swearing, or slamming doors.</li>
            <li>Respect personal space and privacy.</li>
            <li>Avoid controversial topics that might cause conflict.</li>
          </ul>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">2. Safety First</h2>
          <p className="text-slate-600 mb-4">
            Safety is our top priority. Both drivers and passengers must follow all local traffic laws and safety regulations.
          </p>
          <ul className="list-disc pl-6 space-y-2 text-slate-600">
            <li><strong>Seatbelts:</strong> Every person in the vehicle must wear a seatbelt.</li>
            <li><strong>Speed Limits:</strong> Drivers must adhere to speed limits.</li>
            <li><strong>Distractions:</strong> No texting while driving. Keep phone use to a minimum.</li>
            <li><strong>Alcohol & Drugs:</strong> Zero tolerance for drug or alcohol use during a trip.</li>
          </ul>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">3. Be Reliable</h2>
          <p className="text-slate-600 mb-4">
            Cancellations and lateness disrupt everyone's day. Please respect each other's time.
          </p>
          <ul className="list-disc pl-6 space-y-2 text-slate-600">
            <li><strong>Punctuality:</strong> Be at the pickup location on time. Drivers are only required to wait 5 minutes.</li>
            <li><strong>Cancellations:</strong> Cancel as early as possible if your plans change. Frequent cancellations may affect your account standing.</li>
          </ul>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">4. Property & Cleanliness</h2>
          <p className="text-slate-600 mb-4">
            Help keep the vehicle clean and damage-free.
          </p>
          <ul className="list-disc pl-6 space-y-2 text-slate-600">
            <li>Don't leave trash behind.</li>
            <li>Avoid eating or drinking messy items in the car.</li>
            <li>Report any damage or spills immediately.</li>
          </ul>
        </section>

        <section className="bg-slate-50 p-8 rounded-3xl mt-12">
          <h3 className="text-xl font-bold text-slate-900 mb-2">Reporting Violations</h3>
          <p className="text-slate-600 mb-4">
            If you experience or witness behavior that violates these guidelines, please report it to us immediately through the app's Help Center or after your ride. Your feedback is anonymous and helps keep our community safe.
          </p>
          <button className="bg-black text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition">
            Contact Support
          </button>
        </section>
      </div>
    </div>
  );
}