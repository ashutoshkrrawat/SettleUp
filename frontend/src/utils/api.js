import axios from 'axios';
const api = axios.create({
    baseURL: '/api',
    timeout: 15000,
    headers: {
        'Content-type': 'application/json'
    }
})
api.interceptors.request.use( //run before going to server
    (config) => {
        const token = localStorage.getItem('token')
        if(token)
        {
            config.headers.Authorization = `Bearer ${token}`
        }
        return config;
    },
    (error) =>{
        return Promise.reject(error)
    }
)

api.interceptors.response.use( //this runs after response from server
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token and redirect if session is unauthorized/expired
      localStorage.removeItem('token');
      // Optional: window.location.href = '/auth';
    }
    return Promise.reject(error);
  }
);
export default api;