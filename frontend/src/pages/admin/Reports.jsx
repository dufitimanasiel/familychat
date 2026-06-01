import React, { useState, useEffect } from 'react';
import { Search, AlertTriangle, CheckCircle, Clock, RefreshCw, Filter } from 'lucide-react';
import axios from '../../utils/axios';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import Input from '../../components/ui/Input';

const Reports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchReports();
  }, [statusFilter]);

  const fetchReports = async () => {
    try {
      const params = statusFilter !== 'all' ? { status: statusFilter } : {};
      const response = await axios.get('/admin/reports', { params });
      setReports(response.data.data || []);
      toast.success(`Loaded ${response.data.data?.length || 0} reports`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch reports');
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateReport = async (reportId, status) => {
    try {
      await axios.put(`/admin/reports/${reportId}`, { status });
      toast.success(`Report marked as ${status}`);
      fetchReports();
    } catch (error) {
      toast.error('Failed to update report');
    }
  };

  const filteredReports = reports.filter(report =>
    (report.reason?.toLowerCase().includes(searchQuery.toLowerCase()) ||
     report.reporter_username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
     report.reported_username?.toLowerCase().includes(searchQuery.toLowerCase())) &&
    (statusFilter === 'all' || report.status === statusFilter)
  );

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'resolved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'dismissed':
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'dismissed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center">
            <AlertTriangle className="h-8 w-8 mr-3 text-primary-600" />
            User Reports
          </h1>
          <p className="text-gray-500">Manage user reports and moderation</p>
        </div>
        <div className="flex space-x-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="resolved">Resolved</option>
            <option value="dismissed">Dismissed</option>
          </select>
          <Button variant="outline" onClick={fetchReports}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search reports..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="space-y-4">
            {filteredReports.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No reports found
              </div>
            ) : (
              filteredReports.map((report) => (
                <div
                  key={report.id}
                  className="border rounded-lg p-4 hover:bg-gray-50"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                          {getStatusIcon(report.status)}
                          <span className="ml-1">{report.status}</span>
                        </span>
                        <span className="text-sm text-gray-500">
                          Report #{report.id}
                        </span>
                        <span className="text-sm text-gray-500">
                          {new Date(report.created_at).toLocaleString()}
                        </span>
                      </div>
                      
                      <div className="mb-3">
                        <p className="font-medium text-red-600 mb-1">
                          {report.reason}
                        </p>
                        <p className="text-gray-600">
                          {report.description}
                        </p>
                      </div>

                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div>
                          <span className="font-medium">Reporter:</span>{' '}
                          {report.reporter_username || 'Anonymous'}
                        </div>
                        <div>
                          <span className="font-medium">Reported:</span>{' '}
                          {report.reported_username || 'Unknown'}
                        </div>
                        {report.entity_type && (
                          <div>
                            <span className="font-medium">Type:</span>{' '}
                            {report.entity_type}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      {report.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateReport(report.id, 'resolved')}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Resolve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateReport(report.id, 'dismissed')}
                          >
                            <AlertTriangle className="h-4 w-4 mr-1" />
                            Dismiss
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;
