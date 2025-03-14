"use client";
import { useState, ChangeEvent, FormEvent } from "react";
import { useAuth } from "../../context/AuthContext";
import ProtectedRoute from "../../components/ProtectedRoute";
import { itemsApi } from "../../api/items-api";
import { Toaster, toast } from "react-hot-toast";

// Define types for form state
interface StockItemForm {
  cat_no: string;
  product_name: string;
  lot_no: string;
  quantity: string;
  w_rate: string;
  selling_price: string;
  mrp: string;
}

// Define validation errors type
interface ValidationErrors {
  cat_no?: string;
  product_name?: string;
  lot_no?: string;
  quantity?: string;
  w_rate?: string;
  selling_price?: string;
  mrp?: string;
}

// Define the user type based on your auth context
interface User {
  id: number;
  shop_name: string;
  email: string;
}

export default function StocksEntryPage() {
  const { user } = useAuth() as { user: User | null };
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [stockItem, setStockItem] = useState<StockItemForm>({
    cat_no: "",
    product_name: "",
    lot_no: "",
    quantity: "",
    w_rate: "",
    selling_price: "",
    mrp: ""
  });

  // Validate form input
  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};
    let isValid = true;

    // Required fields
    if (!stockItem.cat_no) {
      newErrors.cat_no = "Catalog number is required";
      isValid = false;
    } else if (!/^\d+$/.test(stockItem.cat_no)) {
      newErrors.cat_no = "Catalog number must be a valid number";
      isValid = false;
    }

    if (!stockItem.product_name) {
      newErrors.product_name = "Product name is required";
      isValid = false;
    }

    if (!stockItem.quantity) {
      newErrors.quantity = "Quantity is required";
      isValid = false;
    } else if (!/^\d+$/.test(stockItem.quantity) || parseInt(stockItem.quantity) <= 0) {
      newErrors.quantity = "Quantity must be a positive number";
      isValid = false;
    }

    if (!stockItem.mrp) {
      newErrors.mrp = "MRP is required";
      isValid = false;
    } else if (!/^\d*\.?\d+$/.test(stockItem.mrp) || parseFloat(stockItem.mrp) <= 0) {
      newErrors.mrp = "MRP must be a positive number";
      isValid = false;
    }

    // Optional fields with validation
    if (stockItem.lot_no && !/^\d+$/.test(stockItem.lot_no)) {
      newErrors.lot_no = "Lot number must be a valid number";
      isValid = false;
    }

    if (stockItem.w_rate && !/^\d*\.?\d+$/.test(stockItem.w_rate)) {
      newErrors.w_rate = "Wholesale rate must be a valid number";
      isValid = false;
    }

    if (stockItem.selling_price && !/^\d*\.?\d+$/.test(stockItem.selling_price)) {
      newErrors.selling_price = "Selling price must be a valid number";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  // Handle form input changes
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Clear error for this field when user starts typing again
    if (errors[name as keyof ValidationErrors]) {
      setErrors({
        ...errors,
        [name]: undefined
      });
    }
    
    setStockItem({
      ...stockItem,
      [name]: value
    });
  };

  // Handle form submission
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      toast.error("Please correct the errors in the form");
      return;
    }

    if (!user) {
      toast.error("User authentication required");
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Prepare the data with correct types
      const itemData = {
        user_id: user.id,
        cat_no: parseInt(stockItem.cat_no),
        product_name: stockItem.product_name,
        lot_no: stockItem.lot_no ? parseInt(stockItem.lot_no) : null,
        quantity: parseInt(stockItem.quantity),
        w_rate: stockItem.w_rate ? parseFloat(stockItem.w_rate) : null,
        selling_price: stockItem.selling_price ? parseFloat(stockItem.selling_price) : null,
        mrp: parseFloat(stockItem.mrp)
      };

      await itemsApi.addStockItem(itemData);
      
      toast.success("Stock item added successfully", {
        style: {
          background: '#10B981',
          color: '#fff',
          padding: '16px',
          borderRadius: '10px',
        },
        iconTheme: {
          primary: '#fff',
          secondary: '#10B981',
        },
        duration: 3000,
      });
      
      // Reset the form
      setStockItem({
        cat_no: "",
        product_name: "",
        lot_no: "",
        quantity: "",
        w_rate: "",
        selling_price: "",
        mrp: ""
      });
    } catch (error: any) {
      console.error("Error adding stock:", error);
      
      // Handle specific error cases
      if (error.response?.status === 409) {
        setErrors({
          ...errors,
          cat_no: "A product with this catalog number already exists"
        });
        toast.error("A product with this catalog number already exists", {
          style: {
            background: '#EF4444',
            color: '#fff',
            padding: '16px',
            borderRadius: '10px',
          },
          iconTheme: {
            primary: '#fff',
            secondary: '#EF4444',
          },
          duration: 4000,
        });
      } else if (error.response?.data?.error) {
        toast.error(error.response.data.error, {
          style: {
            background: '#EF4444',
            color: '#fff',
            padding: '16px',
            borderRadius: '10px',
          },
        });
      } else {
        toast.error("Failed to add stock item", {
          style: {
            background: '#EF4444',
            color: '#fff',
            padding: '16px',
            borderRadius: '10px',
          },
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="h-full flex flex-col">
        <Toaster position="top-right" />
        
        {/* Navbar */}
        <nav className="bg-gray-700 text-white py-4 w-full">
          <div className="px-6 text-xl font-bold">Welcome, {user?.shop_name}</div>
        </nav>
        
        {/* Main Content */}
        <div className="flex-1 px-6 py-6 bg-gray-50">
          <h1 className="text-2xl font-bold mb-6 text-gray-800">Stocks Entry</h1>
          
          <div className="bg-white rounded-lg shadow-md p-6 max-w-3xl mx-auto">
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Catalog Number */}
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="cat_no">
                    Catalog Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="cat_no"
                    name="cat_no"
                    type="text"
                    placeholder="Enter catalog number"
                    value={stockItem.cat_no}
                    onChange={handleChange}
                    className={`shadow appearance-none border ${
                      errors.cat_no ? "border-red-500" : "border-gray-300"
                    } rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-blue-500`}
                  />
                  {errors.cat_no && (
                    <p className="text-red-500 text-xs italic mt-1">{errors.cat_no}</p>
                  )}
                </div>
                
                {/* Product Name */}
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="product_name">
                    Product Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="product_name"
                    name="product_name"
                    type="text"
                    placeholder="Enter product name"
                    value={stockItem.product_name}
                    onChange={handleChange}
                    className={`shadow appearance-none border ${
                      errors.product_name ? "border-red-500" : "border-gray-300"
                    } rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-blue-500`}
                  />
                  {errors.product_name && (
                    <p className="text-red-500 text-xs italic mt-1">{errors.product_name}</p>
                  )}
                </div>
                
                {/* Lot Number */}
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="lot_no">
                    Lot Number
                  </label>
                  <input
                    id="lot_no"
                    name="lot_no"
                    type="text"
                    placeholder="Enter lot number"
                    value={stockItem.lot_no}
                    onChange={handleChange}
                    className={`shadow appearance-none border ${
                      errors.lot_no ? "border-red-500" : "border-gray-300"
                    } rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-blue-500`}
                  />
                  {errors.lot_no && (
                    <p className="text-red-500 text-xs italic mt-1">{errors.lot_no}</p>
                  )}
                </div>
                
                {/* Quantity */}
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="quantity">
                    Quantity <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="quantity"
                    name="quantity"
                    type="text"
                    placeholder="Enter quantity"
                    value={stockItem.quantity}
                    onChange={handleChange}
                    className={`shadow appearance-none border ${
                      errors.quantity ? "border-red-500" : "border-gray-300"
                    } rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-blue-500`}
                  />
                  {errors.quantity && (
                    <p className="text-red-500 text-xs italic mt-1">{errors.quantity}</p>
                  )}
                </div>
                
                {/* Wholesale Rate */}
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="w_rate">
                    Wholesale Rate
                  </label>
                  <input
                    id="w_rate"
                    name="w_rate"
                    type="text"
                    placeholder="Enter wholesale rate"
                    value={stockItem.w_rate}
                    onChange={handleChange}
                    className={`shadow appearance-none border ${
                      errors.w_rate ? "border-red-500" : "border-gray-300"
                    } rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-blue-500`}
                  />
                  {errors.w_rate && (
                    <p className="text-red-500 text-xs italic mt-1">{errors.w_rate}</p>
                  )}
                </div>
                
                {/* Selling Price */}
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="selling_price">
                    Selling Price
                  </label>
                  <input
                    id="selling_price"
                    name="selling_price"
                    type="text"
                    placeholder="Enter selling price"
                    value={stockItem.selling_price}
                    onChange={handleChange}
                    className={`shadow appearance-none border ${
                      errors.selling_price ? "border-red-500" : "border-gray-300"
                    } rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-blue-500`}
                  />
                  {errors.selling_price && (
                    <p className="text-red-500 text-xs italic mt-1">{errors.selling_price}</p>
                  )}
                </div>
                
                {/* MRP */}
                <div className="mb-4 md:col-span-2">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="mrp">
                    MRP <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="mrp"
                    name="mrp"
                    type="text"
                    placeholder="Enter MRP"
                    value={stockItem.mrp}
                    onChange={handleChange}
                    className={`shadow appearance-none border ${
                      errors.mrp ? "border-red-500" : "border-gray-300"
                    } rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-blue-500`}
                  />
                  {errors.mrp && (
                    <p className="text-red-500 text-xs italic mt-1">{errors.mrp}</p>
                  )}
                </div>
              </div>
              
              {/* Submit Button */}
              <div className="flex items-center justify-center mt-6">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-300 ${
                    isSubmitting ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {isSubmitting ? (
                    <div className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Adding...
                    </div>
                  ) : (
                    "Add Stock"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}