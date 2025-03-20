"use client";
import { CartData, CartItemData, InvoiceFormData } from '../api/invoices-api';

interface CartDisplayProps {
  items: CartItemData[];
  invoiceData: InvoiceFormData;
  onRemoveItem: (index: number) => void;
  cartData: CartData;
}

const CartDisplay: React.FC<CartDisplayProps> = ({ 
  items, 
  invoiceData, 
  onRemoveItem,
  cartData
}) => {
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold">Items Added</h2>
      </div>
      
      {items.length === 0 ? (
        <div className="p-6 text-center text-gray-500">
          No items added to the cart yet
        </div>
      ) : (
        <div>
          {/* Cart Items */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    #
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cat No
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    HSN
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    MRP
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Qty
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {items.map((item, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.cat_no}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.product_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.hsn_code || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(item.mrp)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(item.selling_price)}
                      {item.addon_percent ? ` (+${item.addon_percent}%)` : ''}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.selected_quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {formatCurrency(item.total)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <button
                        onClick={() => onRemoveItem(index)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Cart Summary */}
          <div className="border-t border-gray-200 p-6">
            <div className="flex justify-end">
              <div className="w-full max-w-md">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Subtotal:</span>
                    <span className="font-medium">{formatCurrency(cartData.cart_total)}</span>
                  </div>
                  
                  {invoiceData.adjustment_percent !== 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        Adjustment ({invoiceData.adjustment_percent}%):
                      </span>
                      <span className="font-medium">
                        {formatCurrency(cartData.cart_total * (invoiceData.adjustment_percent || 0) / 100)}
                      </span>
                    </div>
                  )}
                  
                  {invoiceData.cgst > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">CGST ({invoiceData.cgst}%):</span>
                      <span className="font-medium">
                        {formatCurrency(cartData.cart_total * (invoiceData.cgst || 0) / 100)}
                      </span>
                    </div>
                  )}
                  
                  {invoiceData.sgst > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">SGST ({invoiceData.sgst}%):</span>
                      <span className="font-medium">
                        {formatCurrency(cartData.cart_total * (invoiceData.sgst || 0) / 100)}
                      </span>
                    </div>
                  )}
                  
                  {invoiceData.igst > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">IGST ({invoiceData.igst}%):</span>
                      <span className="font-medium">
                        {formatCurrency(cartData.cart_total * (invoiceData.igst || 0) / 100)}
                      </span>
                    </div>
                  )}
                  
                  <div className="border-t border-gray-200 pt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold">Net Amount:</span>
                      <span className="text-lg font-semibold">{formatCurrency(cartData.net_amount)}</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Round Off:</span>
                    <span className="font-medium">
                      {formatCurrency(cartData.net_payable_amount - cartData.net_amount)}
                    </span>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xl font-bold">Net Payable:</span>
                      <span className="text-xl font-bold">{formatCurrency(cartData.net_payable_amount)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartDisplay;