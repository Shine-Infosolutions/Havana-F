import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import ashokaLogo from '../../assets/hawana png11.png';
import { RiPhoneFill, RiMailFill } from 'react-icons/ri';
import { useAppContext } from '../../context/AppContext';

export default function Invoice() {
  const { axios } = useAppContext();
  const location = useLocation();
  const bookingData = location.state?.bookingData;
  
  const [invoiceData, setInvoiceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Fetch invoice data from checkout API or use restaurant order data
  const fetchInvoiceData = async (checkoutId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      // Check if this is a restaurant order or checkout based on bookingData
      if (bookingData && (bookingData.tableNo || bookingData.staffName)) {
        // This is a restaurant order, use the data passed from navigation
        const orderData = bookingData;
        
        // Transform restaurant order data to invoice format
        const invoiceData = {
          clientDetails: {
            name: orderData.customerName || 'Guest',
            address: orderData.address || 'N/A',
            city: orderData.city || 'N/A',
            company: orderData.company || 'N/A',
            mobileNo: orderData.phoneNumber || 'N/A',
            gstin: orderData.gstin || 'N/A'
          },
          invoiceDetails: {
            billNo: `REST-${(orderData._id || checkoutId).slice(-6)}`,
            billDate: new Date().toLocaleDateString(),
            grcNo: `GRC-${(orderData._id || checkoutId).slice(-6)}`,
            roomNo: `Table ${orderData.tableNo || 'N/A'}`,
            roomType: 'Restaurant',
            pax: orderData.pax || 1,
            adult: orderData.adult || 1,
            checkInDate: new Date().toLocaleDateString(),
            checkOutDate: new Date().toLocaleDateString()
          },
          items: orderData.items?.map((item, index) => {
            const itemPrice = item.isFree ? 0 : (typeof item === 'object' ? (item.price || item.Price || 0) : 0);
            return {
              date: new Date().toLocaleDateString(),
              particulars: typeof item === 'string' ? item : (item.name || item.itemName || 'Unknown Item'),
              pax: 1,
              declaredRate: itemPrice,
              hsn: '996331',
              rate: 12,
              cgstRate: itemPrice * 0.025,
              sgstRate: itemPrice * 0.025,
              amount: itemPrice,
              isFree: item.isFree || false
            };
          }) || [],
          taxes: [{
            taxableAmount: orderData.amount || orderData.totalAmount || 0,
            cgst: (orderData.amount || orderData.totalAmount || 0) * 0.025,
            sgst: (orderData.amount || orderData.totalAmount || 0) * 0.025,
            amount: orderData.amount || orderData.totalAmount || 0
          }],
          payment: {
            taxableAmount: orderData.amount || orderData.totalAmount || 0,
            cgst: (orderData.amount || orderData.totalAmount || 0) * 0.025,
            sgst: (orderData.amount || orderData.totalAmount || 0) * 0.025,
            total: orderData.amount || orderData.totalAmount || 0
          },
          otherCharges: [
            {
              particulars: 'Service Charge',
              amount: 0
            }
          ]
        };
        
        setInvoiceData(invoiceData);
        
        // Try to load saved restaurant invoice details first
        try {
          const token = localStorage.getItem('token');
          const response = await axios.get(`/api/restaurant-invoices/${orderData._id}`, {
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
          // If no saved invoice details, fetch GST details if GST number exists
          if (orderData.gstin && orderData.gstin !== 'N/A') {
            fetchGSTDetails(orderData.gstin);
          }
        }
      } else {
        // This is a checkout order, use the existing API
        const response = await axios.get(`/api/checkout/${checkoutId}/invoice`, { headers });
        console.log('Invoice API Response:', response.data);
        
        // Use the invoice data directly from API response
        const mappedData = response.data.invoice;
        
        console.log('Mapped Invoice Data:', mappedData);
        setInvoiceData(mappedData);
        
        // Fetch GST details if GST number exists
        if (mappedData.clientDetails?.gstin && mappedData.clientDetails.gstin !== 'N/A') {
          fetchGSTDetails(mappedData.clientDetails.gstin);
        }
      }
      
    } catch (error) {
      console.error('Invoice API Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGSTDetails = async (gstNumber) => {
    if (!gstNumber || gstNumber === 'N/A' || gstNumber.trim() === '') return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/gst-numbers/details/${gstNumber}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success && response.data.gstNumber) {
        const gstDetails = response.data.gstNumber;
        setInvoiceData(prev => ({
          ...prev,
          clientDetails: {
            ...prev.clientDetails,
            name: gstDetails.name || prev.clientDetails.name,
            address: gstDetails.address || prev.clientDetails.address,
            city: gstDetails.city || prev.clientDetails.city,
            company: gstDetails.company || prev.clientDetails.company,
            mobileNo: gstDetails.mobileNumber || prev.clientDetails.mobileNo
          }
        }));
      }
    } catch (error) {
      console.log('GST details not found, using manual entry');
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
      
      // Save GST details
      const gstData = {
        gstNumber: gstin,
        name: name || '',
        address: address || '',
        city: city || '',
        company: company || '',
        mobileNumber: mobileNo || ''
      };
      
      await axios.post('/api/gst-numbers/create', gstData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Save restaurant invoice details if this is a restaurant order
      if (bookingData && (bookingData.tableNo || bookingData.staffName)) {
        const invoiceData = {
          orderId: bookingData._id,
          clientDetails: {
            name: name || '',
            address: address || '',
            city: city || '',
            company: company || '',
            mobileNo: mobileNo || '',
            gstin: gstin
          }
        };
        
        await axios.post('/api/restaurant-invoices/save', invoiceData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      
      setIsEditing(false);
      alert('Invoice details saved successfully!');
    } catch (error) {
      console.error('Error saving invoice details:', error);
      alert('Failed to save invoice details');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (bookingData) {
      console.log('Booking Data from Navigation:', bookingData);
      
      // Use the checkout ID from navigation state or create one for restaurant orders
      const checkoutId = location.state?.checkoutId || bookingData._id || bookingData.id || `REST-${Date.now()}`;
      if (checkoutId) {
        fetchInvoiceData(checkoutId);
      }
    }
  }, [bookingData, location.state]);

  const calculateTotal = () => {
    if (!invoiceData?.items) return '0.00';
    const subTotal = invoiceData.items.reduce((sum, item) => sum + (item.amount || 0), 0);
    return subTotal.toFixed(2);
  };
  
  const calculateOtherChargesTotal = () => {
    if (!invoiceData?.otherCharges) return '0.00';
    const total = invoiceData.otherCharges.reduce((sum, charge) => sum + (charge.amount || 0), 0);
    return total.toFixed(2);
  };

  const calculateNetTotal = () => {
    if (!invoiceData) return '0.00';
    const baseAmount = invoiceData.payment?.taxableAmount || 0;
    const sgst = invoiceData.payment?.sgst || 0;
    const cgst = invoiceData.payment?.cgst || 0;
    const otherChargesTotal = invoiceData.otherCharges?.reduce((sum, charge) => sum + (charge.amount || 0), 0) || 0;
    const roundOff = -0.01;
    return (baseAmount + sgst + cgst + otherChargesTotal + roundOff).toFixed(2);
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
          .overflow-x-auto { overflow: visible !important; }
          table { page-break-inside: auto; }
          tr { page-break-inside: avoid; page-break-after: auto; }
          
          /* Maintain client details layout */
          .client-details-grid {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            border: 1px solid black !important;
          }
          .client-details-left {
            border-right: 1px solid black !important;
            padding: 8px !important;
          }
          .client-details-right {
            padding: 8px !important;
          }
          .client-info-grid {
            display: grid !important;
            grid-template-columns: auto auto 1fr !important;
            gap: 0px 4px !important;
          }
          .invoice-info-grid {
            display: grid !important;
            grid-template-columns: auto 1fr !important;
            gap: 4px 8px !important;
          }
          .items-table {
            width: 100% !important;
            table-layout: fixed !important;
            font-size: 7px !important;
          }
          .items-table th, .items-table td {
            padding: 1px !important;
            font-size: 7px !important;
            word-break: break-word !important;
          }
          .items-table th:nth-child(1), .items-table td:nth-child(1) { width: 10% !important; }
          .items-table th:nth-child(2), .items-table td:nth-child(2) { width: 35% !important; }
          .items-table th:nth-child(3), .items-table td:nth-child(3) { width: 8% !important; }
          .items-table th:nth-child(4), .items-table td:nth-child(4) { width: 15% !important; }
          .items-table th:nth-child(5), .items-table td:nth-child(5) { width: 12% !important; }
          .items-table th:nth-child(6), .items-table td:nth-child(6) { width: 20% !important; }
          .contact-info {
            position: absolute !important;
            top: 10px !important;
            right: 10px !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: flex-end !important;
            font-size: 10px !important;
          }
        }
      `}</style>
      <div className="min-h-screen bg-white p-2 sm:p-4">
      <div className="max-w-7xl mx-auto border-2 border-black p-2 sm:p-4 print-content">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-4 space-y-4 lg:space-y-0">
          <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="border border-black p-2">
              <div className="w-16 h-16 sm:w-20 sm:h-20">
                <img src={ashokaLogo} alt="Ashoka Logo" className="w-full h-full object-cover" />
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
            TAX INVOICE
          </div>
          <div className="flex gap-2 no-print">
            <button
              onClick={isEditing ? saveInvoiceUpdates : () => setIsEditing(true)}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm disabled:opacity-50"
            >
              {saving ? 'Saving...' : (isEditing ? 'Save' : 'Edit')}
            </button>
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
                  onChange={(e) => {
                    const newGstin = e.target.value;
                    setInvoiceData({
                      ...invoiceData,
                      clientDetails: {...invoiceData.clientDetails, gstin: newGstin}
                    });
                    if (newGstin.length >= 15) {
                      fetchGSTDetails(newGstin);
                    }
                  }}
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
              <p className="font-bold">GRC No.</p>
              <p className="font-medium">: {invoiceData.invoiceDetails?.grcNo}</p>
              <p className="font-bold">Room No./Type</p>
              <p className="font-medium">: {invoiceData.invoiceDetails?.roomNo} {invoiceData.invoiceDetails?.roomType}</p>
              <p className="font-bold">PAX</p>
              <p className="font-medium">: {invoiceData.invoiceDetails?.pax} Adult: {invoiceData.invoiceDetails?.adult}</p>
              <p className="font-bold">CheckIn Date</p>
              <p className="font-medium">: {invoiceData.invoiceDetails?.checkInDate}</p>
              <p className="font-bold">CheckOut Date</p>
              <p className="font-medium">: {invoiceData.invoiceDetails?.checkOutDate}</p>
            </div>
          </div>
        </div>

        <div className="mb-4 overflow-x-auto">
          <table className="items-table w-full text-xs border-collapse">
            <thead>
              <tr className="border border-black bg-gray-200">
                <th className="p-1 border border-black whitespace-nowrap">Date</th>
                <th className="p-1 border border-black whitespace-nowrap">Particulars</th>
                <th className="p-1 border border-black text-center whitespace-nowrap">PAX</th>
                <th className="p-1 border border-black text-right whitespace-nowrap">Declared Rate</th>
                <th className="p-1 border border-black text-center whitespace-nowrap">HSN/SAC Code</th>
                <th className="p-1 border border-black text-right whitespace-nowrap">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoiceData.items?.map((item, index) => (
                <tr key={index} className="border border-black">
                  <td className="p-1 border border-black">{typeof item === 'object' ? (item.date || 'N/A') : 'N/A'}</td>
                  <td className="p-1 border border-black">{typeof item === 'object' ? (item.particulars || 'N/A') : String(item)}</td>
                  <td className="p-1 border border-black text-center">{typeof item === 'object' ? (item.pax || 1) : 1}</td>
                  <td className="p-1 border border-black text-right">
                    {item.isFree ? (
                      <div>
                        <span className="line-through text-gray-400">₹{typeof item === 'object' ? (item.declaredRate?.toFixed(2) || '0.00') : '0.00'}</span>
                        <div className="text-green-600 font-bold text-xs">FREE</div>
                      </div>
                    ) : (
                      <span>₹{typeof item === 'object' ? (item.declaredRate?.toFixed(2) || '0.00') : '0.00'}</span>
                    )}
                  </td>
                  <td className="p-1 border border-black text-center">{typeof item === 'object' ? (item.hsn || 'N/A') : 'N/A'}</td>
                  <td className="p-1 border border-black text-right font-bold">
                    {item.isFree ? (
                      <span className="text-green-600">FREE</span>
                    ) : (
                      <span>₹{typeof item === 'object' ? (item.amount?.toFixed(2) || '0.00') : '0.00'}</span>
                    )}
                  </td>
                </tr>
              ))}
              <tr className="border border-black bg-gray-100">
                <td colSpan="3" className="p-1 text-right font-bold border border-black">SUB TOTAL :</td>
                <td className="p-1 text-right border border-black font-bold">₹{invoiceData.taxes?.[0]?.taxableAmount?.toFixed(2)}</td>
                <td className="p-1 border border-black font-bold"></td>
                <td className="p-1 text-right border border-black font-bold">₹{calculateTotal()}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mb-2">
          <div className="flex flex-col lg:flex-row lg:justify-between text-xs space-y-4 lg:space-y-0">
            <div className="w-full lg:w-3/5 lg:pr-2">
              <p className="font-bold mb-1">Tax Before</p>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[400px] text-xs border-collapse border border-black">
                  <thead>
                    <tr className="bg-gray-200">
                      <th className="p-0.5 border border-black text-xs whitespace-nowrap">Tax%</th>
                      <th className="p-0.5 border border-black text-xs whitespace-nowrap">Txb.Amt</th>
                      <th className="p-0.5 border border-black text-xs whitespace-nowrap">Rec.No.</th>
                      <th className="p-0.5 border border-black text-xs whitespace-nowrap">PayType</th>
                      <th className="p-0.5 border border-black text-xs whitespace-nowrap">Rec.DL</th>
                      <th className="p-0.5 border border-black text-xs whitespace-nowrap">Rec.Amt</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="p-0.5 border border-black text-center text-xs">5.00</td>
                      <td className="p-0.5 border border-black text-right text-xs">{invoiceData.payment?.taxableAmount?.toFixed(2)}</td>
                      <td className="p-0.5 border border-black text-center text-xs">1706</td>
                      <td className="p-0.5 border border-black text-center text-xs">CREDIT C</td>
                      <td className="p-0.5 border border-black text-center text-xs">11/08/25</td>
                      <td className="p-0.5 border border-black text-right text-xs">{invoiceData.payment?.total?.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td colSpan="5" className="p-0.5 border border-black font-bold text-right text-xs">Total</td>
                      <td className="p-0.5 border border-black text-right font-bold text-xs">{invoiceData.payment?.total?.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="w-full lg:w-2/5 lg:pl-2">
              <div className="mb-2">
                <p className="font-bold mb-1">Net Amount Summary</p>
                <table className="w-full border-collapse border border-black">
                  <tbody>
                    <tr>
                      <td className="p-0.5 text-right text-xs font-medium">Amount:</td>
                      <td className="p-0.5 border-l border-black text-right text-xs">₹{invoiceData.payment?.taxableAmount?.toFixed(2) || '0.00'}</td>
                    </tr>
                    <tr>
                      <td className="p-0.5 text-right text-xs font-medium">SGST:</td>
                      <td className="p-0.5 border-l border-black text-right text-xs">₹{invoiceData.payment?.sgst?.toFixed(2) || '0.00'}</td>
                    </tr>
                    <tr>
                      <td className="p-0.5 text-right text-xs font-medium">CGST:</td>
                      <td className="p-0.5 border-l border-black text-right text-xs">₹{invoiceData.payment?.cgst?.toFixed(2) || '0.00'}</td>
                    </tr>
                    <tr>
                      <td className="p-0.5 text-right text-xs font-medium">Round Off:</td>
                      <td className="p-0.5 border-l border-black text-right text-xs">-0.01</td>
                    </tr>
                    <tr className="bg-gray-200">
                      <td className="p-0.5 font-bold text-right text-xs">NET AMOUNT:</td>
                      <td className="p-0.5 border-l border-black text-right font-bold text-xs">₹{calculateNetTotal()}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <div>
                <p className="font-bold mb-1">Other Charges</p>
                <table className="w-full border-collapse border border-black">
                  <thead>
                    <tr className="bg-gray-200">
                      <th className="p-0.5 border border-black text-xs">Particulars</th>
                      <th className="p-0.5 border border-black text-xs">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoiceData.otherCharges?.map((charge, index) => (
                      <tr key={index}>
                        <td className="p-0.5 border border-black text-xs">{typeof charge === 'object' ? charge.particulars : String(charge)}</td>
                        <td className="p-0.5 border border-black text-right text-xs">₹{typeof charge === 'object' ? (charge.amount?.toFixed(2) || '0.00') : '0.00'}</td>
                      </tr>
                    ))}
                    <tr className="bg-gray-200">
                      <td className="p-0.5 border border-black font-bold text-right text-xs">Total:</td>
                      <td className="p-0.5 border border-black text-right font-bold text-xs">₹{calculateOtherChargesTotal()}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-4 text-xs">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 border-b border-t border-black py-4">
            <div>
              <p className="font-bold">HAVE YOU DEPOSITED YOUR ROOM KEY AND LOCKERS KEY?</p>
              <div className="flex items-center space-x-4 mt-2">
                <label className="flex items-center">
                  <input type="checkbox" className="mr-2" /> YES
                </label>
                <label className="flex items-center">
                  <input type="checkbox" className="mr-2" /> NO
                </label>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold">CHECK OUT TIME : 12:00</p>
              <p>I AGREE THAT I AM RESPONSIBLE FOR THE FULL PAYMENT OF THIS BILL IN</p>
              <p>THE EVENTS, IF IT IS NOT PAID (BY THE COMPANY/ORGANISATION OR</p>
              <p>PERSON INDICATED)</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 mt-4 gap-2 sm:gap-0">
            <div className="text-left font-bold">FRONT OFFICE MANAGER</div>
            <div className="text-center font-bold">CASHIER</div>
            <div className="text-right font-bold">Guest Sign.</div>
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