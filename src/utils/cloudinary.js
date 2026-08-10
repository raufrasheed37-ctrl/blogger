export async function uploadCoverToBackend({ file, apiRoot, token, onProgress } = {}) {
  if (!file) throw new Error("No file provided");

  const formData = new FormData();
  // backend expects multipart with field name: coverImage
  formData.append("coverImage", file);

  const res = await fetch(`${apiRoot}/posts`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Upload failed: ${res.status} ${text}`);
  }

  // Expect backend to return cover URL. We'll try a few common keys.
  const data = await res.json().catch(() => ({}));
  const url =
    data?.url ||
    data?.coverImageUrl ||
    data?.coverUrl ||
    data?.secure_url ||
    data?.publicUrl;

  if (!url) {
    throw new Error(`Upload succeeded but no URL returned. Response keys: ${Object.keys(data || {}).join(", ")}`);
  }

  if (typeof onProgress === "function") onProgress(100);
  return url;
}

