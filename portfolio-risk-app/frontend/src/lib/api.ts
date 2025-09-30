import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = localStorage.getItem('refresh_token')
        if (refreshToken) {
          const response = await axios.post(`${API_URL}/api/auth/refresh`, {
            refresh_token: refreshToken,
          })

          const { access_token, refresh_token } = response.data
          localStorage.setItem('access_token', access_token)
          localStorage.setItem('refresh_token', refresh_token)

          originalRequest.headers.Authorization = `Bearer ${access_token}`
          return axiosInstance(originalRequest)
        }
      } catch (refreshError) {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        window.location.href = '/login'
      }
    }

    return Promise.reject(error)
  }
)

export const api = {
  async login(username: string, password: string) {
    const formData = new FormData()
    formData.append('username', username)
    formData.append('password', password)

    const response = await axios.post(`${API_URL}/api/auth/login`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  async register(userData: {
    username: string
    email: string
    full_name: string
    phone_number: string
    password: string
  }) {
    const response = await axios.post(`${API_URL}/api/v1/auth/register-step1`, userData)
    return response.data
  },

  async getCurrentUser() {
    const response = await axiosInstance.get('/api/users/me')
    return response.data
  },

  async updateUser(userData: any) {
    const response = await axiosInstance.put('/api/users/me', userData)
    return response.data
  },

  async startAssessment() {
    const response = await axiosInstance.post('/api/assessment/start')
    return response.data
  },

  async submitAssessment(responses: any) {
    const response = await axiosInstance.post('/api/assessment/submit', { responses })
    return response.data
  },

  async getAssessmentHistory() {
    const response = await axiosInstance.get('/api/assessment/history')
    return response.data
  },

  async generatePortfolio(assessmentId: number) {
    const response = await axiosInstance.post('/api/portfolio/generate', {
      assessment_id: assessmentId,
    })
    return response.data
  },

  async getActivePortfolio() {
    const response = await axiosInstance.get('/api/portfolio/active')
    return response.data
  },

  async getPortfolioHistory() {
    const response = await axiosInstance.get('/api/portfolio/history')
    return response.data
  },
}

export default axiosInstance