"use client";
import { useEffect, useRef } from 'react';
import { InvoiceFormData, CartData } from '../api/invoices-api';

interface PrintInvoiceProps {
  invoiceData: InvoiceFormData;
  cartData: CartData;
  onClose: () => void;
}

const PrintInvoice: React.FC<PrintInvoiceProps> = ({ invoiceData, cartData, onClose }) => {
  const printRef = useRef<HTMLDivElement>(null);

  // Auto-print when component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      handlePrint();
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to print the invoice');
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice ${invoiceData.invoice_no}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
            .invoice-container { max-width: 800px; margin: 0 auto; }
            .invoice-header { display: flex; justify-content: space-between; margin-bottom: 20px; }
            .company-info { font-weight: bold; font-size: 1.2em; }
            .invoice-title { text-align: center; font-size: 1.5em; font-weight: bold; margin: 20px 0; }
            .invoice-details { display: flex; justify-content: space-between; margin-bottom: 20px; }
            .invoice-details-column { width: 48%; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .summary { margin-top: 20px; text-align: right; }
            .amount-in-words { margin: 20px 0; border-top: 1px solid #ddd; padding-top: 10px; }
            .terms { margin: 20px 0; font-size: 0.9em; }
            .signature { display: flex; justify-content: space-between; margin-top: 50px; }
            .signature-column { width: 48%; text-align: center; }
            @media print {
              button { display: none !important; }
              @page { margin: 0.5cm; }
            }
          </style>
        </head>
        <body>
          ${content.innerHTML}
          <div style="text-align: center; margin-top: 20px;">
            <button onclick="window.print();" style="padding: 10px 20px;">Print Invoice</button>
            <button onclick="window.close();" style="padding: 10px 20px; margin-left: 10px;">Close</button>
          </div>
          <script>
            window.onafterprint = function() {
              // Optional: close after printing
              // window.close();
            };
          </script>
        </body>
      </html>
    `);
    
    printWindow.document.close();
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Convert number to words for Indian currency
  const numberToWords = (num: number) => {
    const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    
    if (num === 0) return 'Zero';
    
    const sayNumber = (n: number): string => {
      if (n < 20) return units[n];
      if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + units[n % 10] : '');
      if (n < 1000) return units[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' and ' + sayNumber(n % 100) : '');
      if (n < 100000) return sayNumber(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 !== 0 ? ' ' + sayNumber(n % 1000) : '');
      if (n < 10000000) return sayNumber(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 !== 0 ? ' ' + sayNumber(n % 100000) : '');
      return sayNumber(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 !== 0 ? ' ' + sayNumber(n % 10000000) : '');
    };
    
    const decimalPart = Math.round((num % 1) * 100);
    const wholePart = Math.floor(num);
    
    let result = sayNumber(wholePart) + ' Rupees';
    if (decimalPart > 0) {
      result += ' and ' + sayNumber(decimalPart) + ' Paise';
    }
    
    return result + ' Only';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6">
        <div className="flex justify-between mb-4">
          <h2 className="text-2xl font-bold">Preview Invoice</h2>
          <button 
            onClick={onClose}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
          >
            Close
          </button>
        </div>
        
        <div className="border border-gray-300 p-8 rounded" ref={printRef}>
          <div className="invoice-container">
            <div className="invoice-header">
              <div className="company-info">
                {invoiceData.user_shop_name || 'Your Shop Name'}
              </div>
              <div>
                <div><strong>Invoice No:</strong> {invoiceData.invoice_no}</div>
                <div><strong>Date:</strong> {new Date().toLocaleDateString()}</div>
              </div>
            </div>
            
            <div className="invoice-title">GST INVOICE</div>
            
            <div className="invoice-details">
              <div className="invoice-details-column">
                <div><strong>Party Name:</strong> {invoiceData.party_name}</div>
                {invoiceData.address && <div><strong>Address:</strong> {invoiceData.address}</div>}
                {(invoiceData.city || invoiceData.state || invoiceData.pincode) && (
                  <div>
                    {invoiceData.city && `${invoiceData.city}, `}
                    {invoiceData.state && `${invoiceData.state}, `}
                    {invoiceData.pincode}
                  </div>
                )}
                {invoiceData.mobile_no && <div><strong>Mobile:</strong> {invoiceData.mobile_no}</div>}
                {invoiceData.gstin && <div><strong>GSTIN:</strong> {invoiceData.gstin}</div>}
              </div>
              <div className="invoice-details-column">
                {invoiceData.order_no && <div><strong>Order No:</strong> {invoiceData.order_no}</div>}
                {invoiceData.doctor_name && <div><strong>Doctor:</strong> {invoiceData.doctor_name}</div>}
                {invoiceData.patient_name && <div><strong>Patient:</strong> {invoiceData.patient_name}</div>}
                {invoiceData.payment_mode && <div><strong>Payment Mode:</strong> {invoiceData.payment_mode}</div>}
                {invoiceData.road_permit && <div><strong>Road Permit:</strong> {invoiceData.road_permit}</div>}
              </div>
            </div>
            
            <table>
              <thead>
                <tr>
                  <th>S.No</th>
                  <th>CAT No.</th>
                  <th>Product</th>
                  <th>Lot No.</th>
                  <th>HSN</th>
                  <th>Expiry</th>
                  <th>MRP</th>
                  <th>Rate</th>
                  <th>Qty</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {cartData.items.map((item, index) => (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td>{item.cat_no}</td>
                    <td>{item.product_name}</td>
                    <td>{item.lot_no || 'N/A'}</td>
                    <td>{item.hsn_code || 'N/A'}</td>
                    <td>{item.expiry || '31.12.9999'}</td>
                    <td>{formatCurrency(item.mrp)}</td>
                    <td>{formatCurrency(item.selling_price)}</td>
                    <td>{item.selected_quantity}</td>
                    <td>{formatCurrency(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            <div className="summary">
              <div><strong>Subtotal:</strong> {formatCurrency(cartData.cart_total)}</div>
              
              {invoiceData.adjustment_percent !== 0 && (
                <div>
                  <strong>Adjustment ({invoiceData.adjustment_percent}%):</strong> 
                  {formatCurrency(cartData.cart_total * (invoiceData.adjustment_percent || 0) / 100)}
                </div>
              )}
              
              {invoiceData.cgst > 0 && (
                <div>
                  <strong>CGST ({invoiceData.cgst}%):</strong> 
                  {formatCurrency(cartData.cart_total * (invoiceData.cgst || 0) / 100)}
                </div>
              )}
              
              {invoiceData.sgst > 0 && (
                <div>
                  <strong>SGST ({invoiceData.sgst}%):</strong> 
                  {formatCurrency(cartData.cart_total * (invoiceData.sgst || 0) / 100)}
                </div>
              )}
              
              {invoiceData.igst > 0 && (
                <div>
                  <strong>IGST ({invoiceData.igst}%):</strong> 
                  {formatCurrency(cartData.cart_total * (invoiceData.igst || 0) / 100)}
                </div>
              )}
              
              <div><strong>Net Amount:</strong> {formatCurrency(cartData.net_amount)}</div>
              <div>
                <strong>Round Off:</strong> 
                {formatCurrency(cartData.net_payable_amount - cartData.net_amount)}
              </div>
              <div style={{ fontWeight: 'bold', fontSize: '1.2em', marginTop: '10px' }}>
                <strong>Net Payable:</strong> {formatCurrency(cartData.net_payable_amount)}
              </div>
            </div>
            
            <div className="amount-in-words">
              <strong>Amount in Words:</strong> {numberToWords(cartData.net_payable_amount)}
            </div>
            
            <div className="terms">
              <strong>Terms & Conditions:</strong>
              <ol>
                <li>If not paid within 30 days from the date of invoice.</li>
                <li>If any claim for breakage/damage send with certificate of transporter to us within 90 days from date of invoice.</li>
                <li>Complain if any send Patna HQ within 7 days of release of the consignment. Subject to Patna Jurisdiction only.</li>
                <li>E & OE</li>
              </ol>
            </div>
            
            <div className="signature">
              <div className="signature-column">
              <img src="aosys-logo.png" alt="Aosys" style={{ width: '150px', height: 'auto' }} />
              </div>
              <div className="signature-column">
                <div>For {invoiceData.user_shop_name || 'Your Shop Name'}</div>
                <div style={{ marginTop: '40px' }}>Authorized Signatory</div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-4 flex justify-center">
          <button 
            onClick={handlePrint}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded font-medium"
          >
            Print Invoice
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrintInvoice;