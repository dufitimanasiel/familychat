import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, MessageSquare, FileText, Activity, TrendingUp } from 'lucide-react';
import axios from '../../utils/axios';
import Button from '../../components/ui/Button';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get('/admin/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setStats({ totalUsers: 0, onlineUsers: 0, totalMessages: 0, totalPosts: 0 });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const statCards = [
    { name: 'Total Users', value: stats?.totalUsers || 0, icon: Users, color: 'blue' },
    { name: 'Online Users', value: stats?.onlineUsers || 0, icon: Activity, color: 'green' },
    { name: 'Total Messages', value: stats?.totalMessages || 0, icon: MessageSquare, color: 'purple' },
    { name: 'Total Posts', value: stats?.totalPosts || 0, icon: FileText, color: 'orange' },
  ];

  const activityCards = [
    { name: 'New Users Today', value: stats?.todayUsers || 0, icon: TrendingUp, color: 'blue' },
    { name: 'Messages Today', value: stats?.todayMessages || 0, icon: MessageSquare, color: 'green' },
    { name: 'Posts Today', value: stats?.todayPosts || 0, icon: FileText, color: 'orange' },
  ];

  const getColorClass = (color) => {
    const colors = {
      blue: 'bg-blue-500',
      green: 'bg-green-500',
      purple: 'bg-purple-500',
      orange: 'bg-orange-500',
    };
    return colors[color] || 'bg-gray-500';
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-gray-500">Welcome to the FaceChatFamily admin panel</p>
        </div>
        <Button onClick={() => navigate('/admin/users')}>
          <Users className="h-4 w-4 mr-2" />
          Create User
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat) => (
          <Card key={stat.name}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{stat.name}</p>
                  <p className="text-3xl font-bold mt-2">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-full ${getColorClass(stat.color)} text-white`}>
                  <stat.icon className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {activityCards.map((stat) => (
          <Card key={stat.name}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{stat.name}</p>
                  <p className="text-2xl font-bold mt-2">{stat.value}</p>
                </div>
                <div className={`p-2 rounded-full ${getColorClass(stat.color)} text-white`}>
                  <stat.icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button className="w-full justify-start" variant="outline" onClick={() => navigate('/admin/users')}>
                <Users className="h-4 w-4 mr-2" />
                Manage Users
              </Button>
              <Button className="w-full justify-start" variant="outline" onClick={() => navigate('/admin/audit-logs')}>
                <Activity className="h-4 w-4 mr-2" />
                Audit Logs
              </Button>
              <Button className="w-full justify-start" variant="outline" onClick={() => navigate('/admin/reports')}>
                <TrendingUp className="h-4 w-4 mr-2" />
                User Reports
              </Button>
              <Button className="w-full justify-start" variant="outline" onClick={() => navigate('/admin/settings')}>
                <MessageSquare className="h-4 w-4 mr-2" />
                System Settings
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Database</span>
                <span className="text-green-500 font-medium">Connected</span>
              </div>
              <div className="flex items-center justify-between">
                <span>API Server</span>
                <span className="text-green-500 font-medium">Running</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Socket.io</span>
                <span className="text-green-500 font-medium">Active</span>
              </div>
              <div className="flex items-center justify-between">
                <span>File Upload</span>
                <span className="text-green-500 font-medium">Enabled</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
