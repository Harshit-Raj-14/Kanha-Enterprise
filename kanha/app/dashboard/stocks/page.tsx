"use client";
import { useAuth } from "../../context/AuthContext";
import ProtectedRoute from "../../components/ProtectedRoute";
import { useEffect, useState } from "react";
import { itemsApi } from "../../api/items-api";
import DeleteConfirmation from "../../components/DeleteConfirmation";
import EditItemModal from "../../components/EditItemModal";

// Define the Item interface
interface Item {
  id: string;
  cat_no: string;
  product_name: string;
  lot_no?: string;
  quantity: number;
  mrp: string;
  w_rate?: string;
  selling_price?: string;
}

// Define the ItemsResponse interface
interface ItemsResponse {
  items: Item[];
}

export default function StocksPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for delete confirmation
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<Item | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // State for edit modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<Item | null>(null);
  
  // State for notifications
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const fetchItems = async () => {
      if (!user?.id) return;
      
      try {
        setLoading(true);
        const response = await itemsApi.getUserItems(user.id);
        setItems((response as ItemsResponse).items || []);
        setError(null);
      } catch (err: unknown) {
        console.error("Failed to fetch items:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load items"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, [user?.id]);
  
  // Show notification
  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };
  
  // Handle delete button click
  const handleDeleteClick = (item: Item) => {
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
      setItems(items.filter(item => item.id !== itemToDelete.id));
      
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
  const handleEditClick = (item: Item) => {
    setItemToEdit(item);
    setEditModalOpen(true);
  };
  
  // Handle save changes
  const handleSaveChanges = async (updatedItem: Item) => {
    try {
      await itemsApi.updateItem(updatedItem.id, updatedItem);
      
      // Update the item in the list
      setItems(items.map(item => 
        item.id === updatedItem.id ? updatedItem : item
      ));
      
      // Show success notification
      showNotification("Item updated successfully", "success");
      
      return Promise.resolve();
    } catch (err) {
      console.error("Failed to update item:", err);
      return Promise.reject(err);
    }
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
            <a href="/dashboard/add-stocks">
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium transition-colors">
                Add New Item
              </button>
            </a>
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
                    onClick={() => {
                      if (user?.id) {
                        itemsApi.getUserItems(user.id)
                          .then((res) => setItems((res as ItemsResponse).items || []))
                          .catch((err: unknown) => setError(err instanceof Error ? err.message : "Failed to load items"));
                      }
                    }}
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
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.quantity}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{parseFloat(item.mrp).toFixed(2)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.w_rate ? `₹${parseFloat(item.w_rate).toFixed(2)}` : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.selling_price ? `₹${parseFloat(item.selling_price).toFixed(2)}` : '-'}
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
        <EditItemModal
          isOpen={editModalOpen}
          item={itemToEdit}
          onClose={() => {
            setEditModalOpen(false);
            setItemToEdit(null);
          }}
          onSave={handleSaveChanges}
        />
      </div>
    </ProtectedRoute>
  );
}