// src/services/api.js
import axios from "axios";

const baseURL = process.env.REACT_APP_API_URL || "http://localhost:4000";

export const api = axios.create({
  baseURL,
  withCredentials: true, // treba zbog cookie auth-a
});
