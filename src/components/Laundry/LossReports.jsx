import React, { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import ConfirmationDialog from '../common/ConfirmationDialog';

const LossReports = () => {
  const [lossReports, setLossReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);

  useEffect(() => {
    fetchLossReports();
  }, []);

  const fetchLossReports = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/laundry/loss-report`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      console.log('Loss reports response:', data);
      setLossReports(Array.isArray(data) ? data : (data.reports || data.data || data.lossReports || []));
    } catch (error) {
      console.error('Error fetching loss reports:', error);
      toast.error('Failed to fetch loss reports');
      setLossReports([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = (reportId, newStatus) => {
    setConfirmAction(() => () => performStatusUpdate(reportId, newStatus));
    setShowConfirmDialog(true);
  };

  const performStatusUpdate = async (reportId, newStatus) => {
    setShowConfirmDialog(false);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/laundry/loss-report/${reportId}/status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ status: newStatus })
        }
      );
      if (response.ok) {
        toast.success('Status updated successfully');
        fetchLossReports();
      }
    } catch (error) {
      toast.error('Failed to update status');
    } finally {
      setConfirmAction(null);
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      reported: 'bg-red-100 text-red-800',
      investigating: 'bg-yellow-100 text-yellow-800',
      resolved: 'bg-green-100 text-green-800',
      compensated: 'bg-blue-100 text-blue-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="p-3 sm:p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-4 sm:mb-6">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2 sm:gap-3">
            <AlertTriangle style={{color: 'hsl(45, 43%, 58%)'}} size={24} />
            Loss Reports
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Track and manage laundry loss reports</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : lossReports.length === 0 ? (
        <div className="bg-white rounded-lg shadow text-center py-12 text-gray-500">
          <AlertTriangle className="mx-auto mb-3" size={48} />
          <p className="text-sm sm:text-base">No loss reports found</p>
        </div>
      ) : (
        <>
          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {lossReports.map((report) => (
              <div key={report._id} className="bg-white rounded-lg shadow p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">Room {report.roomNumber}</h3>
                    <p className="text-sm text-gray-600">{report.guestName || 'N/A'}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs ${getStatusBadge(report.status)}`}>
                    {report.status}
                  </span>
                </div>
                <div className="text-sm mb-3 space-y-2">
                  <div><span className="text-gray-500">Items Lost:</span> 
                    <div className="font-medium text-xs mt-1">
                      {report.lostItems?.map((item, idx) => (
                        <span key={idx} className="inline-block bg-gray-100 px-2 py-1 rounded mr-1 mb-1">
                          {item.quantity}x {item.itemName}
                        </span>
                      )) || 'No items'}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><span className="text-gray-500">Amount:</span> <span className="font-medium">₹{report.totalLossAmount}</span></div>
                    <div><span className="text-gray-500">Reported:</span> <span className="font-medium">{new Date(report.createdAt).toLocaleDateString()}</span></div>
                  </div>
                </div>
                <select
                  value={report.status}
                  onChange={(e) => handleStatusUpdate(report._id, e.target.value)}
                  className="w-full text-sm border rounded px-3 py-2"
                >
                  <option value="reported">Reported</option>
                  <option value="investigating">Investigating</option>
                  <option value="resolved">Resolved</option>
                  <option value="compensated">Compensated</option>
                </select>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block bg-white rounded-lg shadow overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Room</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Guest</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lost Items</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Loss Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reported</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {lossReports.map((report) => (
                  <tr key={report._id}>
                    <td className="px-6 py-4 whitespace-nowrap font-medium">{report.roomNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{report.guestName || 'N/A'}</td>
                    <td className="px-6 py-4">
                      <div className="max-w-xs">
                        {report.lostItems?.map((item, idx) => (
                          <span key={idx} className="inline-block bg-gray-100 text-xs px-2 py-1 rounded mr-1 mb-1">
                            {item.quantity}x {item.itemName}
                          </span>
                        )) || 'No items'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">₹{report.totalLossAmount}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded text-xs ${getStatusBadge(report.status)}`}>
                        {report.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {new Date(report.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={report.status}
                        onChange={(e) => handleStatusUpdate(report._id, e.target.value)}
                        className="text-sm border rounded px-2 py-1"
                      >
                        <option value="reported">Reported</option>
                        <option value="investigating">Investigating</option>
                        <option value="resolved">Resolved</option>
                        <option value="compensated">Compensated</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <ConfirmationDialog
        isOpen={showConfirmDialog}
        onClose={() => { setShowConfirmDialog(false); setConfirmAction(null); }}
        onConfirm={confirmAction}
        title="Confirm Status Update"
        message="Are you sure you want to update the status of this loss report?"
        confirmText="Update"
        cancelText="Cancel"
        type="info"
      />
    </div>
  );
};

export default LossReports;
