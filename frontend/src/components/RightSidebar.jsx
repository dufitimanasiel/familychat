import React, { useState, useEffect } from 'react';
import { Users, Search, UserPlus, Circle } from 'lucide-react';
import axios from '../utils/axios';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';
import Button from './ui/Button';
import Card, { CardHeader, CardTitle, CardContent } from './ui/Card';
import Avatar from './ui/Avatar';
import Input from './ui/Input';

const RightSidebar = () => {
  const user = useAuthStore((state) => state.user);
  const [activeUsers, setActiveUsers] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [sentRequests, setSentRequests] = useState([]);

  useEffect(() => {
    fetchActiveUsers();
    fetchSuggestions();
    fetchSentRequests();
  }, []);

  const fetchActiveUsers = async () => {
    try {
      const response = await axios.get('/users/online');
      setActiveUsers(response.data.data || []);
    } catch (error) {
      console.error('Error fetching active users:', error);
    }
  };

  const fetchSuggestions = async () => {
    try {
      const response = await axios.get('/users/suggested');
      setSuggestions(response.data.data || []);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSentRequests = async () => {
    try {
      const response = await axios.get('/friends/requests?type=sent');
      setSentRequests(response.data.data || []);
    } catch (error) {
      console.error('Error fetching sent requests:', error);
    }
  };

  const handleSendRequest = async (userId) => {
    try {
      await axios.post('/friends/request', { receiver_id: userId });
      toast.success('Friend request sent');
      fetchSentRequests();
      fetchSuggestions();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send request');
    }
  };

  const getRequestStatus = (userId) => {
    const sentRequest = sentRequests.find(req => req.receiver_id === userId);
    return sentRequest ? 'sent' : 'none';
  };

  const filteredActiveUsers = activeUsers.filter(user =>
    user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSuggestions = suggestions.filter(user =>
    user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="hidden xl:block w-80 p-4">
      <div className="space-y-4">
        {/* Active Users */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <Circle className="h-4 w-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search active users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-8 text-sm"
              />
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {filteredActiveUsers.length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-4">No active users</p>
              ) : (
                filteredActiveUsers.map((activeUser) => (
                  <div key={activeUser.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer">
                    <div className="relative">
                      <Avatar
                        src={activeUser.profile_picture}
                        alt={activeUser.full_name}
                        fallback={activeUser.full_name?.charAt(0)}
                        size="sm"
                      />
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-900"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{activeUser.full_name}</p>
                      <p className="text-xs text-gray-500">@{activeUser.username}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Friend Suggestions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">People You May Know</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {filteredSuggestions.length === 0 ? (
                  <p className="text-xs text-gray-500 text-center py-4">No suggestions</p>
                ) : (
                  filteredSuggestions.slice(0, 5).map((suggestion) => {
                    const status = getRequestStatus(suggestion.id);
                    return (
                      <div key={suggestion.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <Avatar
                          src={suggestion.profile_picture}
                          alt={suggestion.full_name}
                          fallback={suggestion.full_name?.charAt(0)}
                          size="sm"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{suggestion.full_name}</p>
                          <p className="text-xs text-gray-500">@{suggestion.username}</p>
                        </div>
                        <Button
                          size="sm"
                          variant={status === 'sent' ? 'outline' : 'primary'}
                          disabled={status === 'sent'}
                          onClick={() => handleSendRequest(suggestion.id)}
                          className="h-7 px-2 text-xs"
                        >
                          {status === 'sent' ? 'Sent' : <UserPlus className="h-3 w-3" />}
                        </Button>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Quick Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600 dark:text-gray-400">Online Now</span>
              <span className="text-sm font-medium">{activeUsers.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600 dark:text-gray-400">Suggestions</span>
              <span className="text-sm font-medium">{suggestions.length}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RightSidebar;
