import React, { useState, useEffect } from "react";
import { useAppContext } from "../../context/AppContext";
import CountdownTimer from "./CountdownTimer";

import { Wifi, WifiOff } from 'lucide-react';

const LiveOrders = () => {
  const { axios } = useAppContext();
  const [orders, setOrders] = useState([]);
  const [itemStates, setItemStates] = useState({});
  
  const [isConnected] = useState(false);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const [kotResponse, orderResponse] = await Promise.all([
        axios.get('/api/kot/all', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('/api/restaurant-orders/all', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      
      console.log('KOT Response:', kotResponse.data);
      console.log('Order Response:', orderResponse.data);
      
      // Create a map of orders by ID for quick lookup
      const orderMap = new Map();
      orderResponse.data.forEach(order => {
        orderMap.set(order._id.toString(), order);
      });
      
      // Process KOT data with pricing from restaurant orders
      const activeOrders = kotResponse.data
        .filter(kot => {
          console.log('KOT status:', kot.status);
          return kot.status !== 'completed' && kot.status !== 'cancelled';
        })
        .map(kot => {
          const restaurantOrder = orderMap.get(kot.orderId.toString());
          console.log('Matching order for KOT:', kot.orderId, restaurantOrder);
          
          return {
            _id: kot._id,
            kotId: kot._id,
            tableNo: kot.tableNo,
            customerName: restaurantOrder?.customerName || 'Guest',
            status: kot.status,
            createdAt: kot.createdAt,
            amount: restaurantOrder?.amount || 0,
            items: kot.items?.map((item, index) => {
              const orderItem = restaurantOrder?.items?.find(oi => 
                oi.itemName === item.itemName
              );
              return {
                name: item.itemName,
                quantity: item.quantity,
                price: orderItem?.price || 0,
                prepTime: 0,
                status: 'pending'
              };
            }) || []
          };
        });
      
      console.log('Active Orders:', activeOrders);
      setOrders(activeOrders);
      setItemStates({});
    } catch (error) {
      console.error('Error fetching orders data:', error);
      setOrders([]);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);
  


  const updateOrderStatus = async (kotId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      
      // Find the KOT and its corresponding restaurant order
      const order = orders.find(o => o._id === kotId);
      if (!order) return;
      
      // Update KOT status
      await axios.patch(`/api/kot/${kotId}/status`, {
        status: newStatus
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update restaurant order status using the orderId from KOT
      const kotResponse = await axios.get('/api/kot/all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const kot = kotResponse.data.find(k => k._id === kotId);
      
      if (kot && kot.orderId) {
        await axios.patch(`/api/restaurant-orders/${kot.orderId}/status`, {
          status: newStatus
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      
      fetchOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Live Orders Dashboard</h1>
            <p className="text-gray-600">Manage kitchen orders</p>
          </div>
          <div className="flex items-center gap-2">
            <Wifi className="w-5 h-5 text-green-500" />
            <span className="text-sm font-medium text-green-600">
              System Active
            </span>
          </div>
        </div>
      </div>

      {/* Active Orders Count */}
      <div className="mb-6">
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800">Active Orders ({orders.length})</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {orders.map((order) => (
          <div key={order._id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 min-h-[320px] flex flex-col">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3">
              <div className="flex-1">
                <div className="text-xs sm:text-sm text-gray-500 truncate">
                  Order# {order._id.slice(-4)} / {order.orderType || 'Dine In'}
                </div>
                <div className="text-xs text-gray-400">
                  {new Date(order.createdAt).toLocaleDateString()} {new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>
              </div>
            </div>

            {/* Table Info */}
            <div className="flex items-center mb-3">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-semibold mr-2">
                {order.tableNo || 'T'}
              </div>
              <div className="flex-1">
                <div className="text-xs text-gray-500">Table/Room</div>
                <div className="text-sm font-medium truncate">{order.tableNo || 'N/A'}</div>
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center justify-end mb-3">
              <div className="text-xs sm:text-sm text-orange-500 font-medium">
                {order.items?.length || 0} Items →
              </div>
            </div>

            {/* Items List */}
            <div className="flex-1 mb-3">
              <div className="grid grid-cols-6 text-xs text-gray-500 font-medium border-b pb-2 mb-2 gap-2">
                <span className="text-center">✓</span>
                <span className="col-span-3">Items</span>
                <span className="text-right">Price</span>
                <span className="text-right">Timer</span>
              </div>
              <div className="max-h-32 sm:max-h-40 overflow-y-auto space-y-2">
                {order.items?.map((item, index) => (
                  <div key={index} className="grid grid-cols-6 text-xs sm:text-sm gap-2 py-1 border-b border-gray-100 last:border-b-0">
                    <div className="flex justify-center">
                      <input 
                        type="checkbox" 
                        className="w-3 h-3" 
                        checked={itemStates[`${order._id}-${index}`]?.checked || itemStates[`${order._id}-${index}`]?.status === 'delivered'}
                        disabled={itemStates[`${order._id}-${index}`]?.status === 'delivered'}
                        onChange={(e) => {
                          const key = `${order._id}-${index}`;
                          setItemStates(prev => ({
                            ...prev,
                            [key]: { 
                              ...prev[key], 
                              checked: e.target.checked 
                            }
                          }));
                        }}
                      />
                    </div>
                    <span 
                      className={`col-span-3 break-words text-xs leading-tight ${
                        itemStates[`${order._id}-${index}`]?.status === 'delivered' 
                          ? 'text-green-600 line-through' 
                          : itemStates[`${order._id}-${index}`]?.status === 'served' 
                          ? 'text-orange-600' 
                          : 'text-gray-700'
                      }`} 
                      title={`${item.name || 'Unknown'} x ${item.quantity || 1}`}
                    >
                      {item.name || 'Unknown'} x {item.quantity || 1}
                    </span>
                    <span className="text-right text-gray-600">₹{item.price || 0}</span>
                    <div className="text-right">
                      {item.prepTime > 0 && (
                        itemStates[`${order._id}-${index}`]?.status === 'delivered' ? (
                          <div className="inline-flex items-center px-1 py-0.5 rounded text-xs font-medium bg-green-100 text-green-600">
                            <span className="text-xs">00:00</span>
                          </div>
                        ) : (
                          <CountdownTimer 
                            orderTime={order.createdAt}
                            prepTime={item.prepTime}
                            status={order.status}
                          />
                        )
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Total */}
            <div className="border-t pt-2 mb-3">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-800 text-sm">Total</span>
                <span className="font-bold text-base sm:text-lg">₹{order.amount || 0}</span>
              </div>
            </div>

            {/* Action Buttons */}
            {order.status !== 'completed' && order.status !== 'cancelled' && (
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => updateOrderStatus(order._id, 'completed')}
                  className="w-full bg-green-500 text-white py-2 px-3 rounded text-sm font-medium hover:bg-green-600"
                >
                  Complete Order
                </button>
              </div>
            )}
            
            {/* Completed Status Display */}
            {order.status === 'completed' && (
              <div className="bg-green-100 border border-green-300 rounded-lg p-2 text-center">
                <span className="text-green-700 font-medium text-sm">✓ Order Completed</span>
              </div>
            )}
            
            {/* Cancelled Status Display */}
            {order.status === 'cancelled' && (
              <div className="bg-red-100 border border-red-300 rounded-lg p-2 text-center">
                <span className="text-red-700 font-medium text-sm">✗ Order Cancelled</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {orders.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-lg mb-2">🍳</div>
          <div className="text-gray-500">
            No active orders in kitchen
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveOrders;