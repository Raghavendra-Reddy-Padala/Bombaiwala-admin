import { useRef, useState } from "react";
import { uploadToCloudinary, cldThumb } from "@/lib/cloudinary";
import { Button } from "@/components/ui/button";
import { Upload, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  images: string[];
  onChange: (images: string[]) => void;
  folder?: string;
  max?: number;
}

export function ImageUploader({ images, onChange, folder = "bombaiwala", max = 6 }: Props) {
  const ref = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const remaining = max - images.length;
    const list = Array.from(files).slice(0, remaining);
    if (list.length === 0) return toast.error(`Max ${max} images`);
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const f of list) {
        setProgress(0);
        const res = await uploadToCloudinary(f, { folder, onProgress: setProgress });
        urls.push(res.secure_url);
      }
      onChange([...images, ...urls]);
      toast.success(`${urls.length} image${urls.length > 1 ? "s" : ""} uploaded`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
      setProgress(0);
      if (ref.current) ref.current.value = "";
    }
  }

  function remove(i: number) {
    const arr = [...images];
    arr.splice(i, 1);
    onChange(arr);
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {images.map((src, i) => (
          <div key={i} className="relative group h-20 w-20 rounded-md overflow-hidden border bg-muted">
            <img src={cldThumb(src, 160, 160)} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => remove(i)}
              className="absolute top-0.5 right-0.5 h-5 w-5 rounded-full bg-black/70 text-white grid place-items-center opacity-0 group-hover:opacity-100 transition"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        {images.length < max && (
          <button
            type="button"
            onClick={() => ref.current?.click()}
            disabled={uploading}
            className="h-20 w-20 rounded-md border-2 border-dashed border-border grid place-items-center text-muted-foreground hover:border-primary hover:text-primary transition disabled:opacity-50"
          >
            {uploading ? (
              <div className="flex flex-col items-center gap-1">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-[10px] tabular-nums">{progress}%</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1">
                <Upload className="h-4 w-4" />
                <span className="text-[10px]">Upload</span>
              </div>
            )}
          </button>
        )}
      </div>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <p className="text-xs text-muted-foreground">
        Up to {max} images · stored on Cloudinary ({images.length}/{max})
      </p>
    </div>
  );
}
