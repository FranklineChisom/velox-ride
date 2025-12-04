'use client';

export default function TermsPage() {
  return (
    <div className="pt-24 pb-12 w-[90%] md:w-[85%] mx-auto max-w-3xl">
      <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
      <div className="prose prose-slate">
        <p className="mb-4">Last updated: December 2025</p>
        <p className="mb-4">Welcome to VeloxRide. By using our app, you agree to these terms...</p>
        <h3 className="text-xl font-bold mt-8 mb-4">1. User Accounts</h3>
        <p>You are responsible for maintaining the confidentiality of your account credentials...</p>
        {/* Add full legal text here */}
      </div>
    </div>
  );
}