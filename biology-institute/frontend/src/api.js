const BASE = "/api";

async function request(
  path,
  { method = "GET", body, token, isForm = false } = {}
) {
  const headers = {};
  if (!isForm) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
  });

  let data;
  try {
    data = await res.json();
  } catch {
    data = {};
  }
  if (!res.ok) {
    throw new Error(data.error || "Something went wrong. Please try again.");
  }
  return data;
}

export const api = {
  signUp: (payload) =>
    request("/auth/signup", { method: "POST", body: payload }),
  signIn: (payload) =>
    request("/auth/signin", { method: "POST", body: payload }),
  forgotPassword: (email) =>
    request("/auth/forgot-password", { method: "POST", body: { email } }),
  resetPassword: (payload) =>
    request("/auth/reset-password", { method: "POST", body: payload }),

  registerStudent: (payload, token) =>
    request("/students/register", { method: "POST", body: payload, token }),
  getStudents: (token) => request("/students", { token }),
  getStudent: (id, token) => request(`/students/${id}`, { token }),

  addMark: (payload, token) =>
    request("/marks", { method: "POST", body: payload, token }),
  getMarks: (studentId, token) =>
    request(`/marks/student/${studentId}`, { token }),
  downloadReportCard: async (studentId, token) => {
    const res = await fetch(`${BASE}/marks/report-card/${studentId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "Could not generate report card.");
    }
    return res.blob();
  },

  submitDoubt: (formData, token) =>
    request("/doubts", { method: "POST", body: formData, token, isForm: true }),
  getDoubts: (token, chapterId) =>
    request(`/doubts${chapterId ? `?chapter_id=${chapterId}` : ""}`, { token }),
  answerDoubt: (id, answer, token) =>
    request(`/doubts/${id}/answer`, { method: "PUT", body: { answer }, token }),

  getNotices: (token) => request("/notices", { token }),
  addNotice: (formData, token) =>
    request("/notices", {
      method: "POST",
      body: formData,
      token,
      isForm: true,
    }),
  deleteNotice: (id, token) =>
    request(`/notices/${id}`, { method: "DELETE", token }),

  getMcqSets: (token, { chapterId, contentType } = {}) => {
    const params = new URLSearchParams();
    if (chapterId) params.set("chapter_id", chapterId);
    if (contentType) params.set("content_type", contentType);
    const qs = params.toString();
    return request(`/mcq/sets${qs ? `?${qs}` : ""}`, { token });
  },
  getMcqQuestions: (setId, token) =>
    request(`/mcq/sets/${setId}/questions`, { token }),
  createMcqSet: (formData, token) =>
    request("/mcq/sets", {
      method: "POST",
      body: formData,
      token,
      isForm: true,
    }),
  answerMcq: (questionId, chosen_option, token) =>
    request(`/mcq/questions/${questionId}/answer`, {
      method: "POST",
      body: { chosen_option },
      token,
    }),
  deleteMcqSet: (id, token) =>
    request(`/mcq/sets/${id}`, { method: "DELETE", token }),
  getMcqSetResponses: (setId, token) =>
    request(`/mcq/sets/${setId}/responses`, { token }),

  getChapters: (token) => request("/chapters", { token }),
  getChapter: (id, token) => request(`/chapters/${id}`, { token }),
  createChapter: (payload, token) =>
    request("/chapters", { method: "POST", body: payload, token }),
  updateChapter: (id, payload, token) =>
    request(`/chapters/${id}`, { method: "PUT", body: payload, token }),
  deleteChapter: (id, token) =>
    request(`/chapters/${id}`, { method: "DELETE", token }),
};
