const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

async function request(path, options = {}) {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
}

export const authAPI = {
  getMe: () => request("/api/auth/me"),
  updateMe: (data) =>
    request("/api/auth/me", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
};

export const authorsAPI = {
  getById: (authorId) => request(`/api/authors/${authorId}`),
};
