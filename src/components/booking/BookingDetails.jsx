import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Phone, Mail, MapPin, Calendar, CreditCard, Bed, Users } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

const BookingDetails = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { axios } = useAppContext();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchBookingDetails();
  }, [bookingId]);

  const fetchBookingDetails = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Try multiple endpoints to find the booking
      let response;
      try {
        response = await axios.get(`/api/bookings/${bookingId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (error) {
        // If single booking endpoint fails, get from all bookings
        const allBookingsResponse = await axios.get('/api/bookings/all', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const bookingsData = Array.isArray(allBookingsResponse.data) 
          ? allBookingsResponse.data 
          : allBookingsResponse.data.bookings || [];
        
        const foundBooking = bookingsData.find(b => b._id === bookingId);
        if (!foundBooking) {
          throw new Error('Booking not found');
        }
        response = { data: foundBooking };
      }
      
      // Extract booking data properly
      const bookingData = response.data.booking || response.data;
      setBooking(bookingData);
    } catch (err) {
      setError('Failed to fetch booking details');
      console.error('Error fetching booking details:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg">{error || 'Booking not found'}</p>
          <button
            onClick={() => navigate('/booking')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Bookings
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/booking')}
            className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back to Bookings
          </button>
          <h1 className="text-2xl font-bold text-gray-800">Booking Details</h1>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Guest Information */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <User className="mr-2 text-blue-600" size={20} />
                Guest Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600">Full Name</label>
                  <p className="text-lg font-medium text-gray-800">{booking.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Mobile Number</label>
                  <p className="text-lg font-medium text-gray-800 flex items-center">
                    <Phone size={16} className="mr-2 text-gray-500" />
                    {booking.mobileNo}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Email</label>
                  <p className="text-lg font-medium text-gray-800 flex items-center">
                    <Mail size={16} className="mr-2 text-gray-500" />
                    {booking.email || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Address</label>
                  <p className="text-lg font-medium text-gray-800 flex items-center">
                    <MapPin size={16} className="mr-2 text-gray-500" />
                    {booking.address || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">ID Proof Type</label>
                  <p className="text-lg font-medium text-gray-800">{booking.idProofType || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">ID Proof Number</label>
                  <p className="text-lg font-medium text-gray-800">{booking.idProofNumber || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Room Guest Details */}
            {booking.roomGuestDetails && booking.roomGuestDetails.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                  <Users className="mr-2 text-blue-600" size={20} />
                  Room Guest Details
                </h2>
                <div className="space-y-4">
                  {booking.roomRates?.map((roomRate, index) => {
                    // Find corresponding guest details for this room
                    const guestDetails = booking.roomGuestDetails?.find(guest => guest.roomNumber === roomRate.roomNumber);
                    
                    return (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <h3 className="font-medium text-gray-800 mb-2">Room {roomRate.roomNumber}</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Adults:</span>
                            <span className="ml-2 font-medium">{guestDetails?.adults || 0}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Children:</span>
                            <span className="ml-2 font-medium">{guestDetails?.children || 0}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Rate:</span>
                            <span className="ml-2 font-medium">₹{roomRate.customRate || 0}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Extra Bed:</span>
                            <span className="ml-2 font-medium">{roomRate.extraBed ? 'Yes' : 'No'}</span>
                          </div>
                        </div>
                        {roomRate.extraBed && roomRate.extraBedStartDate && (
                          <div className="mt-2 text-xs text-green-600">
                            Extra bed from: {new Date(roomRate.extraBedStartDate).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Amendment History */}
            {booking.amendmentHistory && booking.amendmentHistory.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Amendment History</h2>
                <div className="space-y-3">
                  {booking.amendmentHistory.map((amendment, index) => (
                    <div key={index} className="border-l-4 border-orange-400 pl-4 py-2 bg-orange-50">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-800">
                            Amendment #{index + 1}
                          </p>
                          <p className="text-sm text-gray-600">
                            Date: {new Date(amendment.amendedOn).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-gray-600">
                            Extended to: {new Date(amendment.newCheckOut).toLocaleDateString()}
                          </p>
                          {amendment.reason && (
                            <p className="text-sm text-gray-600">Reason: {amendment.reason}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-orange-600">
                            ₹{amendment.totalAdjustment || 0}
                          </p>
                          <p className="text-xs text-gray-500">Adjustment</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Booking Summary */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Booking Summary</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">GRC Number:</span>
                  <span className="font-medium">{booking.grcNo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    booking.status === 'Booked' ? 'bg-green-100 text-green-800' :
                    booking.status === 'Checked In' ? 'bg-blue-100 text-blue-800' :
                    booking.status === 'Checked Out' ? 'bg-gray-100 text-gray-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {booking.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Status:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    booking.paymentStatus === 'Paid' ? 'bg-green-100 text-green-800' :
                    booking.paymentStatus === 'Partial' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {booking.paymentStatus}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <Calendar className="mr-2 text-blue-600" size={20} />
                Stay Details
              </h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-600">Check-in Date</label>
                  <p className="text-lg font-medium text-gray-800">
                    {new Date(booking.checkInDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Check-out Date</label>
                  <p className="text-lg font-medium text-gray-800">
                    {new Date(booking.checkOutDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Duration</label>
                  <p className="text-lg font-medium text-gray-800">
                    {Math.ceil((new Date(booking.checkOutDate) - new Date(booking.checkInDate)) / (1000 * 60 * 60 * 24))} nights
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <Bed className="mr-2 text-blue-600" size={20} />
                Room Details
              </h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-600">Room Numbers</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {booking.roomNumber ? booking.roomNumber.split(',').map((room, index) => (
                      <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                        {room.trim()}
                      </span>
                    )) : (
                      <span className="text-gray-500 text-sm">No rooms assigned</span>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Total Guests</label>
                  <p className="text-lg font-medium text-gray-800">
                    {booking.roomGuestDetails && booking.roomGuestDetails.length > 0 ? 
                      booking.roomGuestDetails.reduce((sum, room) => sum + (room.adults || 0) + (room.children || 0), 0) :
                      (booking.noOfAdults || 0) + (booking.noOfChildren || 0) || 'N/A'
                    }
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">VIP Guest</label>
                  <p className="text-lg font-medium text-gray-800">
                    {booking.vip ? 'Yes' : 'No'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <CreditCard className="mr-2 text-blue-600" size={20} />
                Billing Details
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Base Amount:</span>
                  <span className="font-medium">₹{booking.taxableAmount || booking.rate || 0}</span>
                </div>
                {booking.extraBedCharge && booking.extraBedCharge > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Extra Bed:</span>
                    <span className="font-medium">₹{booking.extraBedCharge}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">CGST ({booking.cgstRate || 2.5}%):</span>
                  <span className="font-medium">₹{booking.cgstAmount || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">SGST ({booking.sgstRate || 2.5}%):</span>
                  <span className="font-medium">₹{booking.sgstAmount || 0}</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total Amount:</span>
                    <span>₹{(() => {
                      const baseAmount = booking.taxableAmount || booking.rate || 0;
                      const extraBed = booking.extraBedCharge || 0;
                      const cgst = booking.cgstAmount || 0;
                      const sgst = booking.sgstAmount || 0;
                      const calculatedTotal = baseAmount + extraBed + cgst + sgst;
                      return booking.totalAmount || calculatedTotal;
                    })()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingDetails;