"use client"
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { logout } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
 
  // Function to determine if a nav item is active
  const isActive = (path: string) => {
    if (path === "/dashboard" && pathname === "/dashboard") {
      return true;
    }
    return pathname !== "/dashboard" && pathname.startsWith(path);
  };
  
  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="w-72 bg-white text-gray-800 border-r border-gray-200 p-6 shadow-sm overflow-hidden flex flex-col">
        <Link 
          href="/dashboard" 
          className="text-2xl font-bold text-center block mb-8"
        >
          Dashboard
        </Link>

        {/* Main Navigation */}
        <nav className="space-y-4">
          <Link
            href="/dashboard/stocks"
            className={`block p-3 text-lg font-medium transition-colors -mx-6 px-6 ${
              isActive("/dashboard/stocks")
                ? "bg-blue-50 text-blue-700 border-l-4 border-blue-700"
                : "hover:bg-gray-50"
            }`}
          >
            📦 Stocks
          </Link>

          <Link
            href="/dashboard/add-stocks"
            className={`block p-3 text-lg font-medium transition-colors -mx-6 px-6 ${
              isActive("/dashboard/add-stocks")
                ? "bg-blue-50 text-blue-700 border-l-4 border-blue-700"
                : "hover:bg-gray-50"
            }`}
          >
            ➕ Add Items
          </Link>

          <Link
            href="/dashboard/find-item"
            className={`block p-3 text-lg font-medium transition-colors -mx-6 px-6 ${
              isActive("/dashboard/find-item")
                ? "bg-blue-50 text-blue-700 border-l-4 border-blue-700"
                : "hover:bg-gray-50"
            }`}
          >
            🔍 Find Item
          </Link>

          <Link
            href="/dashboard/invoices"
            className={`block p-3 text-lg font-medium transition-colors -mx-6 px-6 ${
              isActive("/dashboard/invoices")
                ? "bg-blue-50 text-blue-700 border-l-4 border-blue-700"
                : "hover:bg-gray-50"
            }`}
          >
            🧾 Invoices
          </Link>

          <Link
            href="/dashboard/make-invoice"
            className={`block p-3 text-lg font-medium transition-colors -mx-6 px-6 ${
              isActive("/dashboard/make-invoice")
                ? "bg-blue-50 text-blue-700 border-l-4 border-blue-700"
                : "hover:bg-gray-50"
            }`}
          >
            📝 Make Invoice
          </Link>
        </nav>
       
        {/* User Navigation - pushed to bottom */}
        <nav className="mt-auto pt-4 border-t border-gray-200 space-y-4">
          <Link
            href="/dashboard/profile"
            className={`block p-3 text-lg font-medium transition-colors -mx-6 px-6 ${
              isActive("/dashboard/profile")
                ? "bg-blue-50 text-blue-700 border-l-4 border-blue-700"
                : "hover:bg-gray-50"
            }`}
          >
            👤 Profile
          </Link>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setShowLogoutConfirm(true);
            }}
            className="block p-3 text-lg font-medium transition-colors -mx-6 px-6 hover:bg-red-50 hover:text-red-600 cursor-pointer"
          >
            🚪 Logout
          </a>
         
          {/* Logout Confirmation Modal */}
          {showLogoutConfirm && (
            <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
                <h3 className="text-xl font-medium mb-4">Confirm Logout</h3>
                <p className="mb-6">Are you sure you want to log out of your account?</p>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowLogoutConfirm(false)}
                    className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      logout();
                      setShowLogoutConfirm(false);
                    }}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition-colors"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          )}
        </nav>
      </aside>
      {/* Main Content - removed p-8 and bg-white */}
      <main className="flex-1 overflow-auto bg-gray-100">{children}</main>
    </div>
  );
}