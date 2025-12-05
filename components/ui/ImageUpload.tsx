'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase';
import { Camera, Loader2, Upload } from 'lucide-react';
import { useToast } from '@/components/ui/ToastProvider';

interface Props {
  uid: string;
  url?: string;
  onUpload: (url: string) => void;
  bucket?: 'avatars' | 'documents';
  className?: string;
  type?: 'avatar' | 'document';
}

export default function ImageUpload({ uid, url, onUpload, bucket = 'avatars', className = '', type = 'avatar' }: Props) {
  const supabase = createClient();
  const { addToast } = useToast();
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `${uid}-${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // Get Public URL
      const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
      onUpload(data.publicUrl);
      addToast('Upload successful!', 'success');
    } catch (error: any) {
      addToast(error.message, 'error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={`relative group ${className}`}>
      {type === 'avatar' ? (
        <div className="w-full h-full rounded-full overflow-hidden bg-slate-100 border-4 border-white shadow-lg relative">
          {url ? (
            <img src={url} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-300">
              <Camera className="w-1/3 h-1/3" />
            </div>
          )}
          
          <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer">
             {uploading ? <Loader2 className="w-6 h-6 text-white animate-spin"/> : <Upload className="w-6 h-6 text-white"/>}
             <input type="file" className="hidden" accept="image/*" onChange={handleUpload} disabled={uploading} />
          </label>
        </div>
      ) : (
        // Document Style
        <label className="flex items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:bg-slate-50 transition">
           {uploading ? (
             <Loader2 className="w-6 h-6 text-slate-400 animate-spin"/>
           ) : url ? (
             <div className="relative w-full h-full p-2">
                <img src={url} className="w-full h-full object-contain rounded-lg"/>
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition rounded-lg text-white font-bold text-xs">Change</div>
             </div>
           ) : (
             <div className="text-center">
                <Upload className="w-6 h-6 text-slate-400 mx-auto mb-2"/>
                <span className="text-xs text-slate-500 font-bold">Click to Upload</span>
             </div>
           )}
           <input type="file" className="hidden" accept="image/*" onChange={handleUpload} disabled={uploading} />
        </label>
      )}
    </div>
  );
}