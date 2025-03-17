"use client";
import { useAuth } from "../../context/AuthContext";
import ProtectedRoute from "../../components/ProtectedRoute";
import { useEffect, useState, useCallback } from "react";
import { itemsApi } from "../../api/items-api";
import DeleteConfirmation from "../../components/DeleteConfirmation";
import EditItemModal from "../../components/EditItemModal";

// Define the Item interface with updated schema - matches EditItemModal interface
interface Item {
  id: string;
  cat_no: string;
  product_name: string;
  lot_no?: string;
  hsn_no?: string;
  quantity: number;
  mrp: number;
  w_rate?: number;
  selling_price?: number;
}

// Define extended interface for API data
interface StockItem extends Item {
  user_id: number;
  created_at?: string;
}

// Define the ItemsResponse interface
interface ItemsResponse {
  items: StockItem[];
}

export default function StocksPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for delete confirmation
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<StockItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // State for edit modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<Item | null>(null);
  
  // State for notifications
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Show notification
  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  // Fetch items function with caching
  const fetchItems = useCallback(async (forceRefresh = false) => {
    if (!user?.id) return;
    
    // Check for cached data if not forcing refresh
    if (!forceRefresh) {
      const cachedData = localStorage.getItem('stockItemsCache');
      const cachedTimestamp = localStorage.getItem('stockItemsCacheTime');
      
      // Use cache if it exists and is less than 30 minutes old
      if (cachedData && cachedTimestamp) {
        const cacheAge = Date.now() - parseInt(cachedTimestamp);
        if (cacheAge < 30 * 60 * 1000) { // 30 minutes
          setItems(JSON.parse(cachedData));
          setLoading(false);
          return;
        }
      }
    }
    
    try {
      setLoading(true);
      const response = await itemsApi.getUserItems(user.id);
      const responseItems = (response as ItemsResponse).items || [];
      
      // Save to cache
      localStorage.setItem('stockItemsCache', JSON.stringify(responseItems));
      localStorage.setItem('stockItemsCacheTime', Date.now().toString());
      
      setItems(responseItems);
      setError(null);
    } catch (err: unknown) {
      console.error("Failed to fetch items:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load items"
      );
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Handle refresh button click
  const handleRefresh = () => {
    fetchItems(true); // true means force refresh (ignore cache)
    showNotification("Refreshing inventory data...", "success");
  };

  useEffect(() => {
    fetchItems(false); // false means use cache if available
  }, [fetchItems]);
  
  // Handle delete button click
  const handleDeleteClick = (item: StockItem) => {
    setItemToDelete(item);
    setDeleteModalOpen(true);
  };
  
  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    
    setIsDeleting(true);
    try {
      await itemsApi.deleteItem(itemToDelete.id);
      
      // Remove item from the list
      const updatedItems = items.filter(item => item.id !== itemToDelete.id);
      setItems(updatedItems);
      
      // Update cache
      localStorage.setItem('stockItemsCache', JSON.stringify(updatedItems));
      
      // Show success notification
      showNotification("Item deleted successfully", "success");
      
      // Close modal
      setDeleteModalOpen(false);
      setItemToDelete(null);
    } catch (err) {
      console.error("Failed to delete item:", err);
      showNotification(
        err instanceof Error ? err.message : "Failed to delete item", 
        "error"
      );
    } finally {
      setIsDeleting(false);
    }
  };
  
  // Handle edit button click
  const handleEditClick = (item: StockItem) => {
    // Create a copy of the item to avoid reference issues, omitting user_id and created_at
    const { user_id, created_at, ...itemForEdit } = item;
    setItemToEdit(itemForEdit);
    setEditModalOpen(true);
  };
  
  // Handle save changes
  const handleSaveChanges = async (updatedItem: Item) => {
    try {
      // We need to add the user_id back from the original item for the API call
      const itemToUpdate = items.find(item => item.id === updatedItem.id);
      if (!itemToUpdate) {
        throw new Error("Item not found in the current list");
      }
      
      // Merge the updated fields with the required user_id
      const fullUpdatedItem = {
        ...updatedItem,
        user_id: itemToUpdate.user_id
      };
      
      await itemsApi.updateItem(updatedItem.id, fullUpdatedItem);
      
      // Update the item in the list
      const updatedItems = items.map(item => 
        item.id === updatedItem.id ? { ...item, ...updatedItem } : item
      );
      setItems(updatedItems);
      
      // Update cache
      localStorage.setItem('stockItemsCache', JSON.stringify(updatedItems));
      
      // Show success notification
      showNotification("Item updated successfully", "success");
      
      return Promise.resolve();
    } catch (err) {
      console.error("Failed to update item:", err);
      return Promise.reject(err);
    }
  };

  // Format currency values
  const formatCurrency = (value: number | string | null | undefined) => {
    if (value === null || value === undefined) return '-';
    // Convert to number if it's a string
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    // Check if it's a valid number
    if (isNaN(numValue)) return '-';
    return `₹${numValue.toFixed(2)}`;
  };

  return (
    <ProtectedRoute>
      <div className="h-full flex flex-col">
        {/* Navbar */}
        <nav className="bg-gray-700 text-white py-4 w-full">
          <div className="px-6 text-xl font-bold">Welcome, {user?.shop_name}</div>
        </nav>
       
        {/* Main Content */}
        <div className="flex-1 px-6 py-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Stocks</h1>
            <div className="flex space-x-3">
              <button 
                onClick={handleRefresh}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-medium transition-colors flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
              <a href="/dashboard/add-stocks">
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium transition-colors flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add New Item
                </button>
              </a>
            </div>
          </div>
         
          {/* Notification */}
          {notification && (
            <div className={`mb-4 p-3 rounded-md ${notification.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {notification.message}
            </div>
          )}
         
          {/* Items Table Section */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold">Inventory Items</h2>
            </div>
            
            <div className="p-6">
              {loading ? (
                <div className="text-center py-8">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
                  <p className="mt-2 text-gray-600">Loading items...</p>
                </div>
              ) : error ? (
                <div className="text-center py-8 text-red-500">
                  <p>{error}</p>
                  <button 
                    onClick={() => fetchItems(true)}
                    className="mt-2 text-blue-600 hover:underline"
                  >
                    Try again
                  </button>
                </div>
              ) : items.length === 0 ? (
                <div>
                  <p className="text-gray-500 text-center py-8">No items found. Add your first item to get started.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Catalog No.</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Name</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lot No.</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">HSN No.</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">MRP</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">W. Rate</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Selling Price</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {items.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.cat_no}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.product_name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.lot_no || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.hsn_no || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.quantity}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(item.mrp)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatCurrency(item.w_rate)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatCurrency(item.selling_price)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button 
                              className="text-indigo-600 hover:text-indigo-900 mr-3"
                              onClick={() => handleEditClick(item)}
                            >
                              Edit
                            </button>
                            <button 
                              className="text-red-600 hover:text-red-900"
                              onClick={() => handleDeleteClick(item)}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Delete Confirmation Modal */}
        <DeleteConfirmation
          isOpen={deleteModalOpen}
          itemName={itemToDelete?.product_name || ''}
          onClose={() => {
            setDeleteModalOpen(false);
            setItemToDelete(null);
          }}
          onConfirm={handleDeleteConfirm}
          isDeleting={isDeleting}
        />
        
        {/* Edit Item Modal */}
        {editModalOpen && itemToEdit && (
          <EditItemModal
            isOpen={editModalOpen}
            item={itemToEdit}
            onClose={() => {
              setEditModalOpen(false);
              setItemToEdit(null);
            }}
            onSave={handleSaveChanges}
          />
        )}
      </div>
    </ProtectedRoute>
  );
}