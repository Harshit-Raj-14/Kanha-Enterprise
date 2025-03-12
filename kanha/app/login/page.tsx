"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { authService } from "../api/api";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { login: authLogin } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    
    try {
      // Call the backend API through our service
      const response = await authService.login(email, password);
      
      // Save user info to auth context
      authLogin(response.user);
      
      // Redirect to dashboard
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Login failed. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      {/* Sticky Navbar - now greyish with bold text */}
      <nav className="fixed top-0 w-full bg-gray-700 text-white py-4 text-center text-lg font-bold shadow-md z-10">
        Stock Management System
      </nav>
     
      {/* Main content area - adjusted to position login form slightly above center */}
      <div className="flex flex-col items-center min-h-screen pt-16">
        {/* Logo */}
        <img src="/kanha-logo.png" alt="Kanha Enterprises" className="h-34 my-8" />
       
        {/* Login Form - now wider and positioned to straddle the center line */}
        <div className="bg-white p-8 rounded-lg shadow-lg w-112 mx-4">
          <h2 className="text-2xl font-semibold text-center mb-6">Login</h2>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}
          
          <form onSubmit={handleLogin} className="flex flex-col">
            <input
              type="email"
              placeholder="Email"
              className="p-3 border rounded mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
            <input
              type="password"
              placeholder="Password"
              className="p-3 border rounded mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />
            <button
              type="submit"
              className={`bg-blue-600 text-white p-3 rounded-full font-medium hover:bg-blue-700 transition-colors ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
              disabled={isLoading}
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}