import axios from "axios";

//one axios instance pointed at your backend
const api = axios.create({
  baseURL: "http://localhost:5000/api",
});

//automatically attach the login token (if we have one) to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;