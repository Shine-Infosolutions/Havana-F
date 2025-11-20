import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AppProvider } from './context/AppContext';
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
import './App.css'

function App() {
  return (
    <AppProvider>
      <Router>
        <Toaster position="top-right" />
        <Routes>
          {/* Auth Routes */}
          <Route path="/login" element={<Login />} />
          
          {/* Protected Routes */}
          <Route path="/" element={<Layout />}>
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
            
            {/* Users Routes */}
            <Route path="users" element={<Users />} />
            
            {/* Checkout Routes */}
            <Route path="hotel-checkout" element={<HotelCheckout />} />
            <Route path="invoice" element={<HotelInvoice />} />
          </Route>
          
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AppProvider>
  );
}

export default App
