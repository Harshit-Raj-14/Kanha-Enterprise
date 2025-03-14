"use client";
import { useAuth } from "../../context/AuthContext";
import ProtectedRoute from "../../components/ProtectedRoute";

export default function StocksEntryPage() {
  const { user } = useAuth();
  return (
    <ProtectedRoute>
      <div className="h-full flex flex-col">
        {/* Navbar */}
        <nav className="bg-gray-700 text-white py-4 w-full">
          <div className="px-6 text-xl font-bold">Welcome, {user?.shop_name}</div>
        </nav>
        
        {/* Main Content */}
        <div className="flex-1 px-6 py-6">
          <h1 className="text-2xl font-bold mb-6">Stocks</h1>
         

         
          {/* Recent Items Section */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold">Recent Items</h2>
            </div>
            <div className="p-6">
              <p className="text-gray-500 text-center py-8">No items found. Add your first item to get started.</p>
             
              <div className="mt-4 text-center">
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium transition-colors">
                  Add New Item
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}