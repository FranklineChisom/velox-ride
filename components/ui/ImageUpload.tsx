'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase';
import { Camera, Loader2, Upload } from 'lucide-react';
import { useToast } from '@/components/ui/ToastProvider';
import { cn } from '@/lib/utils';

interface Props {
  uid: string;
  url?: string;
  onUpload: (url: string) => void;
  bucket?: 'avatars' | 'documents';
  className?: string;
  type?: 'avatar' | 'document';
  variant?: 'default' | 'compact';
}

export default function ImageUpload({ 
  uid, 
  url, 
  onUpload, 
  bucket = 'avatars', 
  className = '', 
  type = 'avatar',
  variant = 'default' 
}: Props) {
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
    <div className={cn("relative group", type === 'document' ? "h-full w-full" : "w-full h-full", className)}>
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
        <label className={cn(
          "flex items-center justify-center w-full h-full border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:bg-slate-50 transition overflow-hidden",
          variant === 'default' ? "min-h-[128px]" : "" // Default height only if not compact
        )}>
           {uploading ? (
             <Loader2 className="w-5 h-5 text-slate-400 animate-spin"/>
           ) : url ? (
             <div className="relative w-full h-full">
                <img src={url} className="w-full h-full object-cover opacity-80 group-hover:opacity-40 transition"/>
                <div className="absolute inset-0 flex items-center justify-center">
                   <div className="bg-black/60 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition">Change</div>
                </div>
             </div>
           ) : (
             <div className="text-center p-2">
                <Upload className={cn("text-slate-400 mx-auto", variant === 'compact' ? "w-4 h-4" : "w-6 h-6 mb-2")}/>
                {variant === 'default' && <span className="text-xs text-slate-500 font-bold block">Click to Upload</span>}
             </div>
           )}
           <input type="file" className="hidden" accept="image/*" onChange={handleUpload} disabled={uploading} />
        </label>
      )}
    </div>
  );
}