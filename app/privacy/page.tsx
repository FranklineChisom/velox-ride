'use client';

export default function PrivacyPage() {
  return (
    <div className="pt-32 pb-20 w-[90%] md:w-[85%] mx-auto max-w-3xl min-h-screen">
      <h1 className="text-4xl font-bold mb-8 text-slate-900">Privacy Policy</h1>
      <div className="prose prose-slate prose-lg">
        <p className="text-slate-500 mb-8">Your privacy is important to us. This policy explains how we collect and use your data.</p>
        
        <h3 className="text-2xl font-bold mt-12 mb-4 text-slate-900">Data Collection</h3>
        <p className="text-slate-600 mb-6">We collect location data to provide our services, even when the app is running in the background, to support features like real-time tracking, safety monitoring, and efficient pickup coordination.</p>
        
        <h3 className="text-2xl font-bold mt-12 mb-4 text-slate-900">How we use your data</h3>
        <p className="text-slate-600 mb-6">We use the data we collect to provide, personalize, maintain, and improve our products and services. This includes using the data to:</p>
        <ul className="list-disc pl-6 text-slate-600 mb-6 space-y-2">
           <li>Create and update your account.</li>
           <li>Verify your identity.</li>
           <li>Process or facilitate payments for those services.</li>
           <li>Track the progress of your ride.</li>
        </ul>
      </div>
    </div>
  );
}