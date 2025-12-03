import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { showToast } from '../../utils/toaster';

const HotelCheckout = ({ booking, onClose, onCheckoutComplete }) => {
  const { axios } = useAppContext();
  const [checkoutData, setCheckoutData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Review, 2: Payment, 3: Complete
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [roomInspected, setRoomInspected] = useState(false);

  useEffect(() => {
    if (booking) {
      fetchCheckoutData();
    }
  }, [booking]);

  const fetchCheckoutData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const bookingId = booking._id || booking.id;
      
      // Get comprehensive charges using our new endpoint
      const chargesResponse = await axios.get(`/api/bookings/charges/booking/${bookingId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Charges API response:', chargesResponse.data);
      const charges = chargesResponse.data.charges;
      
      // Create checkout record first if it doesn't exist
      let checkoutRecord;
      try {
        const existingCheckout = await axios.get(`/api/checkout/booking/${bookingId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        checkoutRecord = existingCheckout.data.checkout;
      } catch (error) {
        // Create new checkout if not found
        const createResponse = await axios.post('/api/checkout/create', {
          bookingId: bookingId
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        checkoutRecord = createResponse.data.checkout;
      }
      
      // Create checkout data structure
      const checkoutData = {
        _id: checkoutRecord._id,
        bookingId: bookingId,
        bookingCharges: charges.roomCharges.totalRoomCharges || 0,
        restaurantCharges: charges.summary.totalRestaurantCharges || 0,
        roomServiceCharges: charges.summary.totalServiceCharges || 0,
        laundryCharges: 0, // Will be added separately if needed
        inspectionCharges: 0, // Will be added separately if needed
        totalAmount: charges.summary.grandTotal || 0,
        subtotal: charges.summary.subtotal || 0,
        cgstAmount: charges.summary.cgstAmount || 0,
        sgstAmount: charges.summary.sgstAmount || 0,
        totalTax: charges.summary.totalTax || 0,
        status: 'pending'
      };
      
      console.log('Processed checkout data:', checkoutData);
      setCheckoutData(checkoutData);
      
      // Calculate balance due after advance payments
      const advancePayments = booking?.advancePayments || [];
      const totalAdvance = advancePayments.reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0);
      const balanceDue = Math.max(0, (checkoutData.totalAmount || 0) - totalAdvance);
      
      setPaymentAmount(balanceDue.toString());
    } catch (error) {
      console.error('Error fetching checkout data:', error);
      showToast.error('Failed to load checkout data');
    } finally {
      setLoading(false);
    }
  };

  const processPayment = async () => {
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      showToast.error('Please enter valid payment amount');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Process payment
      await axios.put(`/api/checkout/${checkoutData._id}/payment`, {
        status: 'paid',
        paidAmount: parseFloat(paymentAmount)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // The updatePaymentStatus function will handle booking and room updates automatically

      setStep(3);
      showToast.success('Payment processed successfully!');
    } catch (error) {
      console.error('Error processing payment:', error);
      showToast.error('Failed to process payment');
    } finally {
      setLoading(false);
    }
  };

  const completeCheckout = () => {
    onCheckoutComplete?.();
    onClose();
    showToast.success('Checkout completed successfully!');
  };

  if (loading && !checkoutData) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-center">Loading checkout data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">Hotel Checkout</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <div className={`flex items-center ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>
                1
              </div>
              <span className="ml-2 font-medium">Review Charges</span>
            </div>
            <div className={`flex items-center ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>
                2
              </div>
              <span className="ml-2 font-medium">Payment</span>
            </div>
            <div className={`flex items-center ${step >= 3 ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-green-600 text-white' : 'bg-gray-300'}`}>
                3
              </div>
              <span className="ml-2 font-medium">Complete</span>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Guest Information */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">Guest Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Name:</span>
                <span className="ml-2 font-medium">{booking.name}</span>
              </div>
              <div>
                <span className="text-gray-600">Room:</span>
                <span className="ml-2 font-medium">{booking.roomNumber || booking.room_number}</span>
              </div>
              <div>
                <span className="text-gray-600">GRC:</span>
                <span className="ml-2 font-medium">{booking.grcNo}</span>
              </div>
              <div>
                <span className="text-gray-600">Check-in:</span>
                <span className="ml-2 font-medium">{new Date(booking.checkInDate).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Step 1: Review Charges */}
          {step === 1 && checkoutData && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Checkout Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b">
                  <span>Room Charges:</span>
                  <span className="font-medium">₹{checkoutData.bookingCharges || 0}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span>Restaurant Charges:</span>
                  <span className="font-medium">₹{checkoutData.restaurantCharges || 0}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span>Room Service:</span>
                  <span className="font-medium">₹{checkoutData.roomServiceCharges || 0}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span>Laundry:</span>
                  <span className="font-medium">₹{checkoutData.laundryCharges || 0}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span>Inspection Charges:</span>
                  <span className="font-medium text-red-600">₹{checkoutData.inspectionCharges || 0}</span>
                </div>
                {(() => {
                  const discountPercent = booking?.discountPercent || 0;
                  const discountNotes = booking?.discountNotes || '';
                  
                  if (discountPercent > 0) {
                    return (
                      <>
                        <div className="flex justify-between py-2 border-b">
                          <span>Discount ({discountPercent}%):</span>
                          <span className="font-medium text-green-600">Applied</span>
                        </div>
                        {discountNotes && (
                          <div className="py-2 border-b">
                            <span className="text-sm text-gray-600">Discount Notes:</span>
                            <p className="text-sm text-gray-700 mt-1 italic">"{discountNotes}"</p>
                          </div>
                        )}
                      </>
                    );
                  }
                  return null;
                })()}
                <div className="flex justify-between py-2 border-b">
                  <span>Subtotal:</span>
                  <span className="font-medium">₹{checkoutData.subtotal || 0}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span>CGST (2.5%):</span>
                  <span className="font-medium">₹{checkoutData.cgstAmount || 0}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span>SGST (2.5%):</span>
                  <span className="font-medium">₹{checkoutData.sgstAmount || 0}</span>
                </div>
                <div className="flex justify-between py-3 border-t-2 border-blue-200 text-lg font-bold">
                  <span>Total with Tax:</span>
                  <span className="text-blue-600">₹{checkoutData.totalAmount || 0}</span>
                </div>
                {(() => {
                  const advancePayments = booking?.advancePayments || [];
                  const totalAdvance = advancePayments.reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0);
                  const balanceDue = (checkoutData.totalAmount || 0) - totalAdvance;
                  
                  if (totalAdvance > 0) {
                    return (
                      <>
                        <div className="flex justify-between py-2 border-b text-green-600">
                          <span>Advance Paid:</span>
                          <span className="font-medium">-₹{totalAdvance.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between py-3 border-t-2 border-green-200 text-lg font-bold">
                          <span>Balance Due:</span>
                          <span className="text-green-600">₹{Math.max(0, balanceDue).toFixed(2)}</span>
                        </div>
                      </>
                    );
                  }
                  return null;
                })()}
              </div>

              {/* Room Inspection */}
              <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-yellow-800">Room Inspection</h4>
                    <p className="text-sm text-yellow-600">Verify room condition before checkout</p>
                  </div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={roomInspected}
                      onChange={(e) => setRoomInspected(e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm">Inspected</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setStep(2)}
                  disabled={!roomInspected}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Proceed to Payment
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Payment */}
          {step === 2 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Payment Details</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="cash">Cash</option>
                    <option value="card">Credit/Debit Card</option>
                    <option value="upi">UPI</option>
                    <option value="bank_transfer">Bank Transfer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Amount (₹)
                  </label>
                  <input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter amount"
                  />
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  {(() => {
                    const advancePayments = booking?.advancePayments || [];
                    const totalAdvance = advancePayments.reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0);
                    const balanceDue = Math.max(0, (checkoutData?.totalAmount || 0) - totalAdvance);
                    
                    return (
                      <>
                        <div className="flex justify-between text-sm">
                          <span>Total Amount:</span>
                          <span>₹{checkoutData?.totalAmount || 0}</span>
                        </div>
                        {totalAdvance > 0 && (
                          <div className="flex justify-between text-sm text-green-600">
                            <span>Advance Paid:</span>
                            <span>-₹{totalAdvance.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-lg font-semibold border-t pt-2 mt-2">
                          <span>Balance Due:</span>
                          <span className="text-blue-600">₹{balanceDue.toFixed(2)}</span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              <div className="flex justify-between mt-6">
                <button
                  onClick={() => setStep(1)}
                  className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400"
                >
                  Back
                </button>
                <button
                  onClick={processPayment}
                  disabled={loading}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400"
                >
                  {loading ? 'Processing...' : 'Process Payment'}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Complete */}
          {step === 3 && (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-green-600 mb-2">Checkout Complete!</h3>
              <p className="text-gray-600 mb-6">
                Payment of ₹{paymentAmount} has been processed successfully.
                <br />
                Room {booking.roomNumber || booking.room_number} is now available.
              </p>
              
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => window.print()}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                >
                  Print Receipt
                </button>
                <button
                  onClick={completeCheckout}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
                >
                  Complete Checkout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HotelCheckout;