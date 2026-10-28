import * as tus from "tus-js-client";
import { supabase } from "@/integrations/supabase/client";

const BUCKET = "article-images";

export const uploadArticleImage = async (file: File, path: string, onProgress: (percent: number) => void) => {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error || !session?.access_token) throw new Error("Sign in again before uploading images.");

  const endpoint = new URL("/storage/v1/upload/resumable", import.meta.env.VITE_SUPABASE_URL);
  if (endpoint.hostname.endsWith(".supabase.co") && !endpoint.hostname.endsWith(".storage.supabase.co")) {
    endpoint.hostname = endpoint.hostname.replace(/\.supabase\.co$/, ".storage.supabase.co");
  }

  await new Promise<void>((resolve, reject) => {
    const upload = new tus.Upload(file, {
      endpoint: endpoint.toString(),
      headers: { authorization: `Bearer ${session.access_token}` },
      metadata: { bucketName: BUCKET, objectName: path, contentType: file.type },
      fingerprint: async () => `article-image-${path}-${file.size}-${file.lastModified}`,
      chunkSize: 6 * 1024 * 1024,
      retryDelays: [0, 3000, 5000, 10000, 20000],
      uploadDataDuringCreation: true,
      removeFingerprintOnSuccess: true,
      onProgress: (sent, total) => onProgress(Math.round(sent / total * 100)),
      onError: reject,
      onSuccess: () => resolve(),
    });
    void upload.findPreviousUploads().catch(() => []).then((previous) => {
      if (previous.length) upload.resumeFromPreviousUpload(previous[0]);
      upload.start();
    }).catch(reject);
  });

  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
};

export const removeUploadedArticleImages = async (paths: string[]) => {
  if (paths.length === 0) return;
  const { error } = await supabase.storage.from(BUCKET).remove(paths);
  if (error) throw error;
};
