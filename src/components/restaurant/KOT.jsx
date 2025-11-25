import { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import Pagination from '../common/Pagination';
import soundManager from '../../utils/sound';
import SoundToggle from '../common/SoundToggle';
import { Printer } from 'lucide-react';

const KOT = () => {
  const { axios } = useAppContext();
  const [activeTab, setActiveTab] = useState('kots');
  const [kots, setKots] = useState([]);
  const [kotHistory, setKotHistory] = useState([]);
  const [orders, setOrders] = useState([]);
  const [chefs, setChefs] = useState([]);
  const [tables, setTables] = useState([]);
  const [kotForm, setKotForm] = useState({
    orderId: '',
    tableNo: '',
    items: [],
    priority: 'normal',
    estimatedTime: '',
    assignedChef: ''
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredKots, setFilteredKots] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [newOrderNotification, setNewOrderNotification] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [userRole, setUserRole] = useState(null);
  const [userRestaurantRole, setUserRestaurantRole] = useState(null);
  const [lastOrderCount, setLastOrderCount] = useState(0);

  const socket = null;

  useEffect(() => {
    fetchUserRole();
    fetchMenuItems();
    fetchKOTs();
    fetchOrders();
    fetchChefs();
    fetchTables();
    
    // Polling for new orders
    const pollInterval = setInterval(() => {
      checkForNewOrders();
      fetchKOTs();
      fetchOrders();
    }, 5000);
    
    return () => clearInterval(pollInterval);
  }, [socket]);
  
  useEffect(() => {
    if (menuItems.length > 0) {
      fetchKOTs();
    }
  }, [menuItems]);

  const checkForNewOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/restaurant-orders/all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const orders = response.data || [];
      const currentOrderCount = orders.length;
      
      if (lastOrderCount > 0 && currentOrderCount > lastOrderCount) {
        const sortedOrders = orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        const newOrder = sortedOrders[0];
        
        soundManager.playNewKOTSound();
        
        setNewOrderNotification({
          tableNo: newOrder.tableNo,
          itemCount: newOrder.items?.length || 0,
          orderId: newOrder._id,
          items: newOrder.items || []
        });
        setTimeout(() => setNewOrderNotification(null), 10000);
      }
      
      if (lastOrderCount === 0) {
        setLastOrderCount(currentOrderCount);
      } else {
        setLastOrderCount(currentOrderCount);
      }
    } catch (error) {
      console.error('Error checking for new orders:', error);
    }
  };

  const fetchKOTs = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/restaurant-orders/all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const consolidatedOrders = response.data.map(order => {
        const allItems = (order.allKotItems || order.items || []).map(item => {
          if (typeof item === 'string') {
            return { name: item, quantity: 1, kotNumber: 1 };
          }
          
          if (typeof item === 'object') {
            let itemName = item.name || item.itemName;
            
            if (item.itemId && menuItems.length > 0) {
              const menuItem = menuItems.find(mi => mi._id === item.itemId || mi.id === item.itemId);
              if (menuItem) {
                itemName = menuItem.name || menuItem.itemName;
              }
            }
            
            if (!itemName && menuItems.length > 0) {
              const menuItem = menuItems.find(mi => 
                mi.name === item.name || 
                mi.itemName === item.itemName ||
                mi._id === item.id
              );
              if (menuItem) {
                itemName = menuItem.name || menuItem.itemName;
              }
            }
            
            return {
              ...item,
              name: itemName || 'Unknown Item',
              kotNumber: item.kotNumber || 1
            };
          }
          
          return item;
        });
        
        return {
          _id: order._id,
          orderId: order._id,
          tableNo: order.tableNo,
          status: order.status || 'pending',
          orderStatus: order.status || 'pending',
          items: allItems,
          kotCount: order.kotCount || 1,
          priority: order.priority || 'normal',
          assignedChef: order.assignedChef,
          createdAt: order.createdAt
        };
      });
      
      const activeOrders = consolidatedOrders.filter(order => {
        const isServed = order.status === 'served';
        const isPaid = order.status === 'paid';
        const isCompleted = order.status === 'completed';
        const isCancelled = order.status === 'cancelled';
        
        return !isServed && !isPaid && !isCompleted && !isCancelled;
      });
      
      const historyOrders = consolidatedOrders.filter(order => {
        const isServed = order.status === 'served';
        const isPaid = order.status === 'paid';
        const isCompleted = order.status === 'completed';
        const isCancelled = order.status === 'cancelled';
        
        return isServed || isPaid || isCompleted || isCancelled;
      });
      
      if (kots.length > 0 && activeOrders.length > kots.length) {
        const newOrder = activeOrders[activeOrders.length - 1];
        
        soundManager.playNewKOTSound();
        
        setNewOrderNotification({
          tableNo: newOrder.tableNo,
          itemCount: newOrder.items?.length || 0,
          orderId: newOrder.orderId,
          items: newOrder.items || []
        });
        
        setTimeout(() => {
          setNewOrderNotification(null);
        }, 10000);
      }
      
      setKots(activeOrders);
      setKotHistory(historyOrders);
      setFilteredKots(activeTab === 'history' ? historyOrders : activeOrders);
    } catch (error) {
      console.error('Error fetching consolidated orders:', error);
    }
  };
  
  const fetchMenuItems = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/items/all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const itemsData = Array.isArray(response.data) ? response.data : (response.data.items || []);
      setMenuItems(itemsData);
    } catch (error) {
      console.error('Error fetching menu items:', error);
    }
  };

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/restaurant-orders/all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const fetchChefs = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/search/field?model=users&field=role&value=restaurant', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const chefData = Array.isArray(response.data) ? response.data : (response.data.users || response.data.data || []);
      setChefs(chefData.filter(user => user.restaurantRole === 'chef'));
    } catch (error) {
      console.error('Error fetching chefs:', error);
    }
  };

  const fetchTables = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/restaurant/tables', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const tableData = Array.isArray(response.data) ? response.data : (response.data.tables || response.data.data || []);
      setTables(tableData);
    } catch (error) {
      console.error('Error fetching tables:', error);
      setTables([]);
    }
  };

  const fetchUserRole = async () => {
    try {
      const role = localStorage.getItem('role');
      const restaurantRole = localStorage.getItem('restaurantRole');
      
      setUserRole(role);
      setUserRestaurantRole(restaurantRole);
    } catch (error) {
      console.error('Error fetching user role:', error);
    }
  };

  const createKOT = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/kot/create', kotForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (kotForm.assignedChef) {
        try {
          await axios.post('/api/notifications/create', {
            title: 'New KOT Assigned',
            message: `New KOT for Table ${kotForm.tableNo} - ${kotForm.items?.length || 0} items (Priority: ${kotForm.priority})`,
            type: 'kitchen',
            priority: kotForm.priority,
            department: 'kitchen',
            userId: kotForm.assignedChef
          }, {
            headers: { Authorization: `Bearer ${token}` }
          });
        } catch (notifError) {
          console.error('Notification failed:', notifError);
        }
      }
      
      alert('KOT created successfully!');
      setKotForm({
        orderId: '',
        tableNo: '',
        items: [],
        priority: 'normal',
        estimatedTime: '',
        assignedChef: ''
      });
      fetchKOTs();
    } catch (error) {
      console.error('Error creating KOT:', error);
      alert('Failed to create KOT');
    }
  };

  const updateKOTStatus = async (kotId, newStatus, orderId) => {
    try {
      const token = localStorage.getItem('token');
      
      await axios.patch(`/api/kot/${kotId}/status`, {
        status: newStatus
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const orderStatus = getOrderStatusFromKOT(newStatus);
      if (orderStatus && orderId) {
        await axios.patch(`/api/restaurant-orders/${orderId}/status`, {
          status: orderStatus
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        alert(`Order status updated to ${orderStatus}`);
      }
      
      fetchKOTs();
      fetchOrders();
    } catch (error) {
      console.error('Error updating KOT status:', error);
      alert('Failed to update status');
    }
  };
  
  const getOrderStatusFromKOT = (kotStatus) => {
    switch (kotStatus) {
      case 'pending': return 'pending';
      case 'preparing': return 'preparing';
      case 'ready': return 'ready';
      case 'served': return 'served';
      default: return null;
    }
  };

  const printKOT = (kot) => {
    const printWindow = window.open('', '_blank');
    const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>KOT #${kot.displayNumber || kot.kotNumber?.slice(-3) || kot.orderId?.slice(-6) || 'N/A'}</title>
            <style>
                @page {
                    size: 80mm auto;
                    margin: 0;
                }
                body {
                    margin: 0;
                    padding: 0;
                    font-family: monospace;
                    width: 80mm;
                    font-size: 10px;
                }
                .print-content {
                    width: 80mm;
                    max-width: 80mm;
                    margin: 0;
                    padding: 2mm;
                    font-size: 10px;
                    line-height: 1.2;
                    box-sizing: border-box;
                }
                .print-header {
                    font-size: 12px;
                    font-weight: bold;
                }
                .text-center { text-align: center; }
                .mb-1 { margin-bottom: 4px; }
                .mb-2 { margin-bottom: 8px; }
                .mb-3 { margin-bottom: 12px; }
                .border-b { border-bottom: 1px solid #000; }
                .flex { display: flex; }
                .justify-between { justify-content: space-between; }
                .font-bold { font-weight: bold; }
            </style>
        </head>
        <body>
            <div class="print-content">
                <div class="text-center mb-3">
                    <div class="print-header mb-2">RESTAURANT</div>
                    <div class="mb-1">KITCHEN ORDER TICKET</div>
                    <div class="border-b mb-2"></div>
                </div>

                <div class="mb-3">
                    <div class="flex justify-between mb-1">
                        <span>KOT #: ${kot.displayNumber || kot.kotNumber?.slice(-3) || kot.orderId?.slice(-6) || 'N/A'}</span>
                        <span>Table: ${kot.tableNo || 'N/A'}</span>
                    </div>
                    <div class="flex justify-between mb-1">
                        <span>Date: ${new Date().toLocaleDateString('en-GB')}</span>
                        <span>Time: ${new Date().toLocaleTimeString('en-GB', { hour12: false })}</span>
                    </div>
                    <div class="flex justify-between mb-2">
                        <span>Status: ${kot.status?.toUpperCase() || 'PENDING'}</span>
                        <span>Priority: ${kot.priority?.toUpperCase() || 'NORMAL'}</span>
                    </div>
                    <div class="border-b mb-2"></div>
                </div>

                <div class="mb-2">
                    <div class="flex justify-between font-bold border-b mb-1">
                        <span style="width: 40%">Item</span>
                        <span style="width: 15%; text-align: center">Qty</span>
                        <span style="width: 15%; text-align: center">KOT</span>
                        <span style="width: 30%">Notes</span>
                    </div>
                </div>

                <div class="mb-3">
                    ${kot.items?.map(item => {
                        const itemName = typeof item === 'string' ? item : (item.name || item.itemName || 'Unknown Item');
                        const quantity = typeof item === 'object' ? (item.quantity || 1) : 1;
                        const kotNumber = typeof item === 'object' ? (item.kotNumber || 1) : 1;
                        const note = typeof item === 'object' ? (item.note || '') : '';
                        return `
                            <div class="flex justify-between mb-1">
                                <span style="width: 40%">${itemName}</span>
                                <span style="width: 15%; text-align: center">${quantity}</span>
                                <span style="width: 15%; text-align: center">K${kotNumber}</span>
                                <span style="width: 30%">${note || '-'}</span>
                            </div>
                        `;
                    }).join('') || '<div>No items</div>'}
                    <div class="border-b mb-2"></div>
                </div>

                <div class="mb-3">
                    <div class="mb-1">Chef: ${kot.assignedChef?.name || 'Unassigned'}</div>
                    <div class="mb-1">Total Items: ${kot.items?.length || 0}</div>
                    <div class="border-b mb-2"></div>
                </div>

                <div class="text-center mb-3">
                    <div class="mb-2">Kitchen Copy</div>
                    <div class="border-b mb-2"></div>
                    <div>Printed: ${new Date().toLocaleString('en-GB')}</div>
                </div>
            </div>
            
            <script>
                window.onload = function() {
                    window.print();
                    window.onafterprint = function() {
                        window.close();
                    };
                };
            </script>
        </body>
        </html>
    `;
    
    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'preparing': return 'bg-blue-100 text-blue-800';
      case 'ready': return 'bg-green-100 text-green-800';
      case 'served': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'normal': return 'bg-blue-100 text-blue-800';
      case 'low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const sourceKots = activeTab === 'history' ? kotHistory : kots;
    if (searchQuery.trim()) {
      const filtered = sourceKots.filter(kot => 
        kot.orderId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        kot._id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        kot.tableNo?.toString().includes(searchQuery)
      );
      setFilteredKots(filtered);
    } else {
      setFilteredKots(sourceKots);
    }
  };

  return (
    <div className="p-6 bg-background min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-text">Kitchen Order Tickets (KOT)</h1>
          <SoundToggle />
        </div>
        
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="border-b border-border">
            <nav className="flex">
              <button
                onClick={() => {
                  setActiveTab('kots');
                  setFilteredKots(kots);
                }}
                className={`px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === 'kots'
                    ? 'bg-primary text-text border-b-2 border-primary'
                    : 'text-gray-500 hover:text-text hover:bg-accent'
                }`}
              >
                Active KOTs
              </button>
              <button
                onClick={() => {
                  setActiveTab('history');
                  setFilteredKots(kotHistory);
                }}
                className={`px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === 'history'
                    ? 'bg-primary text-text border-b-2 border-primary'
                    : 'text-gray-500 hover:text-text hover:bg-accent'
                }`}
              >
                KOT History
              </button>
              <button
                onClick={() => setActiveTab('create')}
                className={`px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === 'create'
                    ? 'bg-primary text-text border-b-2 border-primary'
                    : 'text-gray-500 hover:text-text hover:bg-accent'
                }`}
              >
                Create KOT
              </button>
            </nav>
          </div>
          
          <div className="p-0">
            {(activeTab === 'kots' || activeTab === 'history') && (
              <div className="p-6">
                <form onSubmit={handleSearch} className="mb-4">
                  <div className="flex flex-col sm:flex-row gap-2 max-w-md">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by Order ID, KOT ID, or Table..."
                      className="flex-1 p-2 border border-border rounded bg-white text-text focus:border-primary focus:outline-none text-sm"
                      style={{ borderColor: 'hsl(45, 100%, 85%)', backgroundColor: 'white', color: 'hsl(45, 100%, 20%)' }}
                    />
                    <button
                      type="submit"
                      className="bg-primary text-text px-4 py-2 rounded hover:bg-hover transition-colors whitespace-nowrap text-sm"
                      style={{ backgroundColor: 'hsl(45, 43%, 58%)', color: 'hsl(45, 100%, 20%)' }}
                    >
                      Search
                    </button>
                  </div>
                </form>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[800px]">
                    <thead style={{ backgroundColor: 'hsl(45, 71%, 69%)' }}>
                      <tr>
                        <th className="px-2 sm:px-4 py-3 text-left font-semibold text-xs sm:text-sm" style={{ color: 'hsl(45, 100%, 20%)' }}>Order ID</th>
                        <th className="px-2 sm:px-4 py-3 text-left font-semibold text-xs sm:text-sm" style={{ color: 'hsl(45, 100%, 20%)' }}>KOTs</th>
                        <th className="px-2 sm:px-4 py-3 text-left font-semibold text-xs sm:text-sm" style={{ color: 'hsl(45, 100%, 20%)' }}>Table/Room</th>
                        <th className="px-2 sm:px-4 py-3 text-left font-semibold text-xs sm:text-sm" style={{ color: 'hsl(45, 100%, 20%)' }}>Items</th>
                        <th className="px-2 sm:px-4 py-3 text-left font-semibold text-xs sm:text-sm" style={{ color: 'hsl(45, 100%, 20%)' }}>Priority</th>
                        <th className="px-2 sm:px-4 py-3 text-left font-semibold text-xs sm:text-sm" style={{ color: 'hsl(45, 100%, 20%)' }}>Status</th>
                        <th className="px-2 sm:px-4 py-3 text-left font-semibold text-xs sm:text-sm" style={{ color: 'hsl(45, 100%, 20%)' }}>Chef</th>
                        <th className="px-2 sm:px-4 py-3 text-left font-semibold text-xs sm:text-sm" style={{ color: 'hsl(45, 100%, 20%)' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredKots.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((kot, index) => (
                        <tr key={kot._id} className={index % 2 === 0 ? 'bg-background' : 'bg-white'}>
                          <td className="px-2 sm:px-4 py-3 text-xs sm:text-sm font-mono" style={{ color: 'hsl(45, 100%, 20%)' }}>
                            <div className="font-semibold">{kot.displayNumber || kot.kotNumber?.slice(-3) || kot.orderId?.slice(-6) || 'N/A'}</div>
                          </td>
                          <td className="px-2 sm:px-4 py-3 text-xs sm:text-sm" style={{ color: 'hsl(45, 100%, 20%)' }}>
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                              {kot.kotCount || 1} KOT{(kot.kotCount || 1) > 1 ? 's' : ''}
                            </span>
                          </td>
                          <td className="px-2 sm:px-4 py-3 text-xs sm:text-sm" style={{ color: 'hsl(45, 100%, 20%)' }}>{kot.tableNo}</td>
                          <td className="px-2 sm:px-4 py-3 text-xs sm:text-sm" style={{ color: 'hsl(45, 100%, 20%)' }}>
                            <div className="max-w-xs">
                              {kot.items && kot.items.length > 0 ? (
                                <div className="space-y-1">
                                  <div className="text-xs text-blue-600 font-medium mb-1">
                                    {kot.kotCount || 1} KOT{(kot.kotCount || 1) > 1 ? 's' : ''} • {kot.items.length} items
                                  </div>
                                  {kot.items.slice(0, 3).map((item, idx) => {
                                    const itemName = typeof item === 'string' ? item : (item.name || item.itemName || 'Unknown Item');
                                    const quantity = typeof item === 'object' ? (item.quantity || 1) : 1;
                                    const kotNumber = typeof item === 'object' ? (item.kotNumber || 1) : 1;
                                    const note = typeof item === 'object' ? item.note : null;
                                    
                                    return (
                                      <div key={idx} className="truncate flex items-center gap-1">
                                        <span className="bg-blue-500 text-white px-1 rounded text-xs">K{kotNumber}</span>
                                        <span>• {itemName} x{quantity}</span>
                                        {note && <span className="text-gray-500 text-xs"> ({note})</span>}
                                      </div>
                                    );
                                  })}
                                  {kot.items.length > 3 && (
                                    <div className="text-gray-500 text-xs">+{kot.items.length - 3} more items</div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-gray-500">No items</span>
                              )}
                            </div>
                          </td>
                          <td className="px-2 sm:px-4 py-3">
                            <span className={`px-2 py-1 rounded text-xs ${getPriorityColor(kot.priority)}`}>
                              {kot.priority}
                            </span>
                          </td>
                          <td className="px-2 sm:px-4 py-3">
                            <span className={`px-2 py-1 rounded text-xs ${getStatusColor(kot.status)}`}>
                              {kot.status}
                            </span>
                          </td>
                          <td className="px-2 sm:px-4 py-3 text-xs sm:text-sm" style={{ color: 'hsl(45, 100%, 20%)' }}>{kot.assignedChef?.name || 'Unassigned'}</td>
                          <td className="px-2 sm:px-4 py-3">
                            <div className="flex flex-col sm:flex-row gap-1">
                              {kot.status === 'preparing' && (
                                <button
                                  onClick={() => updateKOTStatus(kot._id, 'ready', kot.orderId)}
                                  className="bg-green-500 text-white px-2 py-1 rounded text-xs hover:bg-green-600 whitespace-nowrap"
                                >
                                  Mark Ready
                                </button>
                              )}
                              <button
                                onClick={() => printKOT(kot)}
                                className="bg-purple-500 text-white px-2 py-1 rounded text-xs hover:bg-purple-600 whitespace-nowrap flex items-center gap-1"
                                title="Print KOT"
                              >
                                <Printer className="w-3 h-3" />
                                Print
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                <Pagination
                  currentPage={currentPage}
                  totalPages={Math.ceil(filteredKots.length / itemsPerPage)}
                  onPageChange={setCurrentPage}
                  itemsPerPage={itemsPerPage}
                  totalItems={filteredKots.length}
                />
                
                {filteredKots.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    {searchQuery ? 'No KOTs found matching your search.' : 'No KOTs found.'}
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'create' && (
              <div className="p-6">
                <div className="max-w-2xl mx-auto">
                  <h2 className="text-xl font-bold mb-4" style={{ color: 'hsl(45, 100%, 20%)' }}>Create New KOT</h2>
                  <form onSubmit={createKOT} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2 text-text">Select Order</label>
                <select
                  value={kotForm.orderId}
                  onChange={(e) => {
                    const selectedOrder = orders.find(o => o._id === e.target.value);
                    setKotForm({
                      ...kotForm,
                      orderId: e.target.value,
                      tableNo: selectedOrder?.tableNo || '',
                      items: selectedOrder?.items || []
                    });
                  }}
                  className="w-full p-3 border-2 border-border rounded-lg bg-white text-text focus:border-primary focus:outline-none transition-colors"
                  style={{ borderColor: 'hsl(45, 100%, 85%)', backgroundColor: 'white', color: 'hsl(45, 100%, 20%)' }}
                  required
                >
                  <option value="">Select Order</option>
                  {orders.map(order => (
                    <option key={order._id} value={order._id}>
                      Order {order._id.slice(-6)} - Table {order.tableNo}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-text">Table Number</label>
                <select
                  value={kotForm.tableNo}
                  onChange={(e) => setKotForm({...kotForm, tableNo: e.target.value})}
                  className="w-full p-3 border-2 border-border rounded-lg bg-white text-text focus:border-primary focus:outline-none transition-colors"
                  style={{ borderColor: 'hsl(45, 100%, 85%)', backgroundColor: 'white', color: 'hsl(45, 100%, 20%)' }}
                  required
                >
                  <option value="">Select Table</option>
                  {Array.isArray(tables) && tables.map(table => (
                    <option key={table._id} value={table.tableNumber}>
                      Table {table.tableNumber}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-text">Priority Level</label>
                <select
                  value={kotForm.priority}
                  onChange={(e) => setKotForm({...kotForm, priority: e.target.value})}
                  className="w-full p-3 border-2 border-border rounded-lg bg-white text-text focus:border-primary focus:outline-none transition-colors"
                  style={{ borderColor: 'hsl(45, 100%, 85%)', backgroundColor: 'white', color: 'hsl(45, 100%, 20%)' }}
                >
                  <option value="low">Low Priority</option>
                  <option value="normal">Normal Priority</option>
                  <option value="high">High Priority</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-text">Estimated Time (minutes)</label>
                <input
                  type="number"
                  placeholder="Enter estimated time"
                  value={kotForm.estimatedTime}
                  onChange={(e) => setKotForm({...kotForm, estimatedTime: e.target.value})}
                  className="w-full p-3 border-2 border-border rounded-lg bg-white text-text focus:border-primary focus:outline-none transition-colors"
                  style={{ borderColor: 'hsl(45, 100%, 85%)', backgroundColor: 'white', color: 'hsl(45, 100%, 20%)' }}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-text">Assign Chef</label>
                <select
                  value={kotForm.assignedChef}
                  onChange={(e) => setKotForm({...kotForm, assignedChef: e.target.value})}
                  className="w-full p-3 border-2 border-border rounded-lg bg-white text-text focus:border-primary focus:outline-none transition-colors"
                  style={{ borderColor: 'hsl(45, 100%, 85%)', backgroundColor: 'white', color: 'hsl(45, 100%, 20%)' }}
                >
                  <option value="">Select Chef</option>
                  {chefs.map(chef => (
                    <option key={chef._id} value={chef._id}>
                      {chef.name || chef.username}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full p-3 rounded-lg font-semibold transition-colors shadow-md"
                style={{ backgroundColor: 'hsl(45, 43%, 58%)', color: 'hsl(45, 100%, 20%)' }}
                onMouseOver={(e) => e.target.style.backgroundColor = 'hsl(45, 32%, 46%)'}
                onMouseOut={(e) => e.target.style.backgroundColor = 'hsl(45, 43%, 58%)'}
              >
                Create KOT
              </button>
                  </form>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default KOT;