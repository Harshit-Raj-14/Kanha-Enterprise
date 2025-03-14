"use client";
import { useState, ChangeEvent, FormEvent } from "react";
import { useAuth } from "../../context/AuthContext";
import ProtectedRoute from "../../components/ProtectedRoute";
import { itemsApi } from "../../api/items-api";
import { toast } from "react-hot-toast";

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

// Define the user type based on your auth context
interface User {
  id: number;
  shop_name: string;
  email: string;
}

export default function StocksEntryPage() {
  const { user } = useAuth() as { user: User | null };
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [stockItem, setStockItem] = useState<StockItemForm>({
    cat_no: "",
    product_name: "",
    lot_no: "",
    quantity: "",
    w_rate: "",
    selling_price: "",
    mrp: ""
  });

  // Handle form input changes
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setStockItem({
      ...stockItem,
      [name]: value
    });
  };

  // Handle form submission
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!stockItem.cat_no || !stockItem.product_name || !stockItem.quantity || !stockItem.mrp) {
      toast.error("Please fill all required fields");
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

      console.log(itemData);

      await itemsApi.addStockItem(itemData);
      
      toast.success("Stock item added successfully");
      
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
      if (error.response?.data?.error) {
        toast.error(error.response.data.error);
      } else {
        toast.error("Failed to add stock item");
      }
    } finally {
      setIsSubmitting(false);
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
          <h1 className="text-2xl font-bold mb-6">Stocks Entry</h1>
          
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
                    type="number"
                    placeholder="Enter catalog number"
                    value={stockItem.cat_no}
                    onChange={handleChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  />
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
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  />
                </div>
                
                {/* Lot Number */}
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="lot_no">
                    Lot Number
                  </label>
                  <input
                    id="lot_no"
                    name="lot_no"
                    type="number"
                    placeholder="Enter lot number"
                    value={stockItem.lot_no}
                    onChange={handleChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  />
                </div>
                
                {/* Quantity */}
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="quantity">
                    Quantity <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="quantity"
                    name="quantity"
                    type="number"
                    placeholder="Enter quantity"
                    value={stockItem.quantity}
                    onChange={handleChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  />
                </div>
                
                {/* Wholesale Rate */}
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="w_rate">
                    Wholesale Rate
                  </label>
                  <input
                    id="w_rate"
                    name="w_rate"
                    type="number"
                    step="0.01"
                    placeholder="Enter wholesale rate"
                    value={stockItem.w_rate}
                    onChange={handleChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  />
                </div>
                
                {/* Selling Price */}
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="selling_price">
                    Selling Price
                  </label>
                  <input
                    id="selling_price"
                    name="selling_price"
                    type="number"
                    step="0.01"
                    placeholder="Enter selling price"
                    value={stockItem.selling_price}
                    onChange={handleChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  />
                </div>
                
                {/* MRP */}
                <div className="mb-4 md:col-span-2">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="mrp">
                    MRP <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="mrp"
                    name="mrp"
                    type="number"
                    step="0.01"
                    placeholder="Enter MRP"
                    value={stockItem.mrp}
                    onChange={handleChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  />
                </div>
              </div>
              
              {/* Submit Button */}
              <div className="flex items-center justify-center mt-6">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${
                    isSubmitting ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {isSubmitting ? "Adding..." : "Add Stock"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}