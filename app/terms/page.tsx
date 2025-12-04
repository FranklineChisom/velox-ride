'use client';

export default function TermsPage() {
  return (
    <div className="pt-32 pb-20 w-[90%] md:w-[85%] mx-auto max-w-3xl min-h-screen">
      <h1 className="text-4xl font-bold mb-8 text-slate-900">Terms of Service</h1>
      <div className="prose prose-slate prose-lg">
        <p className="text-slate-500 mb-8">Last updated: December 2025</p>
        <p className="mb-6">Welcome to VeloxRide. By using our app, you agree to these terms...</p>
        <h3 className="text-2xl font-bold mt-12 mb-4 text-slate-900">1. User Accounts</h3>
        <p className="text-slate-600 mb-6">You are responsible for maintaining the confidentiality of your account credentials. You agree to accept responsibility for all activities that occur under your account.</p>
        <h3 className="text-2xl font-bold mt-12 mb-4 text-slate-900">2. Services</h3>
        <p className="text-slate-600 mb-6">VeloxRide provides a technology platform that enables users of VeloxRide&apos;s mobile applications or websites to arrange and schedule transportation and/or logistics services with independent third party providers of such services.</p>
        {/* Add full legal text here */}
      </div>
    </div>
  );
}