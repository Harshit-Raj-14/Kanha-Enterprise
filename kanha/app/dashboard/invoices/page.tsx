"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import ProtectedRoute from "../../components/ProtectedRoute";
import Link from "next/link";
import PrintInvoice from "../../components/PrintInvoice";
import ConfirmDialog from "../../components/ConfirmDialog";
import TableLoadingSkeleton from "../../components/TableLoadingSkeleton";
import { invoicesApi } from "../../api/invoices-api";
import { useRouter } from "next/navigation";

// Define types
interface InvoiceListItem {
  id: number;
  invoice_no: string;
  party_name: string;
  created_at: string;
  payment_mode: string;
  net_payable: number;
}

interface CompleteInvoice {
  invoice: any;
  cart: {
    cart_total: number;
    net_amount: number;
    net_payable_amount: number;
    items: any[];
  };
}

export default function InvoicesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [invoices, setInvoices] = useState<InvoiceListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedInvoice, setExpandedInvoice] = useState<number | null>(null);
  const [invoiceDetails, setInvoiceDetails] = useState<CompleteInvoice | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [selectedInvoiceForPrint, setSelectedInvoiceForPrint] = useState<CompleteInvoice | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<number | null>(null);
  const pageSize = 10;

  // Cache invalidation timestamp
  const [cacheTimestamp, setCacheTimestamp] = useState<number>(Date.now());

  // Fetch invoices function
  const fetchInvoices = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // In a real app, you'd have pagination in the API
      // For now we'll fetch all and do client-side pagination
      const response = await invoicesApi.getUserInvoices(user.id);
      
      setInvoices(response);
      setTotalPages(Math.ceil(response.length / pageSize));
    } catch (err: any) {
      setError(err.message || "Failed to load invoices");
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id, cacheTimestamp]);

  // Initial load
  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    setCacheTimestamp(Date.now());
  };

  // Toggle invoice details
  const toggleInvoiceDetails = async (invoiceId: number) => {
    if (expandedInvoice === invoiceId) {
      setExpandedInvoice(null);
      return;
    }
    
    try {
      setExpandedInvoice(invoiceId);
      
      // Check if we already have the details cached
      if (invoiceDetails?.invoice?.id === invoiceId) {
        return;
      }
      
      const details = await invoicesApi.getInvoiceById(invoiceId);
      setInvoiceDetails(details);
    } catch (err: any) {
      setError(err.message || "Failed to load invoice details");
      console.error(err);
    }
  };

  // Handle print invoice
  const handlePrintInvoice = async (invoiceId: number) => {
    try {
      const details = await invoicesApi.getInvoiceById(invoiceId);
      setSelectedInvoiceForPrint(details);
      setShowPrintModal(true);
    } catch (err: any) {
      setError(err.message || "Failed to load invoice for printing");
      console.error(err);
    }
  };

  // Show delete confirmation
  const showDeleteConfirmation = (invoiceId: number) => {
    setInvoiceToDelete(invoiceId);
    setShowDeleteConfirm(true);
  };

  // Handle delete invoice
  const handleDeleteInvoice = async () => {
    if (!invoiceToDelete) return;
    
    try {
      setLoading(true);
      await invoicesApi.deleteInvoice(invoiceToDelete);
      setShowDeleteConfirm(false);
      setInvoiceToDelete(null);
      handleRefresh();
    } catch (err: any) {
      setError(err.message || "Failed to delete invoice");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle edit invoice
  const handleEditInvoice = (invoiceId: number) => {
    // For now, we'll just alert that this feature is coming soon
    // You can implement proper routing when you have the edit page ready
    alert("Edit functionality will be implemented in a future update. Currently in development.");
    
    // Uncomment this when you have the edit route ready
    // router.push(`/dashboard/invoices/edit/${invoiceId}`);
  };

  // Calculate paginated invoices
  const paginatedInvoices = invoices.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  return (
    <ProtectedRoute>
      <div className="h-full flex flex-col">
        {/* Navbar */}
        <nav className="bg-gray-700 text-white py-4 w-full">
          <div className="px-6 flex justify-between items-center">
            <div className="text-xl font-bold">Welcome, {user?.shop_name}</div>
            <div className="flex space-x-4">
              <Link 
                href="/dashboard" 
                className="bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded-md text-sm font-medium"
              >
                Dashboard
              </Link>
              <Link 
                href="/invoices/new" 
                className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-md text-sm font-medium"
              >
                New Invoice
              </Link>
            </div>
          </div>
        </nav>
       
        {/* Main Content */}
        <div className="flex-1 px-6 py-6 bg-gray-50">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Invoices</h1>
            <button 
              onClick={handleRefresh}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-medium flex items-center"
              disabled={refreshing}
            >
              {refreshing ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Refreshing...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                  </svg>
                  Refresh
                </>
              )}
            </button>
          </div>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              <p>{error}</p>
            </div>
          )}
          
          {/* Invoices Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold">All Invoices</h2>
            </div>
            
            {loading && invoices.length === 0 ? (
              <div className="p-6">
                <TableLoadingSkeleton rows={5} columns={7} />
              </div>
            ) : invoices.length === 0 ? (
              <div className="p-6">
                <p className="text-gray-500 text-center py-8">No invoices found. Generate your first invoice to get started.</p>
                <div className="mt-4 text-center">
                  <Link 
                    href="/invoices/new"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium transition-colors"
                  >
                    Generate Invoice
                  </Link>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Details
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                        Invoice No
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Party Name
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                        Date
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                        Payment Mode
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedInvoices.map((invoice) => (
                      <React.Fragment key={invoice.id}>
                        <tr className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => toggleInvoiceDetails(invoice.id)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              {expandedInvoice === invoice.id ? (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                </svg>
                              ) : (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                                </svg>
                              )}
                            </button>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                            <div className="text-sm font-medium text-gray-900">{invoice.invoice_no}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{invoice.party_name}</div>
                            <div className="text-xs text-gray-500 md:hidden">{invoice.invoice_no}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                            <div className="text-sm text-gray-500">{formatDate(invoice.created_at)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                            <div className="text-sm text-gray-500">{invoice.payment_mode || 'N/A'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{formatCurrency(invoice.net_payable)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-3">
                              <button 
                                onClick={() => handlePrintInvoice(invoice.id)}
                                className="text-indigo-600 hover:text-indigo-900"
                                title="Print Invoice"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path>
                                </svg>
                              </button>
                              <button 
                                onClick={() => handleEditInvoice(invoice.id)}
                                className="text-blue-600 hover:text-blue-900"
                                title="Edit Invoice"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                                </svg>
                              </button>
                              <button 
                                onClick={() => showDeleteConfirmation(invoice.id)}
                                className="text-red-600 hover:text-red-900"
                                title="Delete Invoice"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                        
                        {/* Expanded Details Row */}
                        {expandedInvoice === invoice.id && invoiceDetails && (
                          <tr>
                            <td colSpan={7} className="px-6 py-4 bg-gray-50">
                              <div className="border-t border-b border-gray-200 py-4">
                                <h3 className="text-lg font-semibold mb-4">Invoice Items</h3>
                                {invoiceDetails.cart.items.length > 0 ? (
                                  <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                      <thead className="bg-gray-100">
                                        <tr>
                                          <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            S.No
                                          </th>
                                          <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            CAT No
                                          </th>
                                          <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Product Name
                                          </th>
                                          <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Lot No
                                          </th>
                                          <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            MRP
                                          </th>
                                          <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Rate
                                          </th>
                                          <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Qty
                                          </th>
                                          <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Total
                                          </th>
                                        </tr>
                                      </thead>
                                      <tbody className="bg-white divide-y divide-gray-200">
                                        {invoiceDetails.cart.items.map((item, idx) => (
                                          <tr key={idx} className="hover:bg-gray-50">
                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                                              {idx + 1}
                                            </td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                                              {item.cat_no}
                                            </td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                                              {item.product_name}
                                            </td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                                              {item.lot_no || 'N/A'}
                                            </td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                                              {formatCurrency(item.mrp)}
                                            </td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                                              {formatCurrency(item.selling_price)}
                                            </td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                                              {item.selected_quantity}
                                            </td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 font-medium">
                                              {formatCurrency(item.total)}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                      <tfoot className="bg-gray-50">
                                        <tr>
                                          <td colSpan={7} className="px-4 py-2 text-right text-sm font-medium text-gray-900">
                                            Total Amount:
                                          </td>
                                          <td className="px-4 py-2 whitespace-nowrap text-sm font-bold text-gray-900">
                                            {formatCurrency(invoiceDetails.cart.cart_total)}
                                          </td>
                                        </tr>
                                        <tr>
                                          <td colSpan={7} className="px-4 py-2 text-right text-sm font-medium text-gray-900">
                                            Net Payable:
                                          </td>
                                          <td className="px-4 py-2 whitespace-nowrap text-sm font-bold text-gray-900">
                                            {formatCurrency(invoiceDetails.cart.net_payable_amount)}
                                          </td>
                                        </tr>
                                      </tfoot>
                                    </table>
                                  </div>
                                ) : (
                                  <p className="text-gray-500">No items found for this invoice.</p>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing page <span className="font-medium">{currentPage}</span> of{" "}
                    <span className="font-medium">{totalPages}</span>
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
                    disabled={currentPage === 1}
                    className={`px-3 py-1 rounded ${
                      currentPage === 1
                        ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                        : "bg-gray-300 text-gray-700 hover:bg-gray-400"
                    }`}
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-1 rounded ${
                      currentPage === totalPages
                        ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                        : "bg-gray-300 text-gray-700 hover:bg-gray-400"
                    }`}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Print Invoice Modal */}
      {showPrintModal && selectedInvoiceForPrint && (
        <PrintInvoice
          invoiceData={{
            ...selectedInvoiceForPrint.invoice,
            user_shop_name: user?.shop_name || ""
          }}
          cartData={selectedInvoiceForPrint.cart}
          onClose={() => {
            setShowPrintModal(false);
            setSelectedInvoiceForPrint(null);
          }}
        />
      )}
      
      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Invoice"
        message="Are you sure you want to delete this invoice? This action cannot be undone and will return items to inventory."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDeleteInvoice}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setInvoiceToDelete(null);
        }}
      />
    </ProtectedRoute>
  );
}