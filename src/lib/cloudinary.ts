// Cloudinary unsigned upload helper
export const CLOUDINARY_CLOUD = "dkkmdjcva";
export const CLOUDINARY_PRESET = "bombaiwala";

export interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
}

export async function uploadToCloudinary(
  file: File,
  opts?: { folder?: string; onProgress?: (pct: number) => void },
): Promise<CloudinaryUploadResult> {
  const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`;
  const fd = new FormData();
  fd.append("file", file);
  fd.append("upload_preset", CLOUDINARY_PRESET);
  if (opts?.folder) fd.append("folder", opts.folder);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && opts?.onProgress) {
        opts.onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };
    xhr.onload = () => {
      try {
        const res = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) resolve(res);
        else reject(new Error(res?.error?.message || `Upload failed (${xhr.status})`));
      } catch {
        reject(new Error("Invalid Cloudinary response"));
      }
    };
    xhr.onerror = () => reject(new Error("Network error"));
    xhr.send(fd);
  });
}

// Helper: build a transformed URL (e.g., thumbnail). publicId or full secure_url accepted.
export function cldThumb(secureUrl: string, w = 200, h = 200): string {
  if (!secureUrl.includes("/upload/")) return secureUrl;
  return secureUrl.replace("/upload/", `/upload/c_fill,w_${w},h_${h},q_auto,f_auto/`);
}
