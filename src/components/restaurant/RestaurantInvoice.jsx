import React, { useState, useEffect } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import ashokaLogo from '../../assets/hawana golden png.png';
import { RiPhoneFill, RiMailFill } from 'react-icons/ri';
import { useAppContext } from '../../context/AppContext';

export default function RestaurantInvoice() {
  const { axios } = useAppContext();
  const location = useLocation();
  const { orderId } = useParams();
  const orderData = location.state?.orderData;
  
  const [invoiceData, setInvoiceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchInvoiceData = async (id) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      let order = orderData;
      if (!order && id) {
        const response = await axios.get(`/api/restaurant-orders/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        order = response.data;
      }

      if (!order) {
        throw new Error('Order not found');
      }

      const invoiceData = {
        clientDetails: {
          name: order.customerName || 'Guest',
          address: order.address || 'N/A',
          city: order.city || 'N/A',
          company: order.company || 'N/A',
          mobileNo: order.phoneNumber || 'N/A',
          gstin: order.gstin || 'N/A'
        },
        invoiceDetails: {
          billNo: `REST-${(order._id || id).slice(-6)}`,
          billDate: new Date(order.createdAt || Date.now()).toLocaleDateString(),
          grcNo: order.grcNo || `GRC-${(order._id || id).slice(-6)}`,
          roomNo: `Room ${order.tableNo || order.roomNumber || 'N/A'}`,
          roomType: 'Restaurant',
          pax: 1,
          adult: 1,
          checkInDate: new Date(order.createdAt || Date.now()).toLocaleDateString(),
          checkOutDate: new Date(order.createdAt || Date.now()).toLocaleDateString()
        },
        items: order.nonChargeable ? [] : (order.items?.map((item) => ({
          date: new Date(order.createdAt || Date.now()).toLocaleDateString(),
          particulars: item.itemName || item.name || 'Unknown Item',
          pax: item.quantity || 1,
          declaredRate: item.price || item.Price || 0,
          hsn: '996331',
          rate: order.gstRate || 5,
          cgstRate: order.cgstAmount || ((item.price || item.Price || 0) * (order.cgstRate || 2.5)) / 100,
          sgstRate: order.sgstAmount || ((item.price || item.Price || 0) * (order.sgstRate || 2.5)) / 100,
          amount: (item.price || item.Price || 0) * (item.quantity || 1)
        })) || [])
      };
      
      // Calculate GST amounts if not present in order
      const subtotal = order.nonChargeable ? 0 : (order.subtotal || order.amount || 0);
      const sgstRate = order.sgstRate || 2.5;
      const cgstRate = order.cgstRate || 2.5;
      const sgstAmount = order.nonChargeable ? 0 : (order.sgstAmount || (subtotal * sgstRate) / 100);
      const cgstAmount = order.nonChargeable ? 0 : (order.cgstAmount || (subtotal * cgstRate) / 100);
      const totalWithGst = order.nonChargeable ? 0 : (subtotal + sgstAmount + cgstAmount);
      
      invoiceData.taxes = [{
        taxableAmount: subtotal,
        cgst: cgstAmount,
        sgst: sgstAmount,
        amount: totalWithGst
      }];
      
      invoiceData.payment = {
        taxableAmount: subtotal,
        cgst: cgstAmount,
        sgst: sgstAmount,
        total: totalWithGst
      };
      
      invoiceData.otherCharges = [
        {
          particulars: 'Service Charge',
          amount: 0
        }
      ];
      
      setInvoiceData(invoiceData);
      
      // Try to load saved invoice details
      try {
        const response = await axios.get(`/api/restaurant-invoices/${order._id || id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data.success && response.data.invoice) {
          const savedDetails = response.data.invoice.clientDetails;
          setInvoiceData(prev => ({
            ...prev,
            clientDetails: {
              ...prev.clientDetails,
              ...savedDetails
            }
          }));
        }
      } catch (error) {
        // No saved details found
      }
      
    } catch (error) {
      console.error('Error fetching invoice data:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveInvoiceUpdates = async () => {
    const { gstin, name, address, city, company, mobileNo } = invoiceData.clientDetails;
    
    if (!gstin || gstin === 'N/A' || gstin.trim() === '') {
      alert('Valid GST Number is required to save details');
      return;
    }
    
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      
      const invoiceDetails = {
        orderId: orderId || orderData?._id,
        clientDetails: {
          name: name || '',
          address: address || '',
          city: city || '',
          company: company || '',
          mobileNo: mobileNo || '',
          gstin: gstin
        }
      };
      
      await axios.post('/api/restaurant-invoices/save', invoiceDetails, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setIsEditing(false);
      alert('Invoice details saved successfully!');
    } catch (error) {
      alert('Failed to save invoice details');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    const id = orderId || orderData?._id;
    if (id || orderData) {
      fetchInvoiceData(id);
    }
  }, [orderId, orderData]);

  const calculateTotal = () => {
    if (!invoiceData?.items) return '0.00';
    const subTotal = invoiceData.items.reduce((sum, item) => sum + (item.amount || 0), 0);
    return subTotal.toFixed(2);
  };

  const calculateNetTotal = () => {
    if (!invoiceData) return '0.00';
    const baseAmount = invoiceData.payment?.taxableAmount || 0;
    const sgst = invoiceData.payment?.sgst || 0;
    const cgst = invoiceData.payment?.cgst || 0;
    return (baseAmount + sgst + cgst).toFixed(2);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white p-2 sm:p-4 flex items-center justify-center">
        <div className="text-lg">Loading Invoice...</div>
      </div>
    );
  }

  if (!invoiceData) {
    return (
      <div className="min-h-screen bg-white p-2 sm:p-4 flex items-center justify-center">
        <div className="text-lg text-red-600">Failed to load invoice data</div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @media print {
          * { visibility: hidden; }
          .print-content, .print-content * { visibility: visible !important; }
          .print-content { 
            position: absolute; 
            left: 0; 
            top: 0; 
            width: 100%; 
            box-sizing: border-box;
            padding: 10px;
          }
          .no-print { display: none !important; }
          @page { 
            margin: 0.5in; 
            size: A4;
          }
          body { margin: 0; padding: 0; background: white !important; }
        }
      `}</style>
      <div className="min-h-screen bg-white p-2 sm:p-4">
        <div className="max-w-7xl mx-auto border-2 border-black p-2 sm:p-4 print-content">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-4 space-y-4 lg:space-y-0">
            <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4">
              <div className="border border-black p-2">
                <div className="w-8 h-8 sm:w-10 sm:h-10">
                  <img src={ashokaLogo} alt="Havana Logo" className="w-full h-full object-contain" />
                </div>
              </div>
              <div className="text-xs text-center sm:text-left">
                <p className="font-bold text-sm sm:text-base">HAVANA HOTEL</p>
                <p className="text-xs">Deoria Bypass Rd, near LIC Office Gorakhpur</p>
                <p className="text-xs">Taramandal, Gorakhpur, Uttar Pradesh 273016</p>
                <p className="text-xs">Website: <a href="http://havana-hotel.com" className="text-blue-600">havana-hotel.com</a></p>
                <p className="text-xs">contact@hotelhavana.in</p>
              </div>
            </div>
            <div className="contact-info flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <div className="text-xs flex items-center space-x-2">
                <RiPhoneFill className="text-lg text-yellow-600" />
                <span>+91-XXXX-XXXXXX</span>
              </div>
              <div className="text-xs flex items-center space-x-2">
                <RiMailFill className="text-lg text-yellow-600" />
                <span>contact@hotelhavana.in</span>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center mb-4">
            <div className="text-center font-bold text-lg flex-1">
              RESTAURANT TAX INVOICE
            </div>
            <div className="flex gap-2 no-print">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
              >
                Print
              </button>
            </div>
          </div>
          
          <div className="client-details-grid grid grid-cols-1 lg:grid-cols-2 text-xs border border-black mb-4">
            <div className="client-details-left border-r border-black p-2">
              <p><span className="font-bold">GSTIN No. : </span>
                {isEditing ? (
                  <input
                    type="text"
                    value={invoiceData.clientDetails?.gstin || ''}
                    onChange={(e) => setInvoiceData({
                      ...invoiceData,
                      clientDetails: {...invoiceData.clientDetails, gstin: e.target.value}
                    })}
                    className="border px-1 ml-1 text-xs w-32"
                  />
                ) : invoiceData.clientDetails?.gstin}
              </p>
              <div className="client-info-grid grid grid-cols-3 gap-x-1 gap-y-1">
                <p className="col-span-1">Name</p>
                <p className="col-span-2">: {isEditing ? (
                    <input
                      type="text"
                      value={invoiceData.clientDetails?.name || ''}
                      onChange={(e) => setInvoiceData({
                        ...invoiceData,
                        clientDetails: {...invoiceData.clientDetails, name: e.target.value}
                      })}
                      className="border px-1 ml-1 text-xs w-32"
                    />
                  ) : invoiceData.clientDetails?.name}</p>
                <p className="col-span-1">Address</p>
                <p className="col-span-2">: {isEditing ? (
                    <input
                      type="text"
                      value={invoiceData.clientDetails?.address || ''}
                      onChange={(e) => setInvoiceData({
                        ...invoiceData,
                        clientDetails: {...invoiceData.clientDetails, address: e.target.value}
                      })}
                      className="border px-1 ml-1 text-xs w-32"
                    />
                  ) : invoiceData.clientDetails?.address}</p>
                <p className="col-span-1">City</p>
                <p className="col-span-2">: {isEditing ? (
                    <input
                      type="text"
                      value={invoiceData.clientDetails?.city || ''}
                      onChange={(e) => setInvoiceData({
                        ...invoiceData,
                        clientDetails: {...invoiceData.clientDetails, city: e.target.value}
                      })}
                      className="border px-1 ml-1 text-xs w-32"
                    />
                  ) : invoiceData.clientDetails?.city}</p>
                <p className="col-span-1">Company</p>
                <p className="col-span-2">{isEditing ? (
                    <input
                      type="text"
                      value={invoiceData.clientDetails?.company || ''}
                      onChange={(e) => setInvoiceData({
                        ...invoiceData,
                        clientDetails: {...invoiceData.clientDetails, company: e.target.value}
                      })}
                      className="border px-1 ml-1 text-xs w-32"
                    />
                  ) : (invoiceData.clientDetails?.company?.startsWith(':') ? invoiceData.clientDetails.company : `: ${invoiceData.clientDetails?.company || ''}`)}</p>
                <p className="col-span-1">Mobile No.</p>
                <p className="col-span-2">: {isEditing ? (
                    <input
                      type="text"
                      value={invoiceData.clientDetails?.mobileNo || ''}
                      onChange={(e) => setInvoiceData({
                        ...invoiceData,
                        clientDetails: {...invoiceData.clientDetails, mobileNo: e.target.value}
                      })}
                      className="border px-1 ml-1 text-xs w-32"
                    />
                  ) : invoiceData.clientDetails?.mobileNo}</p>
              </div>
            </div>

            <div className="client-details-right p-2">
              <div className="invoice-info-grid grid grid-cols-2 gap-y-1">
                <p className="font-bold">Bill No. & Date</p>
                <p className="font-medium">: {invoiceData.invoiceDetails?.billNo} {invoiceData.invoiceDetails?.billDate}</p>
                <p className="font-bold">Order No.</p>
                <p className="font-medium">: {invoiceData.invoiceDetails?.grcNo}</p>
                <p className="font-bold">Table/Room</p>
                <p className="font-medium">: {invoiceData.invoiceDetails?.roomNo}</p>
                <p className="font-bold">Order Date</p>
                <p className="font-medium">: {invoiceData.invoiceDetails?.checkInDate}</p>
                <p className="font-bold">Order Time</p>
                <p className="font-medium">: {new Date().toLocaleTimeString()}</p>
              </div>
            </div>
          </div>

          <div className="mb-4 overflow-x-auto">
            <table className="items-table w-full text-xs border-collapse">
              <thead>
                <tr className="border border-black bg-gray-200">
                  <th className="p-1 border border-black whitespace-nowrap">S.No</th>
                  <th className="p-1 border border-black whitespace-nowrap">Item Name</th>
                  <th className="p-1 border border-black text-center whitespace-nowrap">Qty</th>
                  <th className="p-1 border border-black text-right whitespace-nowrap">Rate</th>
                  <th className="p-1 border border-black text-center whitespace-nowrap">HSN/SAC</th>
                  <th className="p-1 border border-black text-right whitespace-nowrap">Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoiceData.items?.map((item, index) => (
                  <tr key={index} className="border border-black">
                    <td className="p-1 border border-black text-center">{index + 1}</td>
                    <td className="p-1 border border-black">{item.particulars}</td>
                    <td className="p-1 border border-black text-center">{item.pax}</td>
                    <td className="p-1 border border-black text-right">₹{item.declaredRate?.toFixed(2)}</td>
                    <td className="p-1 border border-black text-center">{item.hsn}</td>
                    <td className="p-1 border border-black text-right font-bold">₹{item.amount?.toFixed(2)}</td>
                  </tr>
                ))}
                <tr className="border border-black bg-gray-100">
                  <td colSpan="5" className="p-1 text-right font-bold border border-black">SUB TOTAL :</td>
                  <td className="p-1 text-right border border-black font-bold">₹{calculateTotal()}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mb-4 flex justify-end">
            <div className="w-full lg:w-1/2">
              <p className="font-bold mb-1">Net Amount Summary</p>
              <table className="w-full border-collapse border border-black">
                <tbody>
                  <tr>
                    <td className="p-1 text-right text-xs font-medium">Subtotal:</td>
                    <td className="p-1 border-l border-black text-right text-xs">₹{invoiceData.payment?.taxableAmount?.toFixed(2) || '0.00'}</td>
                  </tr>
                  <tr>
                    <td className="p-1 text-right text-xs font-medium">SGST (2.5%):</td>
                    <td className="p-1 border-l border-black text-right text-xs">₹{invoiceData.payment?.sgst?.toFixed(2) || '0.00'}</td>
                  </tr>
                  <tr>
                    <td className="p-1 text-right text-xs font-medium">CGST (2.5%):</td>
                    <td className="p-1 border-l border-black text-right text-xs">₹{invoiceData.payment?.cgst?.toFixed(2) || '0.00'}</td>
                  </tr>
                  <tr className="bg-gray-200">
                    <td className="p-1 font-bold text-right text-xs">NET AMOUNT:</td>
                    <td className="p-1 border-l border-black text-right font-bold text-xs">₹{calculateNetTotal()}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 text-xs">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 border-b border-t border-black py-4">
              <div>
                <p className="font-bold">PAYMENT METHOD:</p>
                <div className="flex items-center space-x-4 mt-2">
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" /> CASH
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" /> CARD
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" /> UPI
                  </label>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold">RESTAURANT TIMING: 7:00 AM - 11:00 PM</p>
                <p>Thank you for dining with us!</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 mt-4 gap-2 sm:gap-0">
              <div className="text-left font-bold">RESTAURANT MANAGER</div>
              <div className="text-center font-bold">CASHIER</div>
              <div className="text-right font-bold">Customer Sign.</div>
              <div className="text-left text-xs">Subject to GORAKHPUR Jurisdiction only.</div>
              <div className="text-center text-xs">E. & O.E.</div>
              <div></div>
            </div>
            <p className="mt-4 text-center text-lg font-bold">Thank You, Visit Again</p>
          </div>
        </div>
      </div>
    </>
  );
}