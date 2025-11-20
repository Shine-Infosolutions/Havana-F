import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Edit, XCircle, CheckCircle, Search, X, FileText, Trash2 } from "lucide-react";
import { useAppContext } from "../../context/AppContext";
import Pagination from "../common/Pagination";
import DashboardLoader from '../DashboardLoader';
import HotelCheckout from './HotelCheckout';



const BookingPage = () => {
  const navigate = useNavigate();
  const { axios } = useAppContext();
  const [bookings, setBookings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");

  const [showInvoice, setShowInvoice] = useState(false);
  const [currentInvoice, setCurrentInvoice] = useState(null);
  const [grcSearchResult, setGrcSearchResult] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [showCheckout, setShowCheckout] = useState(false);
  const [selectedBookingForCheckout, setSelectedBookingForCheckout] = useState(null);

  const getAuthToken = () => localStorage.getItem("token");

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = getAuthToken();
      const [bookingsRes, roomsRes, categoriesRes] = await Promise.all([
        axios.get("/api/bookings/all", { headers: { Authorization: `Bearer ${token}` } }),
        axios.get("/api/rooms/all", { headers: { Authorization: `Bearer ${token}` } }),
        axios.get("/api/categories/all", { headers: { Authorization: `Bearer ${token}` } })
      ]);
      
      const bookingsData = bookingsRes.data;
      const roomsData = Array.isArray(roomsRes.data) ? roomsRes.data : [];
      const categoriesData = Array.isArray(categoriesRes.data) ? categoriesRes.data : [];
      
      setRooms(roomsData);
      setCategories(categoriesData);
      
      const bookingsArray = Array.isArray(bookingsData) ? bookingsData : bookingsData.bookings || [];

      const mappedBookings = bookingsArray.map((b) => {
        const room = roomsData.find(r => r.room_number == b.roomNumber || r.roomNumber == b.roomNumber);
        const category = room ? categoriesData.find(c => c._id == room.categoryId || c.id == room.categoryId) : null;
        
        return {
          id: b._id || "N/A",
          grcNo: b.grcNo || "N/A",
          name: b.name || "N/A",
          mobileNo: b.mobileNo || "N/A",
          roomNumber: b.roomNumber || "N/A",
          category: category?.name || category?.categoryName || "N/A",
          checkIn: b.checkInDate
            ? new Date(b.checkInDate).toLocaleDateString()
            : "N/A",
          checkOut: b.checkOutDate
            ? new Date(b.checkOutDate).toLocaleDateString()
            : "N/A",
          status: b.status || "N/A",
          paymentStatus: b.paymentStatus || "Pending",
          vip: b.vip || false,
          _raw: b,
        };
      });

      setBookings(mappedBookings);
    } catch (err) {
      setError(err.message);
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      setIsInitialLoading(true);
      await fetchData();
      setIsInitialLoading(false);
    };
    loadInitialData();
  }, []);

  const fetchBookingByGrc = async (grcNo) => {
    try {
      const token = getAuthToken();
      const res = await axios.get(`/api/bookings/fetch-by-grc/${grcNo}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGrcSearchResult(res.data);
    } catch (err) {
      setError(`No booking found for GRC: ${grcNo}`);
      setGrcSearchResult(null);
    }
  };

  const filteredBookings = bookings.filter(
    (b) =>
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.roomNumber.toString().includes(search.toString()) ||
      b.grcNo.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedBookings = filteredBookings.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const toggleBookingStatus = async (bookingId) => {
    try {
      const booking = bookings.find((b) => b.id === bookingId);
      if (!booking) throw new Error("Booking not found");

      const token = getAuthToken();
      
      if (booking.status === "Booked") {
        // Unbook the room (set to Cancelled)
        await axios.put(`/api/bookings/unbook/${bookingId}`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Update room status to Available
        await updateRoomStatus(booking.roomNumber, "Available");
      } else if (booking.status === "Cancelled" || booking.status !== "Booked") {
        // Book the room (update status to Booked)
        await axios.put(`/api/bookings/update/${bookingId}`, {
          status: "Booked"
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Update room status to Booked
        await updateRoomStatus(booking.roomNumber, "Booked");
      }

      // Refresh data to get updated status
      fetchData();
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error("Error toggling booking status:", err);
    }
  };

  const updateRoomStatus = async (roomNumber, status) => {
    try {
      const token = getAuthToken();
      const room = rooms.find(r => r.room_number == roomNumber || r.roomNumber == roomNumber);
      
      if (room) {
        await axios.put(`/api/rooms/update/${room._id || room.id}`, { status }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } catch (err) {
      console.error("Error updating room status:", err);
    }
  };

  const updatePaymentStatus = async (bookingId, newPaymentStatus) => {
    try {
      const booking = bookings.find((b) => b.id === bookingId);
      if (!booking) throw new Error("Booking not found");

      const token = getAuthToken();
      const res = await axios.put(`/api/bookings/update/${bookingId}`, {
        paymentStatus: newPaymentStatus,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId
            ? {
                ...b,
                paymentStatus: newPaymentStatus,
                _raw: {
                  ...b._raw,
                  paymentStatus: newPaymentStatus,
                },
              }
            : b
        )
      );

      setError(null);
    } catch (err) {
      console.error("Error updating payment status:", err);
      setError(err.response?.data?.message || err.message || "Failed to update payment status");
    }
  };

  const openCheckout = (bookingId) => {
    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking) {
      setError("Booking not found");
      return;
    }
    setSelectedBookingForCheckout(booking._raw);
    setShowCheckout(true);
  };

  const handleCheckoutComplete = () => {
    fetchData(); // Refresh the bookings list
  };

  const generateInvoice = async (bookingId) => {
    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking) {
      setError("Booking not found");
      return;
    }
    
    try {
      const token = getAuthToken();
      
      // Create checkout for this booking if it doesn't exist
      let checkoutId;
      try {
        const checkoutRes = await axios.post('/api/checkout/create', 
          { bookingId },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        checkoutId = checkoutRes.data.checkout._id;
      } catch (error) {
        // If checkout creation fails, use booking ID as fallback
        checkoutId = bookingId;
      }
      
      // Transform booking data to invoice format
      const invoiceBookingData = {
        ...booking._raw,
        // Add any additional fields needed for invoice
        customerName: booking.name,
        phoneNumber: booking._raw.mobileNo,
        totalAmount: booking._raw.rate || 0,
        amount: booking._raw.rate || 0
      };
      
      // Navigate to invoice page with transformed data
      navigate('/invoice', { 
        state: { 
          bookingData: invoiceBookingData,
          checkoutId: checkoutId,
          guestName: booking.name,
          roomNumber: booking.roomNumber,
          grcNo: booking.grcNo
        } 
      });
    } catch (error) {
      console.error('Error generating invoice:', error);
      setError('Failed to generate invoice');
    }
  };

  const deleteBooking = async (bookingId) => {
    if (!window.confirm("Are you sure you want to delete this booking?")) return;
    
    try {
      const token = getAuthToken();
      await axios.delete(`/api/bookings/delete/${bookingId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBookings(prev => prev.filter(b => b.id !== bookingId));
      showToast.success('Booking deleted successfully');
      setError(null);
    } catch (err) {
      console.error("Error deleting booking:", err);
      showToast.error(err.response?.data?.message || err.message || "Failed to delete booking");
    }
  };

  const updateBooking = async (bookingId, updatedData) => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/bookings/update/${bookingId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatedData),
        }
      );
      
      const responseData = await res.json();

      if (!res.ok) throw new Error(responseData.message || "Update failed");

      setError(null);
      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId
            ? {
                ...b,
                grcNo: responseData.grcNo || b.grcNo,
                name: responseData.name || b.name,
                mobileNo: responseData.mobileNo || b.mobileNo,
                roomNumber: responseData.roomNumber || b.roomNumber,
                checkIn: responseData.checkInDate ? new Date(responseData.checkInDate).toLocaleDateString() : b.checkIn,
                checkOut: responseData.checkOutDate ? new Date(responseData.checkOutDate).toLocaleDateString() : b.checkOut,
                status: responseData.status || b.status,
                vip: responseData.vip !== undefined ? responseData.vip : b.vip,
                _raw: responseData,
              }
            : b
        )
      );
      setEditId(null);
    } catch (error) {
      setError(`Error: ${error.message}`);
      console.error("Update error:", error);
    }
  };

  const updateBookingStatus = async (bookingId, newStatus) => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/bookings/update/${bookingId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );
      
      const responseData = await res.json();

      if (!res.ok) throw new Error(responseData.message || "Update failed");

      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId ? { ...b, status: newStatus } : b
        )
      );
      setError(null);
    } catch (error) {
      setError(`Error updating status: ${error.message}`);
      console.error("Status update error:", error);
    }
  };

  if (isInitialLoading) {
    return <DashboardLoader pageName="Bookings" />;
  }

  return (
    <div className="min-h-screen" style={{backgroundColor: 'hsl(45, 100%, 95%)'}}>
      <div className="p-6">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-extrabold" style={{color: 'hsl(45, 100%, 20%)'}}>
            Bookings
          </h1>
        <button
          onClick={() => navigate("/bookingform")}
          className="font-semibold py-2 px-4 sm:px-6 rounded-lg shadow-md transition duration-300 text-sm sm:text-base"
          style={{ backgroundColor: 'hsl(45, 43%, 58%)', color: 'white' }}
        >
          Add Booking
        </button>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search by name, room number, or GRC No..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:ring-2 w-full shadow-sm transition duration-300 text-sm sm:text-base"
            style={{ 
              backgroundColor: 'white', 
              border: '1px solid hsl(45, 100%, 85%)',
              focusRingColor: 'hsl(45, 43%, 58%)'
            }}
          />
          <Search className="absolute left-3 top-3 text-gray-400" size={20} />
        </div>
        <button
          onClick={() => fetchBookingByGrc(search)}
          className="font-semibold px-4 py-3 rounded-lg shadow-md transition duration-300 text-sm sm:text-base whitespace-nowrap"
          style={{ backgroundColor: 'hsl(45, 43%, 58%)', color: 'white' }}
        >
          Search GRC
        </button>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-lg relative mb-4 flex items-center justify-between shadow-sm" style={{ backgroundColor: 'hsl(0, 100%, 95%)', border: '1px solid hsl(0, 100%, 85%)', color: 'hsl(0, 100%, 30%)' }}>
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="transition duration-300"
            style={{ color: 'hsl(0, 100%, 30%)' }}
          >
            <X size={20} />
          </button>
        </div>
      )}

      {grcSearchResult && (
        <div className="px-4 py-3 rounded-lg relative mb-4" style={{ backgroundColor: 'hsl(120, 100%, 95%)', border: '1px solid hsl(120, 100%, 85%)', color: 'hsl(120, 100%, 30%)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">GRC Search Result:</p>
              <p>Name: {grcSearchResult.name}</p>
              <p>GRC: {grcSearchResult.grcNo}</p>
              <p>Room: {grcSearchResult.roomNumber}</p>
            </div>
            <button
              onClick={() => setGrcSearchResult(null)}
              className="transition duration-300"
              style={{ color: 'hsl(120, 100%, 30%)' }}
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 mx-auto" style={{borderColor: 'hsl(45, 43%, 58%)'}}></div>
          <p className="mt-4" style={{ color: 'hsl(45, 100%, 20%)' }}>Loading bookings...</p>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block rounded-xl shadow-lg overflow-hidden bg-white" style={{ border: '1px solid hsl(45, 100%, 85%)' }}>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="border-b" style={{ backgroundColor: 'hsl(45, 100%, 90%)', borderColor: 'hsl(45, 100%, 85%)' }}>
                <tr>
                  <th className="px-2 sm:px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'hsl(45, 100%, 20%)' }}>
                    GRC No
                  </th>
                  <th className="px-2 sm:px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'hsl(45, 100%, 20%)' }}>
                    Name
                  </th>
                  <th className="px-2 sm:px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'hsl(45, 100%, 20%)' }}>
                    Room
                  </th>
                  <th className="px-2 sm:px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider hidden lg:table-cell" style={{ color: 'hsl(45, 100%, 20%)' }}>
                    Category
                  </th>
                  <th className="px-2 sm:px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider hidden lg:table-cell" style={{ color: 'hsl(45, 100%, 20%)' }}>
                    Check In
                  </th>
                  <th className="px-2 sm:px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider hidden lg:table-cell" style={{ color: 'hsl(45, 100%, 20%)' }}>
                    Check Out
                  </th>
                  <th className="px-2 sm:px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'hsl(45, 100%, 20%)' }}>
                    Status
                  </th>
                  <th className="px-2 sm:px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider hidden lg:table-cell" style={{ color: 'hsl(45, 100%, 20%)' }}>
                    Payment
                  </th>
                  <th className="px-2 sm:px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider" style={{ color: 'hsl(45, 100%, 20%)' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ backgroundColor: 'white', borderColor: 'hsl(45, 100%, 90%)' }}>
                {paginatedBookings.map((booking) => (
                  <tr
                    key={booking.id}
                    className="transition-colors duration-200"
                  >
                    <td className="px-2 sm:px-4 py-3 whitespace-nowrap text-sm" style={{ color: 'hsl(45, 100%, 20%)' }}>
                      {booking.grcNo}
                    </td>
                    <td className="px-2 sm:px-4 py-3 whitespace-nowrap text-sm" style={{ color: 'hsl(45, 100%, 20%)' }}>
                      {booking.name}
                    </td>
                    <td className="px-2 sm:px-4 py-3 whitespace-nowrap text-sm" style={{ color: 'hsl(45, 100%, 20%)' }}>
                      {booking.roomNumber}
                    </td>
                    <td className="px-2 sm:px-4 py-3 whitespace-nowrap text-sm hidden lg:table-cell" style={{ color: 'hsl(45, 100%, 20%)' }}>
                      {booking.category}
                    </td>
                    <td className="px-2 sm:px-4 py-3 whitespace-nowrap text-sm hidden lg:table-cell" style={{ color: 'hsl(45, 100%, 20%)' }}>
                      {booking.checkIn}
                    </td>
                    <td className="px-2 sm:px-4 py-3 whitespace-nowrap text-sm hidden lg:table-cell" style={{ color: 'hsl(45, 100%, 20%)' }}>
                      {booking.checkOut}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <select
                        value={booking.status}
                        onChange={(e) => updateBookingStatus(booking.id, e.target.value)}
                        className={`px-2 py-1 rounded border text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                          booking.status === "Booked"
                            ? "bg-green-100 text-green-800 border-green-300"
                            : booking.status === "Cancelled"
                            ? "bg-red-100 text-red-800 border-red-300"
                            : booking.status === "Checked In"
                            ? "bg-blue-100 text-blue-800 border-blue-300"
                            : "bg-yellow-100 text-yellow-800 border-yellow-300"
                        }`}
                      >
                        <option value="Booked">Booked</option>
                        <option value="Checked In">Checked In</option>
                        <option value="Checked Out">Checked Out</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <select
                        value={booking.status === "Checked Out" ? "Paid" : booking.paymentStatus}
                        onChange={(e) => {
                          updatePaymentStatus(booking.id, e.target.value);
                          if (e.target.value === "Paid") {
                            updateBookingStatus(booking.id, "Checked Out");
                          }
                        }}
                        className="px-2 py-1 rounded border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 w-full"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Paid">Paid</option>
                        <option value="Failed">Failed</option>
                        <option value="Partial">Partial</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      <div className="flex space-x-1 justify-center items-center">
                        <button
                          onClick={() => navigate('/edit-booking', { state: { editBooking: booking._raw } })}
                          title="Edit Booking"
                          className="p-1.5 rounded-full text-blue-600 transition duration-300"
                        >
                          <Edit size={16} />
                        </button>

                        {booking.status === "Checked Out" && (
                          <button
                            onClick={() => generateInvoice(booking.id)}
                            title="Generate Bill"
                            className="p-1.5 rounded-full text-green-600 transition duration-300"
                          >
                            <FileText size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => openCheckout(booking.id)}
                          disabled={booking.status === 'Checked Out'}
                          className="bg-purple-600 text-white px-2 py-1 rounded text-xs transition duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                          {booking.status === 'Checked Out' ? 'Checked Out' : 'Checkout'}
                        </button>
                        <button
                          onClick={() => deleteBooking(booking.id)}
                          title="Delete Booking"
                          className="p-1.5 rounded-full text-red-600 transition duration-300"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-4">
          {paginatedBookings.map((booking) => (
            <div
              key={booking.id}
              className="rounded-lg shadow-md p-4 bg-white"
              style={{ border: '1px solid hsl(45, 100%, 85%)' }}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-lg" style={{ color: 'hsl(45, 100%, 20%)' }}>{booking.name}</h3>
                  <p className="text-sm" style={{ color: 'hsl(45, 100%, 40%)' }}>GRC: {booking.grcNo}</p>
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    booking.status === "Booked"
                      ? "bg-green-100 text-green-800"
                      : booking.status === "Cancelled"
                      ? "bg-red-100 text-red-800"
                      : booking.status === "Checked In"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {booking.status}
                </span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3 text-sm">
                <div>
                  <span style={{ color: 'hsl(45, 100%, 40%)' }}>Room:</span>
                  <span className="ml-1 font-medium" style={{ color: 'hsl(45, 100%, 20%)' }}>{booking.roomNumber}</span>
                </div>
                <div>
                  <span style={{ color: 'hsl(45, 100%, 40%)' }}>Category:</span>
                  <span className="ml-1 font-medium" style={{ color: 'hsl(45, 100%, 20%)' }}>{booking.category}</span>
                </div>
                <div>
                  <span style={{ color: 'hsl(45, 100%, 40%)' }}>Check In:</span>
                  <span className="ml-1 font-medium" style={{ color: 'hsl(45, 100%, 20%)' }}>{booking.checkIn}</span>
                </div>
                <div>
                  <span style={{ color: 'hsl(45, 100%, 40%)' }}>Check Out:</span>
                  <span className="ml-1 font-medium" style={{ color: 'hsl(45, 100%, 20%)' }}>{booking.checkOut}</span>
                </div>
                <div>
                  <span style={{ color: 'hsl(45, 100%, 40%)' }}>Payment:</span>
                  <select
                    value={booking.status === "Checked Out" ? "Paid" : booking.paymentStatus}
                    onChange={(e) => updatePaymentStatus(booking.id, e.target.value)}
                    className="ml-1 px-2 py-1 rounded border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Paid">Paid</option>
                    <option value="Failed">Failed</option>
                    <option value="Partial">Partial</option>
                  </select>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row justify-end gap-2 pt-3 border-t" style={{ borderColor: 'hsl(45, 100%, 90%)' }}>
                <button
                  onClick={() => navigate('/edit-booking', { state: { editBooking: booking._raw } })}
                  className="p-2 rounded-full transition duration-300"
                  style={{ color: 'hsl(45, 43%, 58%)' }}
                  title="Edit"
                >
                  <Edit size={18} />
                </button>

                {booking.status === "Checked Out" && (
                  <button
                    onClick={() => generateInvoice(booking.id)}
                    className="p-2 rounded-full transition duration-300"
                    style={{ color: 'hsl(120, 60%, 40%)' }}
                    title="Invoice"
                  >
                    <FileText size={18} />
                  </button>
                )}
                <button
                  onClick={() => openCheckout(booking.id)}
                  disabled={booking.status === 'Checked Out'}
                  className="px-3 py-1 rounded text-sm transition duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  style={{ 
                    backgroundColor: booking.status === 'Checked Out' ? '#9CA3AF' : 'hsl(45, 71%, 69%)', 
                    color: booking.status === 'Checked Out' ? '#6B7280' : 'hsl(45, 100%, 20%)' 
                  }}
                >
                  {booking.status === 'Checked Out' ? 'Checked Out' : 'Checkout'}
                </button>
                <button
                  onClick={() => deleteBooking(booking.id)}
                  className="p-2 rounded-full transition duration-300"
                  style={{ color: 'hsl(0, 60%, 50%)' }}
                  title="Delete"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            itemsPerPage={itemsPerPage}
            totalItems={filteredBookings.length}
          />
        </>
      )}



      {showInvoice && currentInvoice && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex justify-center items-center p-4">
          <div className="p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" style={{ backgroundColor: 'hsl(45, 100%, 95%)' }}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-bold" style={{ color: 'hsl(45, 100%, 20%)' }}>Invoice</h3>
              <button
                onClick={() => setShowInvoice(false)}
                className="transition duration-300"
                style={{ color: 'hsl(45, 100%, 40%)' }}
              >
                <X size={24} />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="font-semibold">Invoice Number:</p>
                  <p>{currentInvoice.invoiceNumber}</p>
                </div>
                <div>
                  <p className="font-semibold">Date:</p>
                  <p>{new Date(currentInvoice.issueDate || Date.now()).toLocaleDateString()}</p>
                </div>
              </div>
              <div>
                <p className="font-semibold">Guest Details:</p>
                <p>{currentInvoice.booking?.name}</p>
                <p>Room: {currentInvoice.booking?.roomNumber}</p>
              </div>
              <div>
                <p className="font-semibold">Items:</p>
                {currentInvoice.items?.map((item, index) => (
                  <div key={index} className="flex justify-between">
                    <span>{item.description}</span>
                    <span>₹{item.amount}</span>
                  </div>
                ))}
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>₹{currentInvoice.subTotal}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax:</span>
                  <span>₹{currentInvoice.tax}</span>
                </div>
                <div className="flex justify-between font-bold text-lg">
                  <span>Total:</span>
                  <span>₹{currentInvoice.totalAmount}</span>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-4 mt-6">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded transition duration-300"
                style={{ backgroundColor: 'hsl(45, 43%, 58%)', color: 'white' }}
              >
                Print
              </button>
              <button
                onClick={() => setShowInvoice(false)}
                className="px-4 py-2 rounded transition duration-300"
                style={{ backgroundColor: 'hsl(45, 100%, 85%)', color: 'hsl(45, 100%, 20%)' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {showCheckout && selectedBookingForCheckout && (
        <HotelCheckout
          booking={selectedBookingForCheckout}
          onClose={() => {
            setShowCheckout(false);
            setSelectedBookingForCheckout(null);
          }}
          onCheckoutComplete={handleCheckoutComplete}
        />
      )}
      </div>
    </div>
  );
};

export default BookingPage;
