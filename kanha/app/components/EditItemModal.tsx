"use client";
import React, { useState, useEffect } from 'react';

interface Item {
  id: string;
  cat_no: string;
  product_name: string;
  lot_no?: string;
  hsn_no?: string; // Added new HSN field
  quantity: number;
  mrp: number;
  w_rate?: number;
  selling_price?: number;
}

interface EditItemModalProps {
  isOpen: boolean;
  item: Item | null;
  onClose: () => void;
  onSave: (item: Item) => Promise<void>;
}

const EditItemModal: React.FC<EditItemModalProps> = ({
  isOpen,
  item,
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState<Item | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (item) {
      setFormData({ ...item });
    }
  }, [item]);

  if (!isOpen || !formData) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => prev ? { ...prev, [name]: value } : null);
    
    // Clear error when field is changed
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    // Required fields
    if (!formData.product_name.trim()) {
      newErrors.product_name = 'Product name is required';
    }
    
    if (!formData.cat_no || formData.cat_no.trim() === '') {
      newErrors.cat_no = 'Catalog number is required';
    }
    
    if (!formData.quantity || formData.quantity <= 0) {
      newErrors.quantity = 'Quantity must be a positive number';
    }
    
    if (!formData.mrp || formData.mrp <= 0) {
      newErrors.mrp = 'MRP must be a positive number';
    }
    
    // Optional fields validation
    if (formData.w_rate !== undefined && formData.w_rate !== null && formData.w_rate <= 0) {
      newErrors.w_rate = 'Wholesale rate must be a positive number';
    }
    
    if (formData.selling_price !== undefined && formData.selling_price !== null && formData.selling_price <= 0) {
      newErrors.selling_price = 'Selling price must be a positive number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !formData) return;
    
    try {
      setIsSaving(true);
      await onSave(formData);
      onClose();
    } catch (err: any) {
      console.error('Failed to save item:', err);
      
      // Check for specific error message related to catalog number
      if (err.response && err.response.data && err.response.data.error) {
        const errorMsg = err.response.data.error;
        
        if (errorMsg.includes('catalog number') || errorMsg.includes('cat_no')) {
          // Set specific error for catalog number field
          setErrors(prev => ({ 
            ...prev, 
            cat_no: 'A product with this catalog number already exists' 
          }));
        } else {
          setErrors(prev => ({ ...prev, form: errorMsg }));
        }
      } else if (err instanceof Error) {
        // Handle other types of errors
        setErrors(prev => ({ ...prev, form: err.message }));
      } else {
        setErrors(prev => ({ ...prev, form: 'Failed to save changes' }));
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-lg max-w-2xl w-full p-6 shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Edit Item</h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            disabled={isSaving}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path>
            </svg>
          </button>
        </div>
        
        {errors.form && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded">
            {errors.form}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Catalog Number</label>
              <input
                type="text"
                name="cat_no"
                value={formData.cat_no}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md ${errors.cat_no ? 'border-red-500' : 'border-gray-300'}`}
                disabled={isSaving}
              />
              {errors.cat_no && <p className="mt-1 text-sm text-red-600">{errors.cat_no}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
              <input
                type="text"
                name="product_name"
                value={formData.product_name}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md ${errors.product_name ? 'border-red-500' : 'border-gray-300'}`}
                disabled={isSaving}
              />
              {errors.product_name && <p className="mt-1 text-sm text-red-600">{errors.product_name}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lot Number</label>
              <input
                type="text"
                name="lot_no"
                value={formData.lot_no || ''}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md ${errors.lot_no ? 'border-red-500' : 'border-gray-300'}`}
                disabled={isSaving}
              />
              {errors.lot_no && <p className="mt-1 text-sm text-red-600">{errors.lot_no}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">HSN Number</label>
              <input
                type="text"
                name="hsn_no"
                value={formData.hsn_no || ''}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md ${errors.hsn_no ? 'border-red-500' : 'border-gray-300'}`}
                disabled={isSaving}
              />
              {errors.hsn_no && <p className="mt-1 text-sm text-red-600">{errors.hsn_no}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md ${errors.quantity ? 'border-red-500' : 'border-gray-300'}`}
                min="1"
                disabled={isSaving}
              />
              {errors.quantity && <p className="mt-1 text-sm text-red-600">{errors.quantity}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">MRP (₹)</label>
              <input
                type="number"
                name="mrp"
                value={formData.mrp}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md ${errors.mrp ? 'border-red-500' : 'border-gray-300'}`}
                step="0.01"
                min="0.01"
                disabled={isSaving}
              />
              {errors.mrp && <p className="mt-1 text-sm text-red-600">{errors.mrp}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Wholesale Rate (₹)</label>
              <input
                type="number"
                name="w_rate"
                value={formData.w_rate || ''}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md ${errors.w_rate ? 'border-red-500' : 'border-gray-300'}`}
                step="0.01"
                min="0.01"
                disabled={isSaving}
              />
              {errors.w_rate && <p className="mt-1 text-sm text-red-600">{errors.w_rate}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Selling Price (₹)</label>
              <input
                type="number"
                name="selling_price"
                value={formData.selling_price || ''}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md ${errors.selling_price ? 'border-red-500' : 'border-gray-300'}`}
                step="0.01"
                min="0.01"
                disabled={isSaving}
              />
              {errors.selling_price && <p className="mt-1 text-sm text-red-600">{errors.selling_price}</p>}
            </div>
          </div>
          
          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md font-medium transition-colors disabled:opacity-50"
              disabled={isSaving}
            >
              Cancel
            </button>
            
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors disabled:opacity-50 flex items-center"
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-r-transparent mr-2"></span>
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditItemModal;