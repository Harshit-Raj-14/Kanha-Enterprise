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

// Define the ItemsResponse interface with pagination
interface ItemsResponse {
  items: StockItem[];
  pagination: {
    totalItems: number;
    itemsPerPage: number;
    currentPage: number;
    totalPages: number;
  };
}

export default function StocksPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
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

  // Fetch items function (no caching for pagination version)
  const fetchItems = useCallback(async () => {
  if (!user?.id) return;
  
  try {
    setLoading(true);
    const response = await itemsApi.getUserItemsPaginated(
      user.id, 
      currentPage, 
      itemsPerPage
    );
    
    const responseData = response as any;
    setItems(responseData.items || []);
    
    // Check if pagination data exists before setting state
    if (responseData.pagination) {
      setTotalPages(responseData.pagination.totalPages || 1);
      setTotalItems(responseData.pagination.totalItems || 0);
    } else {
      // Fallback values if pagination data is missing
      console.warn('Pagination data is missing from the response');
      setTotalPages(1);
      setTotalItems(responseData.items?.length || 0);
    }
    
    setError(null);
  } catch (err: unknown) {
    console.error("Failed to fetch items:", err);
    setError(
      err instanceof Error ? err.message : "Failed to load items"
    );
  } finally {
    setLoading(false);
  }
}, [user?.id, currentPage, itemsPerPage]);

  // Handle page change
  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  // Handle items per page change
  const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newItemsPerPage = parseInt(e.target.value);
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page
  };

  useEffect(() => {
    fetchItems();
  }, [fetchItems, currentPage, itemsPerPage]);
  
  // Handle refresh button click
  const handleRefresh = () => {
    fetchItems();
    showNotification("Refreshing inventory data...", "success");
  };
  
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
      
      // After deletion, refresh the current page
      await fetchItems();
      
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
      
      // Refresh the current page to show updated data
      await fetchItems();
      
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

  // Generate pagination controls
  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pageButtons = [];
    const maxVisiblePages = 5;
    
    // Add previous button
    pageButtons.push(
      <button
        key="prev"
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`px-3 py-1 rounded ${
          currentPage === 1 
            ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
            : 'bg-white text-blue-600 hover:bg-blue-50'
        }`}
      >
        &laquo;
      </button>
    );

    // Calculate range of visible page buttons
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // Add first page and ellipsis if needed
    if (startPage > 1) {
      pageButtons.push(
        <button
          key="1"
          onClick={() => handlePageChange(1)}
          className="px-3 py-1 rounded bg-white text-blue-600 hover:bg-blue-50"
        >
          1
        </button>
      );
      if (startPage > 2) {
        pageButtons.push(
          <span key="start-ellipsis" className="px-2 py-1">
            ...
          </span>
        );
      }
    }

    // Add visible page buttons
    for (let i = startPage; i <= endPage; i++) {
      pageButtons.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`px-3 py-1 rounded ${
            currentPage === i
              ? 'bg-blue-600 text-white'
              : 'bg-white text-blue-600 hover:bg-blue-50'
          }`}
        >
          {i}
        </button>
      );
    }

    // Add last page and ellipsis if needed
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pageButtons.push(
          <span key="end-ellipsis" className="px-2 py-1">
            ...
          </span>
        );
      }
      pageButtons.push(
        <button
          key={totalPages}
          onClick={() => handlePageChange(totalPages)}
          className="px-3 py-1 rounded bg-white text-blue-600 hover:bg-blue-50"
        >
          {totalPages}
        </button>
      );
    }

    // Add next button
    pageButtons.push(
      <button
        key="next"
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`px-3 py-1 rounded ${
          currentPage === totalPages
            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
            : 'bg-white text-blue-600 hover:bg-blue-50'
        }`}
      >
        &raquo;
      </button>
    );

    return (
      <div className="flex items-center justify-between mt-6">
        <div className="text-sm text-gray-700">
          Showing <span className="font-medium">{items.length}</span> of{' '}
          <span className="font-medium">{totalItems}</span> items
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-700">Items per page:</span>
          <select
            value={itemsPerPage}
            onChange={handleItemsPerPageChange}
            className="border rounded px-2 py-1 text-sm"
          >
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
        </div>
        
        <div className="flex space-x-1">{pageButtons}</div>
      </div>
    );
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
              <p className="text-sm text-gray-500">
                Page {currentPage} of {totalPages} ({totalItems} total items)
              </p>
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
                    onClick={handleRefresh}
                    className="mt-2 text-blue-600 hover:underline"
                  >
                    Try again
                  </button>
                </div>
              ) : items.length === 0 ? (
                <div>
                  <p className="text-gray-500 text-center py-8">
                    {totalItems === 0 
                      ? "No items found. Add your first item to get started."
                      : "No items found on this page."}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Catalog No.
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Product Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Lot No.
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          HSN No.
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Quantity
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          MRP
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          W. Rate
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Selling Price
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
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
              
              {/* Pagination Controls */}
              {!loading && !error && renderPagination()}
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