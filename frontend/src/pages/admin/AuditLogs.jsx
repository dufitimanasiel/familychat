import React, { useState, useEffect } from 'react';
import { Search, Calendar, User, Activity, RefreshCw } from 'lucide-react';
import axios from '../../utils/axios';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import Input from '../../components/ui/Input';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [limit, setLimit] = useState(50);

  useEffect(() => {
    fetchLogs();
  }, [limit]);

  const fetchLogs = async () => {
    try {
      const response = await axios.get(`/admin/audit-logs?limit=${limit}`);
      setLogs(response.data.data || []);
      toast.success(`Loaded ${response.data.data?.length || 0} audit logs`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch audit logs');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log =>
    log.action?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.entity_type?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getActionIcon = (action) => {
    const icons = {
      'login': User,
      'logout': User,
      'create_user': User,
      'delete_user': User,
      'update_user': User,
      'create_post': Activity,
      'delete_post': Activity,
      'send_message': Activity
    };
    return icons[action] || Activity;
  };

  const getActionColor = (action) => {
    const colors = {
      'login': 'text-green-600 bg-green-100',
      'logout': 'text-gray-600 bg-gray-100',
      'create_user': 'text-blue-600 bg-blue-100',
      'delete_user': 'text-red-600 bg-red-100',
      'update_user': 'text-yellow-600 bg-yellow-100',
      'create_post': 'text-purple-600 bg-purple-100',
      'delete_post': 'text-red-600 bg-red-100',
      'send_message': 'text-indigo-600 bg-indigo-100'
    };
    return colors[action] || 'text-gray-600 bg-gray-100';
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
            <Activity className="h-8 w-8 mr-3 text-primary-600" />
            Audit Logs
          </h1>
          <p className="text-gray-500">View system activity and user actions</p>
        </div>
        <div className="flex space-x-3">
          <select
            value={limit}
            onChange={(e) => setLimit(parseInt(e.target.value))}
            className="px-4 py-2 border rounded-lg"
          >
            <option value={25}>Last 25</option>
            <option value={50}>Last 50</option>
            <option value={100}>Last 100</option>
            <option value={500}>Last 500</option>
          </select>
          <Button variant="outline" onClick={fetchLogs}>
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
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="space-y-3">
            {filteredLogs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No audit logs found
              </div>
            ) : (
              filteredLogs.map((log) => {
                const Icon = getActionIcon(log.action);
                return (
                  <div
                    key={log.id}
                    className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <div className={`p-2 rounded-full ${getActionColor(log.action)}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium">{log.action}</span>
                          {log.entity_type && (
                            <span className="text-gray-500 ml-2">
                              on {log.entity_type}
                              {log.entity_id && ` #${log.entity_id}`}
                            </span>
                          )}
                          {log.username && (
                            <span className="text-gray-500 ml-2">
                              by {log.username}
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(log.created_at).toLocaleString()}
                        </div>
                      </div>
                      {log.details && (
                        <div className="mt-2 text-sm text-gray-600">
                          <pre className="bg-gray-100 p-2 rounded overflow-x-auto">
                            {JSON.stringify(JSON.parse(log.details), null, 2)}
                          </pre>
                        </div>
                      )}
                      {log.ip_address && (
                        <div className="mt-1 text-xs text-gray-500">
                          IP: {log.ip_address}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuditLogs;
