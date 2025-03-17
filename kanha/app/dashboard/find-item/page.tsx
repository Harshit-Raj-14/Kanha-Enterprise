"use client";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import ProtectedRoute from "../../components/ProtectedRoute";
import { itemsApi } from "../../api/items-api";
import { toast } from "react-hot-toast";
import DeleteConfirmation from "../../components/DeleteConfirmation";
import EditItemModal from "../../components/EditItemModal";

// Updated StockItem interface to match the Item interface used in EditItemModal
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

// Define an extended interface for items with additional fields from API
interface StockItem extends Item {
  user_id: number;
  created_at?: string;
}

export default function FindItemPage() {
  const { user } = useAuth();
  const [searchType, setSearchType] = useState<'cat_no' | 'product_name'>('cat_no');
  const [searchTerm, setSearchTerm] = useState('');
  const [items, setItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  
  // State for delete confirmation
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<StockItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // State for edit modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<Item | null>(null);
  
  // State for notifications
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchTerm.trim()) {
      toast.error('Please enter a search term');
      return;
    }
    
    if (!user || !user.id) {
      toast.error('User information is missing');
      return;
    }
    
    try {
      setLoading(true);
      setSearched(true);
      
      console.log(`Starting search with userId=${user.id}, searchType=${searchType}, searchTerm=${searchTerm}`);
      
      const result = await itemsApi.searchItems(
        Number(user.id), 
        searchType, 
        searchTerm.trim()
      );
      
      console.log("Search results:", result);
      
      // Map the API results to our interface - ensuring proper types
      const formattedItems = (result.items || []).map((item: any) => ({
        id: String(item.id),
        user_id: Number(item.user_id),
        cat_no: item.cat_no,
        product_name: item.product_name,
        lot_no: item.lot_no || undefined,
        hsn_no: item.hsn_no || undefined,
        quantity: Number(item.quantity),
        w_rate: item.w_rate !== null ? Number(item.w_rate) : undefined,
        selling_price: item.selling_price !== null ? Number(item.selling_price) : undefined,
        mrp: Number(item.mrp),
        created_at: item.created_at
      }));
      
      console.log("Formatted items:", formattedItems);
      
      setItems(formattedItems);
      
      if (!result.items || result.items.length === 0) {
        toast.error('No items found matching your search criteria');
      }
    } catch (error: any) {
      console.error('Search error:', error);
      toast.error(error.message || 'Error searching for items');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  // Format currency values
  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) return '-';
    return `₹${Number(value).toFixed(2)}`;
  };
  
  // Show notification
  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };
  
  // Handle delete button click
  const handleDeleteClick = (item: StockItem) => {
    console.log("Delete button clicked for item:", item);
    setItemToDelete(item);
    setDeleteModalOpen(true);
  };
  
  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!itemToDelete) {
      console.error("No item to delete");
      return;
    }
    
    console.log("Confirming delete for item:", itemToDelete);
    
    setIsDeleting(true);
    try {
      await itemsApi.deleteItem(itemToDelete.id);
      
      // Remove item from the list
      setItems(prevItems => prevItems.filter(item => item.id !== itemToDelete.id));
      
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
    console.log("Edit button clicked for item:", item);
    // Create a copy of the item to avoid reference issues, omitting user_id and created_at
    const { user_id, created_at, ...itemForEdit } = item;
    setItemToEdit(itemForEdit);
    setEditModalOpen(true);
  };
  
  // Handle save changes
  const handleSaveChanges = async (updatedItem: Item) => {
    console.log("Saving changes for item:", updatedItem);
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
      setItems(prevItems => prevItems.map(item => 
        item.id === updatedItem.id ? { ...item, ...updatedItem } : item
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
          <h1 className="text-2xl font-bold mb-6">Find Stocks</h1>
          
          {/* Notification */}
          {notification && (
            <div className={`mb-4 p-3 rounded-md ${notification.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {notification.message}
            </div>
          )}
         
          {/* Search Section */}
          <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold">Search Items</h2>
            </div>
            <div className="p-6">
              <form onSubmit={handleSearch} className="space-y-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Search By
                    </label>
                    <select
                      value={searchType}
                      onChange={(e) => setSearchType(e.target.value as 'cat_no' | 'product_name')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="cat_no">Catalog Number</option>
                      <option value="product_name">Product Name</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Search Term
                    </label>
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder={searchType === 'cat_no' ? "Enter catalog number..." : "Enter product name..."}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full md:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                    >
                      {loading ? 'Searching...' : 'Search'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
         
          {/* Results Section */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold">Search Results</h2>
            </div>
            <div className="overflow-x-auto">
              {loading ? (
                <div className="text-center py-10">
                  <div className="spinner"></div>
                  <p className="mt-2 text-gray-600">Searching items...</p>
                </div>
              ) : items.length > 0 ? (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Catalog No
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product Name
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Lot No
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        HSN No
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quantity
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        W Rate
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Selling Price
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        MRP
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {items.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.cat_no}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.product_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.lot_no || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.hsn_no || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatCurrency(item.w_rate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatCurrency(item.selling_price)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatCurrency(item.mrp)}
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
              ) : searched ? (
                <div className="text-center py-10">
                  <p className="text-gray-500">No items found matching your search criteria.</p>
                </div>
              ) : (
                <div className="text-center py-10">
                  <p className="text-gray-500">Search for items to see results here.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
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
      )}
      
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
      
      {/* CSS for spinner */}
      <style jsx>{`
        .spinner {
          border: 3px solid rgba(0, 0, 0, 0.1);
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border-left-color: #4f46e5;
          animation: spin 1s linear infinite;
          margin: 0 auto;
        }
        
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </ProtectedRoute>
  );
}