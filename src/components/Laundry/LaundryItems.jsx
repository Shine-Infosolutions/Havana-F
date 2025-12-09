import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Shirt } from 'lucide-react';
import { toast } from 'react-hot-toast';
import ConfirmationDialog from '../common/ConfirmationDialog';

const LaundryItems = () => {
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [vendorFilter, setVendorFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [formData, setFormData] = useState({
    itemName: '',
    categoryId: '',
    rate: '',
    unit: 'piece',
    vendorId: '',
    isActive: true
  });

  const units = ['piece', 'pair', 'set'];

  useEffect(() => {
    fetchItems();
    fetchVendors();
    fetchCategories();
  }, []);

  useEffect(() => {
    filterItems();
  }, [items, searchQuery, categoryFilter, vendorFilter]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/laundry-items/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setItems(Array.isArray(data) ? data : (data.laundryItems || []));
    } catch (error) {
      toast.error('Failed to fetch laundry items');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchVendors = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/vendors/active`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setVendors(data.vendors || []);
    } catch (error) {
      setVendors([]);
    }
  };

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/laundry-categories`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setCategories(Array.isArray(data) ? data : (data.categories || []));
    } catch (error) {
      setCategories([]);
    }
  };

  const filterItems = () => {
    if (!Array.isArray(items)) return;
    let filtered = [...items];
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        item.itemName?.toLowerCase().includes(query) ||
        item.serviceType?.toLowerCase().includes(query)
      );
    }
    
    if (categoryFilter) {
      filtered = filtered.filter(item => item.categoryId?._id === categoryFilter);
    }
    
    if (vendorFilter) {
      filtered = filtered.filter(item => item.vendorId?._id === vendorFilter);
    }
    
    setFilteredItems(filtered);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setConfirmAction(() => performSubmit);
    setShowConfirmDialog(true);
  };

  const performSubmit = async () => {
    setShowConfirmDialog(false);
    try {
      const token = localStorage.getItem('token');
      const url = editingItem
        ? `${import.meta.env.VITE_API_BASE_URL}/api/laundry-items/${editingItem._id}`
        : `${import.meta.env.VITE_API_BASE_URL}/api/laundry-items/`;
      
      const payload = { ...formData };
      if (!payload.vendorId) {
        delete payload.vendorId;
      }
      
      const response = await fetch(url, {
        method: editingItem ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        toast.success(`Laundry item ${editingItem ? 'updated' : 'added'} successfully`);
        setShowForm(false);
        resetForm();
        fetchItems();
      }
    } catch (error) {
      toast.error('Failed to save laundry item');
    } finally {
      setConfirmAction(null);
    }
  };

  const handleDelete = (id) => {
    setConfirmAction(() => () => performDelete(id));
    setShowConfirmDialog(true);
  };

  const performDelete = async (id) => {
    setShowConfirmDialog(false);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/laundry-items/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        toast.success('Laundry item deleted successfully');
        fetchItems();
      }
    } catch (error) {
      toast.error('Failed to delete laundry item');
    } finally {
      setConfirmAction(null);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      itemName: item.itemName,
      categoryId: item.categoryId?._id || '',
      rate: item.rate,
      unit: item.unit || 'piece',
      vendorId: item.vendorId?._id || '',
      isActive: item.isActive !== undefined ? item.isActive : true
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      itemName: '',
      categoryId: '',
      rate: '',
      unit: 'piece',
      vendorId: '',
      isActive: true
    });
    setEditingItem(null);
  };

  return (
    <div className="p-3 sm:p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 sm:mb-6">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2 sm:gap-3">
            <Shirt style={{color: 'hsl(45, 43%, 58%)'}} size={24} />
            Laundry Items
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Manage laundry items and rates</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="text-white px-3 sm:px-4 py-2 rounded-lg flex items-center gap-2 text-sm sm:text-base w-full sm:w-auto justify-center"
          style={{background: 'linear-gradient(to bottom, hsl(45, 43%, 58%), hsl(45, 32%, 46%))', border: '1px solid hsl(45, 43%, 58%)'}}
        >
          <Plus size={18} />
          Add Item
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-3 sm:p-6 mb-4 sm:mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat._id} value={cat._id}>{cat.categoryName}</option>
            ))}
          </select>
          <select
            value={vendorFilter}
            onChange={(e) => setVendorFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Vendors</option>
            {vendors.map(vendor => (
              <option key={vendor._id} value={vendor._id}>{vendor.vendorName}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <>
          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {filteredItems.map((item) => (
              <div key={item._id} className="bg-white rounded-lg shadow p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{item.itemName}</h3>
                    <div className="flex gap-2 mt-2">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">{item.categoryId?.categoryName || 'N/A'}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(item)} style={{color: 'hsl(45, 43%, 58%)'}}>
                      <Edit size={18} />
                    </button>
                    <button onClick={() => handleDelete(item._id)} className="text-red-600 hover:text-red-800">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-gray-500">Rate:</span> <span className="font-medium">₹{item.rate}</span></div>
                  <div><span className="text-gray-500">Unit:</span> <span className="font-medium">{item.unit}</span></div>
                  <div className="col-span-2"><span className="text-gray-500">Vendor:</span> <span className="font-medium">{item.vendorId?.vendorName || 'N/A'}</span></div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block bg-white rounded-lg shadow overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rate</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredItems.map((item) => (
                  <tr key={item._id}>
                    <td className="px-6 py-4 whitespace-nowrap font-medium">{item.itemName}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">{item.categoryId?.categoryName || 'N/A'}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">₹{item.rate}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{item.unit}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{item.vendorId?.vendorName || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-2">
                        <button onClick={() => handleEdit(item)} style={{color: 'hsl(45, 43%, 58%)'}}>
                          <Edit size={18} />
                        </button>
                        <button onClick={() => handleDelete(item._id)} className="text-red-600 hover:text-red-800">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">{editingItem ? 'Edit' : 'Add'} Laundry Item</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Item Name</label>
                <input type="text" value={formData.itemName} onChange={(e) => setFormData({...formData, itemName: e.target.value})} className="w-full px-3 py-2 border rounded-lg" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <select value={formData.categoryId} onChange={(e) => setFormData({...formData, categoryId: e.target.value})} className="w-full px-3 py-2 border rounded-lg" required>
                  <option value="">Select Category</option>
                  {categories.map(cat => <option key={cat._id} value={cat._id}>{cat.categoryName}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Rate (₹)</label>
                <input type="number" value={formData.rate} onChange={(e) => setFormData({...formData, rate: e.target.value})} className="w-full px-3 py-2 border rounded-lg" required min="0" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Unit</label>
                <select value={formData.unit} onChange={(e) => setFormData({...formData, unit: e.target.value})} className="w-full px-3 py-2 border rounded-lg">
                  {units.map(unit => <option key={unit} value={unit}>{unit}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Vendor (Optional)</label>
                <select value={formData.vendorId} onChange={(e) => setFormData({...formData, vendorId: e.target.value})} className="w-full px-3 py-2 border rounded-lg">
                  <option value="">No Vendor</option>
                  {vendors.map(vendor => <option key={vendor._id} value={vendor._id}>{vendor.vendorName}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => { setShowForm(false); resetForm(); }} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 text-white rounded-lg" style={{background: 'linear-gradient(to bottom, hsl(45, 43%, 58%), hsl(45, 32%, 46%))'}}>{editingItem ? 'Update' : 'Add'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmationDialog
        isOpen={showConfirmDialog}
        onClose={() => { setShowConfirmDialog(false); setConfirmAction(null); }}
        onConfirm={confirmAction}
        title={confirmAction?.toString().includes('Delete') ? 'Confirm Deletion' : `Confirm ${editingItem ? 'Update' : 'Creation'}`}
        message={confirmAction?.toString().includes('Delete') 
          ? 'Are you sure you want to delete this laundry item? This action cannot be undone.'
          : `Are you sure you want to ${editingItem ? 'update' : 'create'} this laundry item "${formData.itemName}"?`
        }
        confirmText={confirmAction?.toString().includes('Delete') ? 'Delete' : (editingItem ? 'Update' : 'Create')}
        cancelText="Cancel"
        type={confirmAction?.toString().includes('Delete') ? 'danger' : 'info'}
      />
    </div>
  );
};

export default LaundryItems;
