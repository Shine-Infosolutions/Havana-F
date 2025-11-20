import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { showToast } from '../../utils/toaster';
import {
  FaUser,
  FaPhone,
  FaCity,
  FaMapMarkedAlt,
  FaBuilding,
  FaGlobe,
  FaRegAddressCard,
  FaMobileAlt,
  FaEnvelope,
  FaMoneyCheckAlt,
  FaCalendarAlt,
  FaClock,
  FaDoorOpen,
  FaUsers,
  FaConciergeBell,
  FaInfoCircle,
  FaSuitcase,
  FaComments,
  FaFileInvoiceDollar,
  FaCheckCircle,
  FaSignInAlt,
  FaPassport,
  FaIdCard,
  FaCreditCard,
  FaCashRegister,
  FaAddressBook,
  FaRegListAlt,
  FaRegUser,
  FaRegCalendarPlus,
  FaRegCheckCircle,
  FaRegTimesCircle,
  FaRegUserCircle,
  FaRegCreditCard,
  FaRegStar,
  FaRegFlag,
  FaRegEdit,
  FaRegClone,
  FaRegCommentDots,
  FaRegFileAlt,
  FaRegCalendarCheck,
  FaRegCalendarTimes,
  FaRegMap,
  FaHotel,
  FaTimes,
} from "react-icons/fa";

// Apply golden theme
const themeStyles = `
  :root {
    --color-primary: hsl(45, 70%, 50%);
    --color-secondary: hsl(45, 71%, 69%);
    --color-accent: hsl(45, 100%, 80%);
    --color-background: hsl(45, 100%, 95%);
    --color-text: hsl(45, 100%, 20%);
    --color-border: hsl(45, 100%, 85%);
    --color-hover: hsl(45, 80%, 40%);
  }
`;

// Inject theme styles
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = themeStyles;
  document.head.appendChild(styleElement);
}

