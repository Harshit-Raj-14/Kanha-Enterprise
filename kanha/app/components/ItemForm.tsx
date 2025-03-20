"use client";
import { useState } from 'react';
import { invoicesApi, CartItemData } from '../api/invoices-api';

interface ItemFormProps {
  onAddToCart: (item: CartItemData) => void;
}

const DEFAULT_EXPIRY = '31/12/9999';

interface ItemDetails {
  id: number;
  cat_no: string;
  product_name: string;
  lot_no: string | null;
  hsn_no: string | null;
  quantity: number;
  w_rate: number | null;
  selling_price: number | null;
  mrp: number;
}

const ItemForm: React.FC<ItemFormProps> = ({ onAddToCart }) => {
  const [catNo, setCatNo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [addonPercent, setAddonPercent] = useState(0);
  
  const [itemDetails, setItemDetails] = useState<ItemDetails | null>(null);
  
  // New state for editable fields
  const [editableProductName, setEditableProductName] = useState('');
  const [editableLotNo, setEditableLotNo] = useState<string | null>(null);
  const [editableHsnNo, setEditableHsnNo] = useState<string | null>(null);
  const [editableMrp, setEditableMrp] = useState<number>(0);
  const [editableSellingPrice, setEditableSellingPrice] = useState<number | null>(null);

  // Helper function to safely format numbers
  const formatPrice = (value: any): string => {
    // Ensure value is a valid number
    const num = typeof value === 'number' ? value : Number(value);
    return !isNaN(num) ? num.toFixed(2) : '0.00';
  };

  // Helper function to safely convert to number
  const toNumber = (value: any): number => {
    if (value === null || value === undefined || value === '') return 0;
    const num = typeof value === 'number' ? value : Number(value);
    return !isNaN(num) ? num : 0;
  };

  // Search for item by catalog number
  const handleSearch = async () => {
    if (!catNo.trim()) {
      setError('Please enter a catalog number');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const item = await invoicesApi.getItemByCatNo(catNo);
      setItemDetails(item);
      
      // Initialize editable fields with fetched values
      setEditableProductName(item.product_name);
      setEditableLotNo(item.lot_no);
      setEditableHsnNo(item.hsn_no);
      
      // Ensure numerical values are properly converted
      setEditableMrp(toNumber(item.mrp));
      setEditableSellingPrice(item.selling_price !== null ? toNumber(item.selling_price) : null);
      
      setSelectedQuantity(1);
      setAddonPercent(0);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch item details');
      setItemDetails(null);
    } finally {
      setLoading(false);
    }
  };

  // Add item to cart
  const handleAddToCart = () => {
    if (!itemDetails) {
      setError('No item selected');
      return;
    }

    if (selectedQuantity <= 0) {
      setError('Quantity must be greater than 0');
      return;
    }

    if (selectedQuantity > itemDetails.quantity) {
      setError(`Only ${itemDetails.quantity} units available in stock`);
      return;
    }

    // Calculate the selling price with addon percentage
    // Ensure we have valid numbers before calculation
    const baseSellingPrice = editableSellingPrice !== null ? 
      toNumber(editableSellingPrice) : toNumber(editableMrp);
    
    let calculatedSellingPrice = baseSellingPrice;
    if (addonPercent > 0) {
      calculatedSellingPrice = baseSellingPrice * (1 + (toNumber(addonPercent) / 100)); 
    }
    
    // Calculate total
    const total = calculatedSellingPrice * selectedQuantity;

    const cartItem: CartItemData = {
      item_id: itemDetails.id,
      cat_no: itemDetails.cat_no,
      product_name: editableProductName,
      lot_no: editableLotNo || undefined,
      hsn_code: editableHsnNo || undefined,
      expiry: DEFAULT_EXPIRY,
      mrp: toNumber(editableMrp),
      selling_price: Number(formatPrice(calculatedSellingPrice)),
      selected_quantity: selectedQuantity,
      addon_percent: addonPercent > 0 ? addonPercent : undefined,
      total: Number(formatPrice(total))
    };

    onAddToCart(cartItem);
    
    // Reset form after adding to cart
    setItemDetails(null);
    setCatNo('');
    setSelectedQuantity(1);
    setAddonPercent(0);
    setEditableProductName('');
    setEditableLotNo(null);
    setEditableHsnNo(null);
    setEditableMrp(0);
    setEditableSellingPrice(null);
  };

  // Handle "Enter" key press in the catalog number input
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">Add Item Details</h2>
      
      {/* Search Item Form */}
      <div className="flex items-end gap-2 mb-4">
        <div className="flex-grow">
          <label className="block text-sm font-medium text-gray-700 mb-1">Catalog Number</label>
          <input
            type="text"
            value={catNo}
            onChange={(e) => setCatNo(e.target.value)}
            onKeyPress={handleKeyPress}
            className="w-full p-2 border border-gray-300 rounded"
            placeholder="Enter catalog number"
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium transition-colors disabled:bg-blue-400"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>
      
      {error && <div className="text-red-500 mb-4">{error}</div>}
      
      {/* Item Details Form */}
      {itemDetails && (
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            {/* Read-only catalog number */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Catalog Number</label>
              <div className="p-2 bg-gray-100 rounded">{itemDetails.cat_no}</div>
            </div>
            
            {/* Editable Product Name */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Product Name</label>
              <input
                type="text"
                value={editableProductName}
                onChange={(e) => setEditableProductName(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>
            
            {/* Editable Lot No */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Lot No</label>
              <input
                type="text"
                value={editableLotNo || ''}
                onChange={(e) => setEditableLotNo(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>
            
            {/* Editable HSN No */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">HSN No</label>
              <input
                type="text"
                value={editableHsnNo || ''}
                onChange={(e) => setEditableHsnNo(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>
            
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Expiry</label>
              <div className="p-2 bg-gray-100 rounded">{DEFAULT_EXPIRY}</div>
            </div>
            
            {/* Editable MRP */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">MRP</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={editableMrp}
                onChange={(e) => setEditableMrp(toNumber(e.target.value))}
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>
            
            {/* Editable Selling Price */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Selling Price</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={editableSellingPrice ?? ''}
                onChange={(e) => {
                  const val = e.target.value.trim();
                  setEditableSellingPrice(val === '' ? null : toNumber(val));
                }}
                className="w-full p-2 border border-gray-300 rounded"
                placeholder={editableMrp ? editableMrp.toString() : '0'}
              />
              <div className="text-xs text-gray-500">
                If not specified, MRP will be used as selling price
              </div>
            </div>
            
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 flex justify-between">
                <span>Quantity</span>
                <span className="text-xs text-gray-500">Available: {itemDetails.quantity}</span>
              </label>
              <input
                type="number"
                min="1"
                max={itemDetails.quantity}
                value={selectedQuantity}
                onChange={(e) => setSelectedQuantity(toNumber(e.target.value))}
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>
            
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Add-on Percentage (%)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={addonPercent}
                onChange={(e) => setAddonPercent(toNumber(e.target.value))}
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>
            
            <div className="col-span-1 md:col-span-2 lg:col-span-3 flex justify-end">
              <button
                onClick={handleAddToCart}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-medium transition-colors"
              >
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ItemForm;