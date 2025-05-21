//login.tsx
 
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
 
const LoginLegallens: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
 
  const LEGALLENS_API_BASE = import.meta.env.VITE_LEGALLENS_BASE;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
 
    try {
      // Make sure the URL matches your Flask backend
      const response = await axios.post(`${LEGALLENS_API_BASE}/login`, {
        username,
        password
      });
     
      console.log("Login response:", response.data); // Debug response
     
      if (response.data.success) {
        // Store login status in sessionStorage
        sessionStorage.setItem("isLegalLensLoggedIn", "true");
        // Redirect to home page
        navigate("/legallens");
      } else {
        setError("Login failed. Please check your credentials.");
      }
    } catch (err: unknown) {
      console.error("Login error:", err); // Debug error
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("Login failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };
 
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="max-w-md w-full p-6 bg-gray-800 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-center text-white mb-6">Login</h2>
       
        {error && (
          <div className="bg-red-600 border border-red-700 text-white px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
       
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-200 mb-2" htmlFor="username">
              Username
            </label>
            <input
              id="username"
              type="text"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
         
          <div className="mb-6">
            <label className="block text-gray-200 mb-2" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
         
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
};
 
export default LoginLegallens;
 
 