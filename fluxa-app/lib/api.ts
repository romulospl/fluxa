import axios from 'axios'

// Create a default axios instance for the application
const api = axios.create({
  // the base URL will default to the current domain in the browser
  // and will use relative paths for API calls.
})

// Optional: You can add interceptors here later if needed
// api.interceptors.response.use(
//   response => response,
//   error => Promise.reject(error)
// )

export default api
