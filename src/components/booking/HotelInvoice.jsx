import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import ashokaLogo from '../../assets/hawana golden png.png';
import { RiPhoneFill, RiMailFill } from 'react-icons/ri';
import { FaWhatsapp, FaFilePdf } from 'react-icons/fa';
import { useAppContext } from '../../context/AppContext';
import { useReactToPrint } from 'react-to-print';

export default function Invoice() {
  const { axios } = useAppContext();
  const location = useLocation();
  const bookingData = location.state?.bookingData;
  const invoiceRef = useRef();
  
  const [invoiceData, setInvoiceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [gstRates, setGstRates] = useState({ cgstRate: 2.5, sgstRate: 2.5 });
  const [showPaxDetails, setShowPaxDetails] = useState(false);

  // Fetch invoice data from checkout API or use restaurant order data
  const fetchInvoiceData = async (checkoutId) => {
    // Load current GST rates
    const savedRates = localStorage.getItem('defaultGstRates');
    const currentGstRates = savedRates ? JSON.parse(savedRates) : { cgstRate: 2.5, sgstRate: 2.5 };
    setGstRates(currentGstRates);
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
              cgstRate: itemPrice * (currentGstRates.cgstRate / 100),
              sgstRate: itemPrice * (currentGstRates.sgstRate / 100),
              amount: itemPrice,
              isFree: item.isFree || false
            };
          }) || [],
          taxes: [{
            taxableAmount: orderData.amount || orderData.totalAmount || 0,
            cgst: (orderData.amount || orderData.totalAmount || 0) * (currentGstRates.cgstRate / 100),
            sgst: (orderData.amount || orderData.totalAmount || 0) * (currentGstRates.sgstRate / 100),
            amount: orderData.amount || orderData.totalAmount || 0
          }],
          payment: {
            taxableAmount: orderData.amount || orderData.totalAmount || 0,
            cgst: (orderData.amount || orderData.totalAmount || 0) * (currentGstRates.cgstRate / 100),
            sgst: (orderData.amount || orderData.totalAmount || 0) * (currentGstRates.sgstRate / 100),
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
        
        // Use the invoice data directly from API response
        const mappedData = response.data.invoice;
        
        // Extra bed charges are now handled in the backend checkout controller
        
        setInvoiceData(mappedData);
        
        // Update GST rates from booking data if available
        if (mappedData.cgstRate !== undefined && mappedData.sgstRate !== undefined) {
          const bookingGstRates = {
            cgstRate: mappedData.cgstRate * 100, // Convert from decimal to percentage
            sgstRate: mappedData.sgstRate * 100
          };
          setGstRates(bookingGstRates);
        }
        
        // Fetch GST details if GST number exists
        if (mappedData.clientDetails?.gstin && mappedData.clientDetails.gstin !== 'N/A') {
          fetchGSTDetails(mappedData.clientDetails.gstin);
        }
      }
      
    } catch (error) {
      // Handle error silently
    } finally {
      // Set final GST rates
      setGstRates(currentGstRates);
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
      // GST details not found, continue with manual entry
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
      alert('Failed to save invoice details');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    // GST rates will be loaded from booking data in fetchInvoiceData
    // No need to load from localStorage as we want booking-specific rates
    
    if (bookingData) {
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

  const calculateRoundOff = () => {
    if (!invoiceData) return 0;
    const baseAmount = invoiceData.items?.reduce((sum, item) => {
      return sum + (item.isFree ? 0 : (item.amount || 0));
    }, 0) || 0;
    const sgstRate = bookingData?.sgstRate !== undefined ? bookingData.sgstRate : (gstRates.sgstRate / 100);
    const cgstRate = bookingData?.cgstRate !== undefined ? bookingData.cgstRate : (gstRates.cgstRate / 100);
    const sgst = baseAmount * sgstRate;
    const cgst = baseAmount * cgstRate;
    const otherChargesTotal = invoiceData.otherCharges?.reduce((sum, charge) => {
      if (charge.particulars === 'ROOM SERVICE') return sum;
      return sum + (charge.amount || 0);
    }, 0) || 0;
    const exactTotal = baseAmount + sgst + cgst + otherChargesTotal;
    const roundedTotal = Math.round(exactTotal);
    const roundOff = Math.round((roundedTotal - exactTotal) * 100) / 100;
    return roundOff;
  };

  const calculateNetTotal = () => {
    if (!invoiceData) return '0.00';
    const baseAmount = invoiceData.items?.reduce((sum, item) => {
      return sum + (item.isFree ? 0 : (item.amount || 0));
    }, 0) || 0;
    const sgstRate = bookingData?.sgstRate !== undefined ? bookingData.sgstRate : (gstRates.sgstRate / 100);
    const cgstRate = bookingData?.cgstRate !== undefined ? bookingData.cgstRate : (gstRates.cgstRate / 100);
    const sgst = baseAmount * sgstRate;
    const cgst = baseAmount * cgstRate;
    const otherChargesTotal = invoiceData.otherCharges?.reduce((sum, charge) => {
      if (charge.particulars === 'ROOM SERVICE') return sum;
      return sum + (charge.amount || 0);
    }, 0) || 0;
    const roundOff = calculateRoundOff();
    return (baseAmount + sgst + cgst + otherChargesTotal + roundOff).toFixed(2);
  };

  const handlePrint = useReactToPrint({
    contentRef: invoiceRef,
    documentTitle: `Invoice_${invoiceData?.invoiceDetails?.billNo || 'Unknown'}`,
    onBeforePrint: () => setGeneratingPdf(true),
    onAfterPrint: () => setGeneratingPdf(false)
  });

  const shareInvoicePDF = () => {
    // Try to get checkout ID from various sources
    let checkoutId = location.state?.checkoutId;
    
    // If no checkout ID, try booking ID (might need to create checkout first)
    if (!checkoutId) {
      checkoutId = bookingData?._id || bookingData?.id;
    }
    
    console.log('Sharing invoice with ID:', checkoutId);
    const sharedUrl = `${window.location.origin}/shared-invoice/${checkoutId}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(sharedUrl)}`;
    window.open(whatsappUrl, '_blank');
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
      <div ref={invoiceRef} className="max-w-7xl mx-auto border-2 border-black p-2 sm:p-4 print-content">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-4 space-y-4 lg:space-y-0">
          <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="border border-black p-2">
              <div className="w-20 h-20 sm:w-24 sm:h-24">
                <img src={ashokaLogo} alt="Havana Logo" className="w-full h-full object-contain" />
              </div>
            </div>
            <div className="text-xs text-center sm:text-left">
              <p className="font-bold text-sm sm:text-base">HOTEL HAVANA </p>
              <p className="text-xs">Deoria Bypass Rd, near LIC Office Gorakhpur</p>
              <p className="text-xs">Taramandal, Gorakhpur, Uttar Pradesh 273016</p>
              <p className="text-xs">Website: <a href="https://hotelhavana.com" className="text-blue-600">hotelhavana.com</a></p>
              <p className="text-xs">contact@hotelhavana.in</p>
              <p className="text-xs font-semibold">GSTIN: 09ACIFA2416J1ZF</p>
            </div>
          </div>
          <div className="contact-info flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4">
            <div className="text-xs flex items-center space-x-2">
                <RiPhoneFill className="text-lg text-yellow-600" />
                <span>+91-9451903390</span>
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
              onClick={() => setShowPaxDetails(!showPaxDetails)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
            >
              {showPaxDetails ? 'Hide PAX' : 'Show PAX'}
            </button>
            <button
              onClick={shareInvoicePDF}
              disabled={generatingPdf}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm flex items-center gap-2 disabled:opacity-50"
            >
              <FaWhatsapp className="text-lg" />
              Share on WhatsApp
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
            {(bookingData?.companyGSTIN && bookingData.companyGSTIN.trim() !== '') && (
              <p><span className="font-bold">GSTIN No. : </span>
                {bookingData.companyGSTIN}
              </p>
            )}
            <div className="client-info-grid grid grid-cols-3 gap-x-1 gap-y-1">
              <p className="col-span-1">Name</p>
              <p className="col-span-2">: {bookingData?.name || invoiceData.clientDetails?.name}</p>
              <p className="col-span-1">Address</p>
              <p className="col-span-2">: {bookingData?.address || invoiceData.clientDetails?.address}</p>
              <p className="col-span-1">City</p>
              <p className="col-span-2">: {bookingData?.city || invoiceData.clientDetails?.city}</p>
              {(bookingData?.companyName && bookingData.companyName.trim() !== '') && (
                <>
                  <p className="col-span-1">Company</p>
                  <p className="col-span-2">: {bookingData.companyName}</p>
                </>
              )}
              <p className="col-span-1">Mobile No.</p>
              <p className="col-span-2">: {bookingData?.mobileNo || invoiceData.clientDetails?.mobileNo}</p>
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
              {showPaxDetails && (
                <>
                  <p className="font-bold">PAX</p>
                  <p className="font-medium">
                    {bookingData?.roomGuestDetails && bookingData.roomGuestDetails.length > 0 ? (
                      <>
                        : {bookingData.roomGuestDetails.reduce((sum, room) => sum + room.adults + room.children, 0)} Adult: {bookingData.roomGuestDetails.reduce((sum, room) => sum + room.adults, 0)} Children: {bookingData.roomGuestDetails.reduce((sum, room) => sum + room.children, 0)}
                      </>
                    ) : (
                      `: ${invoiceData.invoiceDetails?.pax} Adult: ${invoiceData.invoiceDetails?.adult}`
                    )}
                  </p>
                </>
              )}
              <p className="font-bold">Rooms</p>
              <p className="font-medium">
                {bookingData?.roomGuestDetails && bookingData.roomGuestDetails.length > 0 ? (
                  <>
                    : {bookingData.roomGuestDetails.map((room, index) => (
                      <span key={index}>
                        Room {room.roomNumber}{index < bookingData.roomGuestDetails.length - 1 ? ', ' : ''}
                      </span>
                    ))}
                  </>
                ) : (
                  `: ${invoiceData.invoiceDetails?.roomNo}`
                )}
              </p>
              <p className="font-bold">CheckIn Date</p>
              <p className="font-medium">: {invoiceData.invoiceDetails?.checkInDate}</p>
              <p className="font-bold">CheckOut Date</p>
              <p className="font-medium">: {invoiceData.invoiceDetails?.checkOutDate}</p>
              {bookingData?.planPackage && (
                <>
                  <p className="font-bold">Package Plan</p>
                  <p className="font-medium">: {(() => {
                    const planMap = {
                      'EP': 'EP – Room Only',
                      'CP': 'CP – Room + Breakfast',
                      'MAP': 'MAP – Room + Breakfast + Lunch/Dinner',
                      'AP': 'AP – Room + All Meals',
                      'AI': 'AI – All Inclusive'
                    };
                    return planMap[bookingData.planPackage] || bookingData.planPackage;
                  })()}</p>
                </>
              )}
              {bookingData?.amendmentHistory && bookingData.amendmentHistory.length > 0 && (
                <>
                  <p className="font-bold text-red-600">Amended</p>
                  <p className="font-medium text-red-600">: {bookingData.amendmentHistory.length} time(s)</p>
                </>
              )}
              {bookingData?.advancePayments && bookingData.advancePayments.length > 0 && (
                <>
                  <p className="font-bold text-green-600">Total Advance Paid</p>
                  <p className="font-medium text-green-600">: ₹{bookingData.advancePayments.reduce((sum, payment) => sum + (payment.amount || 0), 0).toFixed(2)}</p>
                </>
              )}
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
                <td className="p-1 text-right border border-black font-bold">₹{(() => {
                  if (!invoiceData?.items) return '0.00';
                  const declaredRateTotal = invoiceData.items.reduce((sum, item) => {
                    return sum + (item.isFree ? 0 : (item.declaredRate || 0));
                  }, 0);
                  return declaredRateTotal.toFixed(2);
                })()}</td>
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
                      <td className="p-0.5 border border-black text-center text-xs">{bookingData?.cgstRate !== undefined && bookingData?.sgstRate !== undefined ? ((bookingData.cgstRate + bookingData.sgstRate) * 100).toFixed(1) : (gstRates.cgstRate + gstRates.sgstRate).toFixed(1)}</td>
                      <td className="p-0.5 border border-black text-right text-xs">{(() => {
                        if (!invoiceData?.items) return '0.00';
                        const taxableAmount = invoiceData.items.reduce((sum, item) => {
                          return sum + (item.isFree ? 0 : (item.amount || 0));
                        }, 0);
                        return taxableAmount.toFixed(2);
                      })()}</td>
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
                      <td className="p-0.5 border-l border-black text-right text-xs">₹{(() => {
                        if (!invoiceData?.items) return '0.00';
                        const taxableAmount = invoiceData.items.reduce((sum, item) => {
                          return sum + (item.isFree ? 0 : (item.amount || 0));
                        }, 0);
                        return taxableAmount.toFixed(2);
                      })()}</td>
                    </tr>
                    <tr>
                      <td className="p-0.5 text-right text-xs font-medium">SGST ({bookingData?.sgstRate !== undefined ? (bookingData.sgstRate * 100).toFixed(1) : gstRates.sgstRate}%):</td>
                      <td className="p-0.5 border-l border-black text-right text-xs">₹{(() => {
                        if (!invoiceData?.items) return '0.00';
                        const taxableAmount = invoiceData.items.reduce((sum, item) => {
                          return sum + (item.isFree ? 0 : (item.amount || 0));
                        }, 0);
                        const sgstRate = bookingData?.sgstRate !== undefined ? bookingData.sgstRate : (gstRates.sgstRate / 100);
                        return (taxableAmount * sgstRate).toFixed(2);
                      })()}</td>
                    </tr>
                    <tr>
                      <td className="p-0.5 text-right text-xs font-medium">CGST ({bookingData?.cgstRate !== undefined ? (bookingData.cgstRate * 100).toFixed(1) : gstRates.cgstRate}%):</td>
                      <td className="p-0.5 border-l border-black text-right text-xs">₹{(() => {
                        if (!invoiceData?.items) return '0.00';
                        const taxableAmount = invoiceData.items.reduce((sum, item) => {
                          return sum + (item.isFree ? 0 : (item.amount || 0));
                        }, 0);
                        const cgstRate = bookingData?.cgstRate !== undefined ? bookingData.cgstRate : (gstRates.cgstRate / 100);
                        return (taxableAmount * cgstRate).toFixed(2);
                      })()}</td>
                    </tr>
                    {/* Room service charges are already included in taxable amount, no need to show separately */}
                    <tr>
                      <td className="p-0.5 text-right text-xs font-medium">Round Off:</td>
                      <td className="p-0.5 border-l border-black text-right text-xs">{calculateRoundOff() >= 0 ? '+' : ''}{calculateRoundOff().toFixed(2)}</td>
                    </tr>
                    <tr className="bg-gray-200">
                      <td className="p-0.5 font-bold text-right text-xs">NET AMOUNT:</td>
                      <td className="p-0.5 border-l border-black text-right font-bold text-xs">₹{calculateNetTotal()}</td>
                    </tr>
                    {bookingData?.advancePayments && bookingData.advancePayments.length > 0 && (
                      <>
                        <tr className="bg-green-50">
                          <td className="p-0.5 text-right text-xs font-medium text-green-700">Total Advance Received:</td>
                          <td className="p-0.5 border-l border-black text-right text-xs font-bold text-green-700">₹{bookingData.advancePayments.reduce((sum, payment) => sum + (payment.amount || 0), 0).toFixed(2)}</td>
                        </tr>
                        <tr className="bg-orange-50">
                          <td className="p-0.5 font-bold text-right text-xs text-orange-700">BALANCE DUE:</td>
                          <td className="p-0.5 border-l border-black text-right font-bold text-xs text-orange-700">₹{(parseFloat(calculateNetTotal()) - bookingData.advancePayments.reduce((sum, payment) => sum + (payment.amount || 0), 0)).toFixed(2)}</td>
                        </tr>
                      </>
                    )}
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
        
        {/* Amendment History */}
        {bookingData?.amendmentHistory && bookingData.amendmentHistory.length > 0 && (
          <div className="mb-4 text-xs">
            <p className="font-bold mb-2">Amendment History:</p>
            <div className="border border-black">
              <table className="w-full">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="p-1 border border-black text-xs">Date</th>
                    <th className="p-1 border border-black text-xs">Original Dates</th>
                    <th className="p-1 border border-black text-xs">New Dates</th>
                    <th className="p-1 border border-black text-xs">Adjustment</th>
                  </tr>
                </thead>
                <tbody>
                  {bookingData.amendmentHistory.map((amendment, index) => (
                    <tr key={index}>
                      <td className="p-1 border border-black text-xs">
                        {new Date(amendment.amendedOn).toLocaleDateString()}
                      </td>
                      <td className="p-1 border border-black text-xs">
                        {new Date(amendment.originalCheckIn).toLocaleDateString()} - {new Date(amendment.originalCheckOut).toLocaleDateString()}
                      </td>
                      <td className="p-1 border border-black text-xs">
                        {new Date(amendment.newCheckIn).toLocaleDateString()} - {new Date(amendment.newCheckOut).toLocaleDateString()}
                      </td>
                      <td className="p-1 border border-black text-xs text-right">
                        ₹{amendment.totalAdjustment?.toFixed(2) || '0.00'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Multiple Advance Payments Details */}
        {bookingData?.advancePayments && bookingData.advancePayments.length > 0 && (
          <div className="mb-4 text-xs">
            <p className="font-bold mb-2">Advance Payment Details ({bookingData.advancePayments.length} payment(s)):</p>
            <div className="border border-black bg-green-50">
              <table className="w-full">
                <thead className="bg-green-100">
                  <tr>
                    <th className="p-1 border border-black text-xs">#</th>
                    <th className="p-1 border border-black text-xs">Amount</th>
                    <th className="p-1 border border-black text-xs">Mode</th>
                    <th className="p-1 border border-black text-xs">Date</th>
                    <th className="p-1 border border-black text-xs">Reference</th>
                    <th className="p-1 border border-black text-xs">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {bookingData.advancePayments.map((payment, index) => (
                    <tr key={index}>
                      <td className="p-1 border border-black text-xs text-center">{index + 1}</td>
                      <td className="p-1 border border-black text-xs text-right font-bold text-green-700">₹{payment.amount.toFixed(2)}</td>
                      <td className="p-1 border border-black text-xs text-center">{payment.paymentMode}</td>
                      <td className="p-1 border border-black text-xs text-center">{new Date(payment.paymentDate).toLocaleDateString()}</td>
                      <td className="p-1 border border-black text-xs text-center">{payment.reference || '-'}</td>
                      <td className="p-1 border border-black text-xs">{payment.notes || '-'}</td>
                    </tr>
                  ))}
                  <tr className="bg-green-200">
                    <td colSpan="1" className="p-1 border border-black font-bold text-xs text-right">Total:</td>
                    <td className="p-1 border border-black text-xs text-right font-bold text-green-700">₹{bookingData.advancePayments.reduce((sum, payment) => sum + (payment.amount || 0), 0).toFixed(2)}</td>
                    <td colSpan="4" className="p-1 border border-black text-xs"></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

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