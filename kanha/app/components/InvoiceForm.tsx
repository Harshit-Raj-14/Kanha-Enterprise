"use client";
import { useState, useEffect } from 'react';
import { invoicesApi, InvoiceFormData } from '../api/invoices-api';

interface InvoiceFormProps {
  onFormChange: (data: InvoiceFormData) => void;
}

const InvoiceForm: React.FC<InvoiceFormProps> = ({ onFormChange }) => {
  const [formData, setFormData] = useState<InvoiceFormData>({
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

  // Get next invoice number on component mount
  useEffect(() => {
    const fetchInvoiceNumber = async () => {
      try {
        const invoiceNo = await invoicesApi.getNextInvoiceNumber();
        setFormData(prev => ({ ...prev, invoice_no: invoiceNo }));
        onFormChange({ ...formData, invoice_no: invoiceNo });
      } catch (error) {
        console.error('Failed to fetch next invoice number:', error);
      }
    };

    fetchInvoiceNumber();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Convert numeric strings to numbers where appropriate
    const numericFields = ['mobile_no', 'adjustment_percent', 'cgst', 'sgst', 'igst'];
    const newValue = numericFields.includes(name) && value !== '' 
      ? Number(value) 
      : value;
    
    const updatedFormData = { ...formData, [name]: newValue };
    setFormData(updatedFormData);
    onFormChange(updatedFormData);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">Invoice Details</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Invoice Number and Date */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Invoice No</label>
          <input 
            type="text" 
            name="invoice_no" 
            value={formData.invoice_no} 
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded" 
            readOnly 
          />
        </div>
        
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Date</label>
          <input 
            type="text" 
            value={new Date().toLocaleDateString()} 
            className="w-full p-2 border border-gray-300 rounded" 
            readOnly 
          />
        </div>
        
        {/* Party Name */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Party Name *</label>
          <input 
            type="text" 
            name="party_name" 
            value={formData.party_name} 
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded"
            required
          />
        </div>
        
        {/* Order No */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Order No</label>
          <input 
            type="text" 
            name="order_no" 
            value={formData.order_no} 
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded" 
          />
        </div>
        
        {/* Doctor Name */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Doctor Name</label>
          <input 
            type="text" 
            name="doctor_name" 
            value={formData.doctor_name} 
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded" 
          />
        </div>
        
        {/* Patient Name */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Patient Name</label>
          <input 
            type="text" 
            name="patient_name" 
            value={formData.patient_name} 
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded" 
          />
        </div>
        
        {/* Address */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Address</label>
          <input 
            type="text" 
            name="address" 
            value={formData.address} 
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded" 
          />
        </div>
        
        {/* City */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">City</label>
          <input 
            type="text" 
            name="city" 
            value={formData.city} 
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded" 
          />
        </div>
        
        {/* State */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">State</label>
          <input 
            type="text" 
            name="state" 
            value={formData.state} 
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded" 
          />
        </div>
        
        {/* Pincode */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Pincode</label>
          <input 
            type="text" 
            name="pincode" 
            value={formData.pincode} 
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded" 
          />
        </div>
        
        {/* Mobile No */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Mobile No</label>
          <input 
            type="number" 
            name="mobile_no" 
            value={formData.mobile_no || ''} 
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded" 
          />
        </div>
        
        {/* GSTIN */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">GSTIN</label>
          <input 
            type="text" 
            name="gstin" 
            value={formData.gstin} 
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded" 
          />
        </div>
        
        {/* Road Permit */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Road Permit</label>
          <input 
            type="text" 
            name="road_permit" 
            value={formData.road_permit} 
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded" 
          />
        </div>
        
        {/* Payment Mode */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Payment Mode</label>
          <select 
            name="payment_mode" 
            value={formData.payment_mode} 
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded"
          >
            <option value="Cash">Cash</option>
            <option value="Card">Card</option>
            <option value="UPI">UPI</option>
            <option value="Net Banking">Net Banking</option>
            <option value="Credit">Credit</option>
          </select>
        </div>
        
        {/* Tax Information */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">CGST (%)</label>
          <input 
            type="number" 
            name="cgst" 
            value={formData.cgst} 
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded" 
            step="0.01"
          />
        </div>
        
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">SGST (%)</label>
          <input 
            type="number" 
            name="sgst" 
            value={formData.sgst} 
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded" 
            step="0.01"
          />
        </div>
        
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">IGST (%)</label>
          <input 
            type="number" 
            name="igst" 
            value={formData.igst} 
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded" 
            step="0.01"
          />
        </div>
        
        {/* Adjustment Percentage */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Adjustment (%)</label>
          <input 
            type="number" 
            name="adjustment_percent" 
            value={formData.adjustment_percent} 
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded" 
            step="0.01"
          />
        </div>
      </div>
    </div>
  );
};

export default InvoiceForm;