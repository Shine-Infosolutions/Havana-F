import React, { useState, useEffect } from "react";
import { FaIndianRupeeSign } from "react-icons/fa6";
import { SlCalender } from "react-icons/sl";
import {
  Calendar,
  Users,
  Home,
  PlusCircle,
  Percent,
  Star,
  CheckCircle,
  Clock,
  AlertTriangle,
  LogOut,
} from "lucide-react";
import { useAppContext } from "../context/AppContext";
import { useNavigate } from "react-router-dom";
import BookingCalendar from "./BookingCalendar";


import DashboardLoader from "./DashboardLoader";


const Dashboard = () => {
  const { axios } = useAppContext();
  const navigate = useNavigate();
  const [activeCard, setActiveCard] = useState(() => {
    const savedCard = localStorage.getItem("activeCard");
    return savedCard || "bookings"; // Default to "bookings"
  });
  const [timeFrame, setTimeFrame] = useState("weekly");
  const [showCalendar, setShowCalendar] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);


  const [dashboardCards, setDashboardCards] = useState([]);
  const [allServiceData, setAllServiceData] = useState({
    laundry: [],
    restaurant: [],
    pantry: [],

    banquet: [],
    reservations: []
  });
  const [loading, setLoading] = useState(true);
  const handleCalendarClick = () => {
    setShowCalendar(true);
  };
  const [selectedYear, setSelectedYear] = useState(2025);

  const fetchRooms = async () => {
    try {
      const { data } = await axios.get("/api/rooms/all", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const roomsData = Array.isArray(data) ? data : (data.rooms || data.data || []);
      setRooms(roomsData);
    } catch (error) {
      console.log('Rooms API Error:', error);
      setRooms([]);
    }
  };

  const fetchBookings = async () => {
    try {
      const { data } = await axios.get("/api/bookings/all", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const bookingsData = Array.isArray(data) ? data : data.bookings || [];
      setBookings(bookingsData);
    } catch (error) {
      console.log('Bookings API Error:', error);
      setBookings([]);
    }
  };





  const fetchAllServiceData = async () => {
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };
    
    try {
      const [laundryRes, restaurantRes, pantryRes, banquetRes, reservationRes] = await Promise.allSettled([
        axios.get("/api/laundry/all", { headers }),
        axios.get("/api/restaurant/all", { headers }),
        axios.get("/api/pantry/all", { headers }),
        axios.get("/api/banquet-bookings", { headers }),
        axios.get("/api/restaurant-reservations/all", { headers })
      ]);

      const banquetData = banquetRes.status === 'fulfilled' ? (Array.isArray(banquetRes.value.data) ? banquetRes.value.data : banquetRes.value.data.banquet || banquetRes.value.data.bookings || []) : [];
      
      const reservationData = reservationRes.status === 'fulfilled' ? (Array.isArray(reservationRes.value.data) ? reservationRes.value.data : reservationRes.value.data.orders || reservationRes.value.data.reservations || []) : [];
      

      
      setAllServiceData({
        laundry: laundryRes.status === 'fulfilled' ? (Array.isArray(laundryRes.value.data) ? laundryRes.value.data : laundryRes.value.data.laundry || []) : [],
        restaurant: restaurantRes.status === 'fulfilled' ? (Array.isArray(restaurantRes.value.data) ? restaurantRes.value.data : restaurantRes.value.data.restaurant || []) : [],
        pantry: pantryRes.status === 'fulfilled' ? (Array.isArray(pantryRes.value.data) ? pantryRes.value.data : pantryRes.value.data.pantry || []) : [],
        banquet: banquetData,
        reservations: reservationData
      });
    } catch (error) {
      console.error('Service APIs Error:', error);
    }
  };

  const calculateTrends = () => {
    const now = new Date();
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const currentWeekBookings = bookings.filter(b => new Date(b.createdAt) >= lastWeek);
    const previousWeekBookings = bookings.filter(b => {
      const date = new Date(b.createdAt);
      return date >= new Date(lastWeek.getTime() - 7 * 24 * 60 * 60 * 1000) && date < lastWeek;
    });
    
    const currentRevenue = currentWeekBookings.reduce((sum, b) => {
      const taxableAmount = Number(b.taxableAmount) || 0;
      const cgstAmount = Number(b.cgstAmount) || 0;
      const sgstAmount = Number(b.sgstAmount) || 0;
      const bookingTotal = taxableAmount + cgstAmount + sgstAmount;
      if (bookingTotal > 1000000 || bookingTotal < 0) return sum;
      return sum + bookingTotal;
    }, 0);
    const previousRevenue = previousWeekBookings.reduce((sum, b) => {
      const taxableAmount = Number(b.taxableAmount) || 0;
      const cgstAmount = Number(b.cgstAmount) || 0;
      const sgstAmount = Number(b.sgstAmount) || 0;
      const bookingTotal = taxableAmount + cgstAmount + sgstAmount;
      if (bookingTotal > 1000000 || bookingTotal < 0) return sum;
      return sum + bookingTotal;
    }, 0);
    
    const revenueTrend = previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue * 100) : 0;
    const bookingsTrend = previousWeekBookings.length > 0 ? ((currentWeekBookings.length - previousWeekBookings.length) / previousWeekBookings.length * 100) : 0;
    
    return { revenueTrend, bookingsTrend };
  };

  const updateDashboardCards = () => {
    const availableRooms = rooms.filter(room => room.status === 'available').length;
    const totalBookingRevenue = bookings.reduce((total, booking) => {
      const taxableAmount = Number(booking.taxableAmount) || 0;
      const cgstAmount = Number(booking.cgstAmount) || 0;
      const sgstAmount = Number(booking.sgstAmount) || 0;
      const bookingTotal = taxableAmount + cgstAmount + sgstAmount;
      // Skip invalid amounts (too large or negative)
      if (bookingTotal > 1000000 || bookingTotal < 0) return total;
      return total + bookingTotal;
    }, 0);
    const { revenueTrend, bookingsTrend } = calculateTrends();
    
    const cards = [
      {
        id: "bookings",
        title: "Bookings",
        value: bookings.length.toString(),
        icon: "Calendar",
        color: "bg-primary",
        trend: `${bookingsTrend >= 0 ? '+' : ''}${bookingsTrend.toFixed(1)}%`,
        trendUp: bookingsTrend >= 0,
      },
      {
        id: "rooms",
        title: "Rooms Available",
        value: availableRooms.toString(),
        icon: "Home",
        color: "bg-primary",
        trend: "+0%",
        trendUp: true,
      },
      {
        id: "revenue",
        title: "Booking Revenue",
        value: `₹${totalBookingRevenue.toLocaleString()}`,
        icon: "FaIndianRupeeSign",
        color: "bg-primary",
        trend: `${revenueTrend >= 0 ? '+' : ''}${revenueTrend.toFixed(1)}%`,
        trendUp: revenueTrend >= 0,
      },
      {
        id: "occupancy",
        title: "Occupancy Rate",
        value: `${rooms.length > 0 ? Math.round((rooms.filter(room => room.status !== 'available').length / rooms.length) * 100) : 0}%`,
        icon: "Percent",
        color: "bg-primary",
        trend: "+0%",
        trendUp: true,
      },
      {
        id: "guests",
        title: "Active Guests",
        value: bookings.filter(booking => booking.status === 'Checked In').reduce((total, booking) => total + (booking.noOfAdults || 0) + (booking.noOfChildren || 0), 0).toString(),
        icon: "Users",
        color: "bg-primary",
        trend: "+0%",
        trendUp: true,
      },
      {
        id: "rating",
        title: "Avg. Rating",
        value: "0.0",
        icon: "Star",
        color: "bg-primary",
        trend: "+0.0",
        trendUp: true,
      },
    ];
    setDashboardCards(cards);
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([fetchRooms(), fetchBookings(), fetchAllServiceData()]);
      setLoading(false);
    };
    fetchData();
  }, []);

  useEffect(() => {
    updateDashboardCards();
  }, [rooms, bookings]);

  const getRoomCategories = () => {
    const categories = {};
    rooms.forEach(room => {
      // Handle category as object or string
      let category = 'Standard';
      if (room.category) {
        if (typeof room.category === 'string') {
          category = room.category;
        } else if (room.category.name) {
          category = room.category.name;
        } else if (room.category.type) {
          category = room.category.type;
        }
      } else if (room.roomType) {
        if (typeof room.roomType === 'string') {
          category = room.roomType;
        } else if (room.roomType.name) {
          category = room.roomType.name;
        }
      }
      
      if (!categories[category]) {
        categories[category] = {
          total: 0,
          available: 0,
          occupied: 0
        };
      }
      categories[category].total++;
      if (room.status === 'available') {
        categories[category].available++;
      } else {
        categories[category].occupied++;
      }
    });
    return categories;
  };

  const toggleCard = (cardId) => {
    const newActiveCard = activeCard === cardId ? null : cardId;
    setActiveCard(newActiveCard);
    if (newActiveCard) {
      localStorage.setItem("activeCard", newActiveCard);
    } else {
      localStorage.removeItem("activeCard");
    }
  };

  const getIcon = (iconName) => {
    switch (iconName) {
      case "Calendar":
        return Calendar;
      case "Home":
        return Home;
      case "FaIndianRupeeSign":
        return FaIndianRupeeSign;
      case "Percent":
        return Percent;
      case "Users":
        return Users;
      case "Star":
        return Star;
      default:
        return null;
    }
  };

  // Card detail content based on active card
  const renderCardDetail = () => {
    return <div className="p-4 text-center text-gray-500">Card details coming soon...</div>;
  };

  if (loading) {
    return <DashboardLoader />;
  }

  return (
    <div className="p-4 sm:p-6 overflow-auto h-full bg-background">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 mt-4 sm:mt-6 gap-4">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-[#1f2937]">
          HAVANA DASHBOARD
        </h1>
        <button
          onClick={handleCalendarClick}
          className="p-2 rounded-full hover:bg-background transition-colors self-end sm:self-auto"
        >
          <SlCalender className="w-6 sm:w-8 h-6 sm:h-8 text-primary hover:bg-primary hover:text-white" />
        </button>
      </div>
      {/* Status Summary */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-col sm:flex-row flex-wrap gap-4 items-start sm:items-center">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
            <span className="text-sm">12 Check-ins Today</span>
          </div>
          <div className="flex items-center">
            <Clock className="w-5 h-5 text-primary mr-2" />
            <span className="text-sm">8 Check-outs Today</span>
          </div>
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
            <span className="text-sm">3 Rooms Need Maintenance</span>
          </div>
        </div>
      </div>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        {dashboardCards.map((card) => {
          const IconComponent = getIcon(card.icon);
          return (
            <div
              key={card.id}
              className={`bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 ${
                activeCard === card.id
                  ? "ring-2 ring-red-500"
                  : "hover:shadow-lg"
              }`}
              onClick={() => toggleCard(card.id)}
            >
              <div className="p-4 cursor-pointer">
                <div className="flex justify-between items-center mb-2">
                  <div className={`p-2 rounded-lg ${card.color} text-white`}>
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <span
                    className={`text-xs font-medium ${
                      card.trendUp ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {card.trend}
                  </span>
                </div>
                <h3 className="text-sm text-text/70">{card.title}</h3>
                <p className="text-2xl font-bold text-[#1f2937]">
                  {card.value}
                </p>
              </div>
              <div
                className={`h-1 ${
                  activeCard === card.id ? "bg-red-500" : card.color
                }`}
              ></div>
            </div>
          );
        })}
      </div>
      {/* Detail Section */}
      {activeCard && (
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4">
            <h2 className="text-lg sm:text-xl font-extrabold text-[#1f2937]">
              {dashboardCards.find((c) => c.id === activeCard)?.title} Details
            </h2>
          </div>
          {renderCardDetail()}
        </div>
      )}


      {/* Room Categories */}
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6">
        <h2 className="text-lg sm:text-xl font-extrabold text-[#1f2937] mb-4">
          Room Categories & Availability
        </h2>
        {loading ? (
          <p className="text-gray-600">Loading rooms...</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Object.entries(getRoomCategories()).map(([category, data]) => (
              <div
                key={category}
                className="bg-gray-50 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer border border-gray-200"
                onClick={() => {
                  navigate('/bookingform', { state: { category } });
                }}
              >
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold text-gray-800">{category}</h3>
                  <Home className="w-5 h-5 text-primary" />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total:</span>
                    <span className="font-medium">{data.total}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600">Available:</span>
                    <span className="font-medium text-green-600">{data.available}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-red-600">Occupied:</span>
                    <span className="font-medium text-red-600">{data.occupied}</span>
                  </div>
                </div>
                {data.available > 0 && (
                  <button 
                    className="w-full mt-3 bg-primary text-white py-2 px-4 rounded-md text-sm hover:bg-primary/90 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate('/bookingform', { state: { category } });
                    }}
                  >
                    Book Now
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>


      {/* Add this at the very end, just before the final closing </div> */}
      <BookingCalendar
        isOpen={showCalendar}
        onClose={() => setShowCalendar(false)}
      />
    </div>
  );
};

export default Dashboard;
