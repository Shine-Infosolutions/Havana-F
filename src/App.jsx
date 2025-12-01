import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AppProvider } from './context/AppContext';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './components/Dashboard';
import EasyDashboard from './components/easy dashboard/easydashboard';
import RoomList from './components/room/RoomList';
import CategoryList from './components/category/CategoryList';
import RoomStatus from './components/room/RoomStatus';
import Booking from './components/booking/Booking';
import BookingForm from './components/booking/BookingForm';
import EditBookingForm from './components/booking/EditBookingForm';
import BookingDetails from './components/booking/BookingDetails';
import Users from './components/Users/Users';
import LaganCalendar from './components/Banquet/pages/Calendar/LaganCalendar';
import ListBooking from './components/Banquet/pages/Students/ListBooking';
import AddBooking from './components/Banquet/pages/Students/AddBooking';
import UpdateBooking from './components/Banquet/pages/Students/UpdateBooking';
import MenuPlanManager from './components/Banquet/components/MenuPlanManager';
import Invoice from './components/Banquet/pages/Students/Invoice';
import MenuView from './components/Banquet/pages/Students/MenuView';
import HotelCheckout from './components/booking/HotelCheckout';
import HotelInvoice from './components/booking/HotelInvoice';
import HotelInventory from './components/Inventory/HotelInventory';
import RoomService from './components/room/RoomService';
import RoomServiceBilling from './components/room/RoomServiceBilling';
import BillLookup from './components/room/BillLookup';
import SaleBill from './components/room/SaleBill';

// Restaurant Components
import MenuItems from './components/restaurant/MenuItems';
import Order from './components/restaurant/Order';
import LiveOrders from './components/restaurant/LiveOrders';
import AllOrders from './components/restaurant/AllOrders';
import KOT from './components/restaurant/KOT';
import GSTSettings from './components/restaurant/GSTSettings';
import RestaurantInvoice from './components/restaurant/RestaurantInvoice';
import SharedHotelInvoice from './components/booking/SharedHotelInvoice';

import './App.css'

function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <Router>
          <Toaster position="top-right" />
          <Routes>
            {/* Public Routes */}
            <Route path="/shared-invoice/:id" element={<SharedHotelInvoice />} />
            <Route path="/login" element={<Login />} />
            
            {/* Protected Routes */}
            <Route path="/" element={
              <PrivateRoute>
                <Layout />
              </PrivateRoute>
            }>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="easy-dashboard" element={<EasyDashboard />} />
            
            {/* Room Management Routes */}
            <Route path="rooms" element={<RoomList />} />
            <Route path="room-categories" element={<CategoryList />} />
            <Route path="room-status" element={<RoomStatus />} />
            
            {/* Booking Routes */}
            <Route path="booking" element={<Booking />} />
            <Route path="bookingform" element={<BookingForm />} />
            <Route path="edit-booking" element={<EditBookingForm />} />
            <Route path="booking-details/:bookingId" element={<BookingDetails />} />
            <Route path="reservation" element={<div>Reservation Component</div>} />
            
            {/* Inventory Routes */}
            <Route path="inventory" element={<HotelInventory />} />
            
            {/* Banquet Routes */}
            <Route path="banquet/calendar" element={<LaganCalendar />} />
            <Route path="banquet/add-booking" element={<AddBooking />} />
            <Route path="banquet/update-booking/:id" element={<UpdateBooking />} />
            <Route path="banquet/list-booking" element={<ListBooking />} />
            <Route path="banquet/menu-plan-manager" element={<MenuPlanManager />} />
            <Route path="banquet/invoice/:id" element={<Invoice />} />
            <Route path="banquet/menu-view/:id" element={<MenuView />} />
            
            {/* Users Routes - Admin Only */}
            <Route path="users" element={
              <PrivateRoute requiredRoles={['ADMIN']}>
                <Users />
              </PrivateRoute>
            } />
            
            {/* Room Service Routes */}
            <Route path="room-service" element={<RoomService />} />
            <Route path="room-service-billing" element={<RoomServiceBilling />} />
            <Route path="bill-lookup" element={<BillLookup />} />
            <Route path="sale-bill" element={<SaleBill />} />
            
            {/* Restaurant Routes */}
            <Route path="restaurant/menu-items" element={<MenuItems />} />
            <Route path="restaurant/create-order" element={<Order />} />
            <Route path="restaurant/live-orders" element={<LiveOrders />} />
            <Route path="restaurant/all-orders" element={<AllOrders />} />
            <Route path="restaurant/kot" element={<KOT />} />
            <Route path="restaurant/gst-settings" element={<GSTSettings />} />
            <Route path="restaurant/invoice/:orderId" element={<RestaurantInvoice />} />
            
            {/* Checkout Routes */}
            <Route path="hotel-checkout" element={<HotelCheckout />} />
            <Route path="invoice" element={<HotelInvoice />} />
          </Route>
          
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AppProvider>
    </AuthProvider>
  );
}

export default App