// Shadcn-like components
const Button = ({
  children,
  onClick,
  className = "",
  disabled,
  type = "button",
  variant = "default",
}) => {
  const baseClasses =
    "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-9 px-4 py-2";
  const variants = {
    default: "bg-[hsl(45,43%,58%)] text-white border border-[hsl(45,43%,58%)] shadow hover:bg-[hsl(45,32%,46%)]",
    outline:
      "border border-[hsl(45,100%,85%)] bg-transparent hover:bg-[hsl(45,100%,95%)] hover:text-[hsl(45,100%,20%)]",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

const Input = ({
  type,
  placeholder,
  value,
  onChange,
  className = "",
  ...props
}) => (
  <input
    type={type}
    placeholder={placeholder}
    value={value || ""}
    onChange={onChange}
    className={`flex h-9 w-full rounded-md border border-gray-300 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50 min-w-0 ${className}`}
    {...props}
  />
);

const Label = ({ children, htmlFor, className = "" }) => (
  <label
    htmlFor={htmlFor}
    className={`block text-sm font-medium text-gray-700 ${className}`}
  >
    {children}
  </label>
);

const Select = ({
  value,
  onChange,
  children,
  className = "",
  name,
  ...props
}) => (
  <select
    value={value}
    onChange={onChange}
    name={name}
    className={`flex h-9 w-full items-center justify-between rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50 truncate ${className}`}
    {...props}
  >
    {children}
  </select>
);

const Checkbox = ({ id, checked, onChange, className = "" }) => (
  <input
    type="checkbox"
    id={id}
    checked={checked}
    onChange={onChange}
    className={`h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 ${className}`}
  />
);

const EditBookingForm = () => {
  const { axios } = useAppContext();
  const location = useLocation();
  const navigate = useNavigate();
  const editBooking = location.state?.editBooking;

  const [formData, setFormData] = useState({
    grcNo: '',
    reservationId: '',
    categoryId: '',
    bookingDate: new Date().toISOString().split('T')[0],
    numberOfRooms: 1,
    isActive: true,
    checkInDate: '',
    checkOutDate: '',
    days: 0,
    timeIn: '12:00',
    timeOut: '12:00',
    salutation: 'mr.',
    name: '',
    age: '',
    gender: '',
    address: '',
    city: '',
    nationality: '',
    mobileNo: '',
    email: '',
    phoneNo: '',
    birthDate: '',
    anniversary: '',
    companyName: '',
    companyGSTIN: '',
    idProofType: '',
    idProofNumber: '',
    idProofImageUrl: '',
    idProofImageUrl2: '',
    photoUrl: '',
    roomNumber: '',
    planPackage: '',
    noOfAdults: 1,
    noOfChildren: 0,
    rate: 0,
    cgstRate: 2.5,
    sgstRate: 2.5,
    taxIncluded: false,
    serviceCharge: false,
    arrivedFrom: '',
    destination: '',
    remark: '',
    businessSource: '',
    marketSegment: '',
    purposeOfVisit: '',
    discountPercent: 0,
    discountRoomSource: 0,
    paymentMode: '',
    paymentStatus: 'Pending',
    bookingRefNo: '',
    mgmtBlock: 'No',
    billingInstruction: '',
    temperature: '',
    fromCSV: false,
    epabx: false,
    vip: false,
    status: 'Booked'
  });

  useEffect(() => {
    if (editBooking) {
      setFormData({
        grcNo: editBooking.grcNo || '',
        reservationId: editBooking.reservationId || '',
        categoryId: editBooking.categoryId || '',
        bookingDate: editBooking.bookingDate ? new Date(editBooking.bookingDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        numberOfRooms: editBooking.numberOfRooms || 1,
        isActive: editBooking.isActive !== undefined ? editBooking.isActive : true,
        checkInDate: editBooking.checkInDate ? new Date(editBooking.checkInDate).toISOString().split('T')[0] : '',
        checkOutDate: editBooking.checkOutDate ? new Date(editBooking.checkOutDate).toISOString().split('T')[0] : '',
        days: editBooking.days || 0,
        timeIn: editBooking.timeIn || '12:00',
        timeOut: editBooking.timeOut || '12:00',
        salutation: editBooking.salutation || 'mr.',
        name: editBooking.name || '',
        age: editBooking.age || '',
        gender: editBooking.gender || '',
        address: editBooking.address || '',
        city: editBooking.city || '',
        nationality: editBooking.nationality || '',
        mobileNo: editBooking.mobileNo || '',
        email: editBooking.email || '',
        phoneNo: editBooking.phoneNo || '',
        birthDate: editBooking.birthDate ? new Date(editBooking.birthDate).toISOString().split('T')[0] : '',
        anniversary: editBooking.anniversary ? new Date(editBooking.anniversary).toISOString().split('T')[0] : '',
        companyName: editBooking.companyName || '',
        companyGSTIN: editBooking.companyGSTIN || '',
        idProofType: editBooking.idProofType || '',
        idProofNumber: editBooking.idProofNumber || '',
        idProofImageUrl: editBooking.idProofImageUrl || '',
        idProofImageUrl2: editBooking.idProofImageUrl2 || '',
        photoUrl: editBooking.photoUrl || '',
        roomNumber: editBooking.roomNumber || '',
        planPackage: editBooking.planPackage || '',
        noOfAdults: editBooking.noOfAdults || 1,
        noOfChildren: editBooking.noOfChildren || 0,
        rate: editBooking.rate || 0,
        cgstRate: editBooking.cgstRate ? editBooking.cgstRate * 100 : 2.5,
        sgstRate: editBooking.sgstRate ? editBooking.sgstRate * 100 : 2.5,
        taxIncluded: editBooking.taxIncluded || false,
        serviceCharge: editBooking.serviceCharge || false,
        arrivedFrom: editBooking.arrivedFrom || '',
        destination: editBooking.destination || '',
        remark: editBooking.remark || '',
        businessSource: editBooking.businessSource || '',
        marketSegment: editBooking.marketSegment || '',
        purposeOfVisit: editBooking.purposeOfVisit || '',
        discountPercent: editBooking.discountPercent || 0,
        discountRoomSource: editBooking.discountRoomSource || 0,
        paymentMode: editBooking.paymentMode || '',
        paymentStatus: editBooking.paymentStatus || 'Pending',
        bookingRefNo: editBooking.bookingRefNo || '',
        mgmtBlock: editBooking.mgmtBlock || 'No',
        billingInstruction: editBooking.billingInstruction || '',
        temperature: editBooking.temperature || '',
        fromCSV: editBooking.fromCSV || false,
        epabx: editBooking.epabx || false,
        vip: editBooking.vip || false,
        status: editBooking.status || 'Booked'
      });
    } else {
      navigate('/booking');
    }
  }, [editBooking, navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const updateData = {
        ...formData,
        cgstRate: formData.cgstRate / 100,
        sgstRate: formData.sgstRate / 100
      };

      await axios.put(`/api/bookings/update/${editBooking._id}`, updateData);
      showToast('Booking updated successfully!', 'success');
      navigate('/booking');
    } catch (error) {
      console.error('Error updating booking:', error);
      showToast('Failed to update booking', 'error');
    }
  };

  const calculateTaxBreakdown = () => {
    const totalRate = formData.rate || 0;
    const totalTaxRate = (formData.cgstRate + formData.sgstRate) / 100;
    const taxableAmount = totalRate / (1 + totalTaxRate);
    const cgstAmount = taxableAmount * (formData.cgstRate / 100);
    const sgstAmount = taxableAmount * (formData.sgstRate / 100);
    
    return { taxableAmount, cgstAmount, sgstAmount };
  };

  const { taxableAmount, cgstAmount, sgstAmount } = calculateTaxBreakdown();

  return (
    <div className="min-h-screen" style={{backgroundColor: 'hsl(45, 100%, 95%)'}}>
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold" style={{color: 'hsl(45, 100%, 20%)'}}>
            Edit Booking - {formData.name}
          </h1>
        </div>
      </header>
      <main className="container mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-6 space-y-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Guest Details Section */}
              <section className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-full" style={{backgroundColor: 'hsl(45, 100%, 85%)'}}>
                    <FaUser className="text-lg" style={{color: 'hsl(45, 43%, 58%)'}} />
                  </div>
                  <h2 className="text-xl font-semibold" style={{color: 'hsl(45, 100%, 20%)'}}>
                    Guest Details
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="grcNo">GRC No.</Label>
                    <Input
                      id="grcNo"
                      name="grcNo"
                      value={formData.grcNo}
                      readOnly
                      className="bg-gray-100 border border-gray-300 rounded-lg cursor-not-allowed"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="salutation">Salutation</Label>
                    <Select
                      id="salutation"
                      name="salutation"
                      value={formData.salutation}
                      onChange={handleChange}
                    >
                      <option value="mr.">Mr.</option>
                      <option value="mrs.">Mrs.</option>
                      <option value="ms.">Ms.</option>
                      <option value="dr.">Dr.</option>
                      <option value="other">Other</option>
                    </Select>
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="name">
                      Guest Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="age">Age</Label>
                    <Input
                      id="age"
                      name="age"
                      type="number"
                      value={formData.age}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <Select
                      id="gender"
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mobileNo">Mobile No</Label>
                    <Input
                      id="mobileNo"
                      name="mobileNo"
                      type="tel"
                      value={formData.mobileNo}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phoneNo">Whatsapp No</Label>
                    <Input
                      id="phoneNo"
                      name="phoneNo"
                      type="tel"
                      value={formData.phoneNo}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="birthDate">Date of Birth</Label>
                    <Input
                      id="birthDate"
                      name="birthDate"
                      type="date"
                      value={formData.birthDate}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="anniversary">Anniversary Date</Label>
                    <Input
                      id="anniversary"
                      name="anniversary"
                      type="date"
                      value={formData.anniversary}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input
                      id="companyName"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyGSTIN">Company GSTIN</Label>
                    <Input
                      id="companyGSTIN"
                      name="companyGSTIN"
                      value={formData.companyGSTIN}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="idProofType">ID Proof Type</Label>
                    <Select
                      id="idProofType"
                      name="idProofType"
                      value={formData.idProofType}
                      onChange={handleChange}
                    >
                      <option value="">Select ID Proof Type</option>
                      <option value="Aadhaar">Aadhaar</option>
                      <option value="PAN">PAN</option>
                      <option value="Voter ID">Voter ID</option>
                      <option value="Passport">Passport</option>
                      <option value="Driving License">Driving License</option>
                      <option value="Other">Other</option>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="idProofNumber">ID Proof Number</Label>
                    <Input
                      id="idProofNumber"
                      name="idProofNumber"
                      value={formData.idProofNumber}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nationality">Nationality</Label>
                    <Input
                      id="nationality"
                      name="nationality"
                      value={formData.nationality}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2 flex items-center gap-2">
                    <Checkbox
                      id="vip"
                      checked={formData.vip}
                      onChange={(e) => setFormData(prev => ({ ...prev, vip: e.target.checked }))}
                    />
                    <Label htmlFor="vip">VIP Guest</Label>
                  </div>
                </div>
              </section>

              {/* Stay Information Section */}
              <section className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-full" style={{backgroundColor: 'hsl(45, 100%, 85%)'}}>
                    <FaHotel className="text-lg" style={{color: 'hsl(45, 43%, 58%)'}} />
                  </div>
                  <h2 className="text-xl font-semibold" style={{color: 'hsl(45, 100%, 20%)'}}>
                    Stay Information
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="checkInDate">Check-in Date</Label>
                    <Input
                      id="checkInDate"
                      name="checkInDate"
                      type="date"
                      value={formData.checkInDate}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="checkOutDate">Check-out Date</Label>
                    <Input
                      id="checkOutDate"
                      name="checkOutDate"
                      type="date"
                      value={formData.checkOutDate}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="roomNumber">Room Number</Label>
                    <Input
                      id="roomNumber"
                      name="roomNumber"
                      value={formData.roomNumber}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="noOfAdults">Adults</Label>
                    <Input
                      id="noOfAdults"
                      name="noOfAdults"
                      type="number"
                      min="1"
                      value={formData.noOfAdults}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="noOfChildren">Children</Label>
                    <Input
                      id="noOfChildren"
                      name="noOfChildren"
                      type="number"
                      min="0"
                      value={formData.noOfChildren}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="planPackage">Package Plan</Label>
                    <Input
                      id="planPackage"
                      name="planPackage"
                      value={formData.planPackage}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timeIn">Check-in Time</Label>
                    <Input
                      id="timeIn"
                      name="timeIn"
                      type="time"
                      value={formData.timeIn}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timeOut">Check-out Time</Label>
                    <Input
                      id="timeOut"
                      name="timeOut"
                      type="time"
                      value={formData.timeOut}
                      onChange={handleChange}
                      disabled
                    />
                  </div>
                  <div className="space-y-2 col-span-1 md:col-span-2">
                    <Label htmlFor="arrivedFrom">Arrival From</Label>
                    <Input
                      id="arrivedFrom"
                      name="arrivedFrom"
                      value={formData.arrivedFrom}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2 col-span-1 md:col-span-2">
                    <Label htmlFor="purposeOfVisit">Purpose of Visit</Label>
                    <Input
                      id="purposeOfVisit"
                      name="purposeOfVisit"
                      value={formData.purposeOfVisit}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      id="status"
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                    >
                      <option value="Booked">Booked</option>
                      <option value="Checked In">Checked In</option>
                      <option value="Checked Out">Checked Out</option>
                      <option value="Cancelled">Cancelled</option>
                    </Select>
                  </div>
                  <div className="space-y-2 col-span-full">
                    <Label htmlFor="remark">Remarks</Label>
                    <textarea
                      id="remark"
                      name="remark"
                      value={formData.remark}
                      onChange={handleChange}
                      className="flex w-full rounded-md bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 disabled:cursor-not-allowed disabled:opacity-50"
                      style={{ border: '1px solid hsl(45, 100%, 85%)', color: 'hsl(45, 100%, 20%)' }}
                      rows="3"
                    />
                  </div>
                </div>
              </section>

              {/* Payment Info Section */}
              <section className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-full" style={{backgroundColor: 'hsl(45, 100%, 85%)'}}>
                    <FaCreditCard className="text-lg" style={{color: 'hsl(45, 43%, 58%)'}} />
                  </div>
                  <h2 className="text-xl font-semibold" style={{color: 'hsl(45, 100%, 20%)'}}>
                    Payment Details
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="rate">Total Rate</Label>
                    <Input
                      id="rate"
                      name="rate"
                      type="number"
                      value={formData.rate}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cgstRate">CGST Rate (%)</Label>
                    <Input
                      id="cgstRate"
                      name="cgstRate"
                      type="number"
                      step="0.1"
                      min="0"
                      max="50"
                      value={formData.cgstRate}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sgstRate">SGST Rate (%)</Label>
                    <Input
                      id="sgstRate"
                      name="sgstRate"
                      type="number"
                      step="0.1"
                      min="0"
                      max="50"
                      value={formData.sgstRate}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2 lg:col-span-3">
                    <Label>Tax Breakdown</Label>
                    <div className="bg-gray-50 p-3 rounded border">
                      <div className="text-sm space-y-1">
                        <div className="flex justify-between">
                          <span>Taxable Amount:</span>
                          <span>₹{taxableAmount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>CGST ({formData.cgstRate}%):</span>
                          <span>₹{cgstAmount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>SGST ({formData.sgstRate}%):</span>
                          <span>₹{sgstAmount.toFixed(2)}</span>
                        </div>
                        <hr className="my-1" />
                        <div className="flex justify-between font-semibold">
                          <span>Total with Tax:</span>
                          <span>₹{formData.rate}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="paymentMode">Payment Mode</Label>
                    <Select
                      id="paymentMode"
                      name="paymentMode"
                      value={formData.paymentMode}
                      onChange={handleChange}
                    >
                      <option value="">Select Payment Mode</option>
                      <option value="Cash">Cash</option>
                      <option value="Card">Card</option>
                      <option value="UPI">UPI</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="paymentStatus">Payment Status</Label>
                    <Select
                      id="paymentStatus"
                      name="paymentStatus"
                      value={formData.paymentStatus}
                      onChange={handleChange}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Paid">Paid</option>
                      <option value="Failed">Failed</option>
                      <option value="Partial">Partial</option>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="discountPercent">Discount (%)</Label>
                    <Input
                      id="discountPercent"
                      name="discountPercent"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.discountPercent}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2 col-span-full">
                    <Label htmlFor="billingInstruction">Billing Instruction</Label>
                    <textarea
                      id="billingInstruction"
                      name="billingInstruction"
                      value={formData.billingInstruction}
                      onChange={handleChange}
                      className="flex w-full rounded-md bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 disabled:cursor-not-allowed disabled:opacity-50"
                      style={{ border: '1px solid hsl(45, 100%, 85%)', color: 'hsl(45, 100%, 20%)' }}
                      rows="3"
                    />
                  </div>
                </div>
              </section>

              <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
                <Button
                  type="button"
                  onClick={() => navigate('/booking')}
                  variant="outline"
                  className="px-8 py-3 font-semibold rounded-lg shadow-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="px-8 py-3 font-semibold rounded-lg shadow-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 w-full sm:w-auto"
                >
                  Update Booking
                </Button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default EditBookingForm;