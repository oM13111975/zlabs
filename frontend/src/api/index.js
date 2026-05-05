import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT token on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auto-refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true
      const refresh = localStorage.getItem('refresh')
      if (refresh) {
        try {
          const res = await axios.post('/api/auth/refresh/', { refresh })
          localStorage.setItem('access', res.data.access)
          original.headers.Authorization = `Bearer ${res.data.access}`
          return api(original)
        } catch {
          localStorage.clear()
          window.location.href = '/login'
        }
      } else {
        localStorage.clear()
        window.location.href = '/login'
      }
    }
    return Promise.reject(err)
  }
)

export default api

// ── Auth ───────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (data) => api.post('/auth/login/', data),
  me: () => api.get('/auth/me/'),
  mentors: () => api.get('/auth/mentors/'),
  users: (params) => api.get('/auth/users/', { params }),
  analytics: () => api.get('/auth/analytics/'),
  updateMe: (data) => api.patch('/auth/me/', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  updateUser: (id, data) => api.patch(`/auth/users/${id}/`, data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  userDetail: (id) => api.get(`/auth/users/${id}/`),
  deleteUser: (id) => api.delete(`/auth/users/${id}/`),
}

// ── Internships ────────────────────────────────────────────────────────────────
export const internshipApi = {
  // Public open positions
  positions: (params) => axios.get('/api/internships/positions/', { params }),
  // Application (public)
  apply: (formData) => api.post('/internships/apply/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  // Admin
  applications: (params) => api.get('/internships/applications/', { params }),
  accept: (id, mentor_id) => api.post(`/internships/applications/${id}/accept/`, { mentor_id }),
  reject: (id, reason) => api.post(`/internships/applications/${id}/reject/`, { reason }),
  interns: (params) => api.get('/internships/interns/', { params }),
  intern: (id) => api.get(`/internships/interns/${id}/`),
  assignMentor: (id, mentor_id) => api.post(`/internships/interns/${id}/assign-mentor/`, { mentor_id }),
  markReady: (id) => api.post(`/internships/interns/${id}/mark-ready/`),
  convert: (id, data) => api.post(`/internships/interns/${id}/convert/`, data),
  updateRound: (id, current_round) => api.patch(`/internships/interns/${id}/round/`, { current_round }),
}

// ── Tasks ──────────────────────────────────────────────────────────────────────
export const taskApi = {
  list: (params) => api.get('/tasks/', { params }),
  create: (formData) => api.post('/tasks/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  detail: (id) => api.get(`/tasks/${id}/`),
  update: (id, formData) => api.patch(`/tasks/${id}/`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  delete: (id) => api.delete(`/tasks/${id}/`),
  updateStatus: (id, status) => api.patch(`/tasks/${id}/status/`, { status }),
  feedback: (id, data) => api.post(`/tasks/${id}/feedback/`, data),
  reminder: (id) => api.post(`/tasks/${id}/reminder/`),
  addLog: (id, data) => api.post(`/tasks/${id}/logs/`, data),
  submitInternal: (id, formData) => api.post(`/tasks/${id}/submit/`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  // Public
  getByToken: (token, params) => axios.get(`/api/tasks/submit/${token}/`, { params }),
  submitByToken: (token, formData) => axios.post(`/api/tasks/submit/${token}/`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
}

// ── Teams ──────────────────────────────────────────────────────────────────────
export const teamApi = {
  list: () => api.get('/teams/'),
  create: (data) => api.post('/teams/', data),
  detail: (id) => api.get(`/teams/${id}/`),
  update: (id, data) => api.patch(`/teams/${id}/`, data),
  delete: (id) => api.delete(`/teams/${id}/`),
  assignHead: (id, user_id) => api.post(`/teams/${id}/assign-head/`, { user_id }),
  addMember: (id, user_id) => api.post(`/teams/${id}/members/add/`, { user_id }),
  removeMember: (id, user_id) => api.delete(`/teams/${id}/members/${user_id}/remove/`),
  listMeetings: () => api.get('/teams/meetings/'),
  createMeeting: (data) => api.post('/teams/meetings/', data),
  updateMeeting: (id, data) => api.patch(`/teams/meetings/${id}/`, data),
  deleteMeeting: (id) => api.delete(`/teams/meetings/${id}/`),
}

// ── Projects ───────────────────────────────────────────────────────────────────
export const projectApi = {
  list: (params) => api.get('/projects/', { params }),
  create: (data) => api.post('/projects/', data),
  detail: (id) => api.get(`/projects/${id}/`),
  update: (id, data) => api.patch(`/projects/${id}/`, data),
  delete: (id) => api.delete(`/projects/${id}/`),
}

// ── Activity Logs ──────────────────────────────────────────────────────────────
export const logApi = {
  list: (params) => api.get('/activity-logs/', { params }),
}
