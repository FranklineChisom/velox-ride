'use client';

export default function PrivacyPage() {
  return (
    <div className="pt-24 pb-12 w-[90%] md:w-[85%] mx-auto max-w-3xl">
      <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
      <div className="prose prose-slate">
        <p className="mb-4">Your privacy is important to us. This policy explains how we collect and use your data.</p>
        <h3 className="text-xl font-bold mt-8 mb-4">Data Collection</h3>
        <p>We collect location data to provide our services, even when the app is running in the background...</p>
        {/* Add full privacy text here */}
      </div>
    </div>
  );
}