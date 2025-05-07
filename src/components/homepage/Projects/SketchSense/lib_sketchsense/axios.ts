import axios from "axios";

const baseURL = import.meta.env.VITE_SKETCHSENSE_BASE || "";

const api = axios.create({
  baseURL,
  withCredentials: true, // to send cookies
});

export default api;
