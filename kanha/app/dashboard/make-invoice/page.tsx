"use client";
import { useState, useEffect } from 'react';
import { useAuth } from "../../context/AuthContext";
import ProtectedRoute from "../../components/ProtectedRoute";
import InvoiceForm from '../../components/InvoiceForm';
import ItemForm from '../../components/ItemForm';
import CartDisplay from '../../components/CartDisplay';
import PrintInvoice from '../../components/PrintInvoice';
import { InvoiceFormData, CartItemData, CartData, invoicesApi, invoiceService } from '../../api/invoices-api';

export default function MakeInvoicesPage() {
  const { user } = useAuth();
  
  const [invoiceData, setInvoiceData] = useState<InvoiceFormData>({
    invoice_no: '',
    party_name: '',
    order_no: '',
    doctor_name: '',
    patient_name: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    mobile_no: undefined,
    gstin: '',
    road_permit: '',
    payment_mode: 'Cash',
    adjustment_percent: 0,
    cgst: 9,
    sgst: 9,
    igst: 0,
  });
  
  const [cartItems, setCartItems] = useState<CartItemData[]>([]);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Calculate cart total and other values whenever cart items or invoice data changes
  const [cartData, setCartData] = useState<CartData>({
    cart_total: 0,
    net_amount: 0,
    net_payable_amount: 0,
    items: []
  });
  
  useEffect(() => {
    // Calculate cart totals
    const calculateCart = () => {
      // Sum up all item totals
      const cartTotal = cartItems.reduce((sum, item) => sum + item.total, 0);
      
      // Calculate tax and adjustment
      const adjustmentAmount = cartTotal * (invoiceData.adjustment_percent || 0) / 100;
      const cgstAmount = cartTotal * (invoiceData.cgst || 0) / 100;
      const sgstAmount = cartTotal * (invoiceData.sgst || 0) / 100;
      const igstAmount = cartTotal * (invoiceData.igst || 0) / 100;
      
      // Calculate net amount
      const netAmount = cartTotal + adjustmentAmount + cgstAmount + sgstAmount + igstAmount;
      
      // Round off to nearest whole number for net payable
      const netPayableAmount = Math.round(netAmount);
      
      setCartData({
        cart_total: cartTotal,
        net_amount: netAmount,
        net_payable_amount: netPayableAmount,
        items: cartItems
      });
    };
    
    calculateCart();
  }, [cartItems, invoiceData]);
  
  // Handle invoice form data changes
  const handleInvoiceFormChange = (data: InvoiceFormData) => {
    setInvoiceData(data);
  };
  
  // Add item to cart
  const handleAddToCart = (item: CartItemData) => {
    setCartItems(prev => [...prev, item]);
  };
  
  // Remove item from cart
  const handleRemoveItem = (index: number) => {
    setCartItems(prev => prev.filter((_, i) => i !== index));
  };
  
  // Generate invoice
  const handleGenerateInvoice = async () => {
    // Validate form data
    if (!invoiceData.party_name) {
      setError('Party name is required');
      return;
    }
    
    if (cartItems.length === 0) {
      setError('Add at least one item to the cart');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Prepare data for submission
      const invoiceSubmitData = {
        invoice: {
          ...invoiceData,
          user_id: user?.id
        },
        cart: cartData
      };
      
      // Submit invoice data
      const result = await invoiceService.createInvoice(invoiceSubmitData);
      
      // Show print invoice modal
      setShowPrintModal(true);
    } catch (err: any) {
      setError(err.message || 'Failed to generate invoice');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle closing print modal and reset form
  const handleClosePrintModal = () => {
    setShowPrintModal(false);
    
    // Reset form for new invoice
    setCartItems([]);
    setInvoiceData(prev => ({
      ...prev,
      party_name: '',
      order_no: '',
      doctor_name: '',
      patient_name: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
      mobile_no: undefined,
      gstin: '',
      road_permit: '',
      // Keep the tax rates the same
    }));
    
    // Fetch new invoice number
    invoiceService.getNextInvoiceNumber().then(invoiceNo => {
      setInvoiceData(prev => ({ ...prev, invoice_no: invoiceNo }));
    });
  };
  
  return (
    <ProtectedRoute>
      <div className="h-full flex flex-col min-h-screen bg-gray-50">
        {/* Navbar */}
        <nav className="bg-gray-700 text-white py-4 w-full">
          <div className="px-6 text-xl font-bold">Welcome, {user?.shop_name}</div>
        </nav>
        
        {/* Main Content */}
        <div className="flex-1 px-6 py-6 max-w-6xl mx-auto w-full">
          <h1 className="text-2xl font-bold mb-6">Sales Invoice</h1>
          
          {/* Invoice Form */}
          <InvoiceForm onFormChange={handleInvoiceFormChange} />
          
          {/* Item Form */}
          <ItemForm onAddToCart={handleAddToCart} />
          
          {/* Cart Display */}
          <CartDisplay 
            items={cartItems} 
            invoiceData={invoiceData} 
            onRemoveItem={handleRemoveItem}
            cartData={cartData}
          />
          
          {/* Error Message */}
          {error && (
            <div className="mt-4 p-3 bg-red-100 text-red-700 rounded">
              {error}
            </div>
          )}
          
          {/* Generate Invoice Button */}
          <div className="mt-6 text-center">
            <button
              onClick={handleGenerateInvoice}
              disabled={isSubmitting || cartItems.length === 0}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:bg-blue-400 text-lg"
            >
              {isSubmitting ? 'Processing...' : 'Generate Invoice'}
            </button>
          </div>
        </div>
        
        {/* Print Invoice Modal */}
        {showPrintModal && (
          <PrintInvoice 
            invoiceData={{...invoiceData, user_shop_name: user?.shop_name}}
            cartData={cartData}
            onClose={handleClosePrintModal}
          />
        )}
      </div>
    </ProtectedRoute>
  );
}