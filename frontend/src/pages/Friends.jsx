import React, { useState, useEffect } from 'react';
import { UserPlus, Search, UserCheck, X, Check } from 'lucide-react';
import axios from '../utils/axios';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Avatar from '../components/ui/Avatar';
import ChatModal from '../components/ChatModal';

const Friends = () => {
  const user = useAuthStore((state) => state.user);
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [activeTab, setActiveTab] = useState('friends');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'friends') {
        const response = await axios.get('/friends');
        setFriends(response.data.data || []);
      } else if (activeTab === 'requests') {
        const response = await axios.get('/friends/requests?type=received');
        setRequests(response.data.data || []);
      } else if (activeTab === 'suggestions') {
        const [suggestionsResponse, sentResponse] = await Promise.all([
          axios.get('/users/suggested'),
          axios.get('/friends/requests?type=sent')
        ]);
        setSuggestions(suggestionsResponse.data.data || []);
        setSentRequests(sentResponse.data.data || []);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async (userId) => {
    try {
      await axios.post('/friends/request', { receiver_id: userId });
      toast.success('Friend request sent');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send request');
    }
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      await axios.put(`/friends/requests/${requestId}/accept`);
      toast.success('Friend request accepted');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to accept request');
    }
  };

  const handleDeclineRequest = async (requestId) => {
    try {
      await axios.put(`/friends/requests/${requestId}/decline`);
      toast.success('Friend request declined');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to decline request');
    }
  };

  const handleCancelRequest = async (requestId) => {
    try {
      await axios.delete(`/friends/requests/${requestId}`);
      toast.success('Friend request cancelled');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to cancel request');
    }
  };

  const handleRemoveFriend = async (friendId) => {
    if (!confirm('Are you sure you want to remove this friend?')) return;
    try {
      await axios.delete(`/friends/${friendId}`);
      toast.success('Friend removed');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to remove friend');
    }
  };

  const getRequestStatus = (userId) => {
    const sentRequest = sentRequests.find(req => req.receiver_id === userId);
    if (sentRequest) {
      return { status: 'sent', requestId: sentRequest.id };
    }
    const friend = friends.find(f => f.friend_id === userId);
    if (friend) {
      return { status: 'friends', friendId: friend.id };
    }
    return { status: 'none' };
  };

  const handleStartChat = async (userId, userName, userPicture) => {
    try {
      await axios.post('/chats', { user_id: userId });
      setSelectedUser({ id: userId, name: userName, picture: userPicture });
      setChatModalOpen(true);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to start chat');
    }
  };

  const tabs = [
    { id: 'friends', label: 'Friends', count: friends.length },
    { id: 'requests', label: 'Requests', count: requests.length },
    { id: 'suggestions', label: 'Suggestions', count: suggestions.length },
  ];

  return (
    <div className="max-w-4xl mx-auto p-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Friends</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search friends..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4 border-b border-gray-200 dark:border-gray-700 mb-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-3 px-1 border-b-2 font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className="ml-2 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full text-xs">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : (
            <div className="space-y-3">
              {activeTab === 'friends' && friends.map((friend) => (
                <div 
                  key={friend.id} 
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => handleStartChat(friend.friend_id, friend.friend_name, friend.friend_picture)}
                >
                  <div className="flex items-center space-x-3">
                    <Avatar
                      src={friend.friend_picture}
                      alt={friend.friend_name}
                      fallback={friend.friend_name?.charAt(0)}
                    />
                    <div>
                      <p className="font-medium">{friend.friend_name}</p>
                      <p className="text-sm text-gray-500">@{friend.friend_username}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handleStartChat(friend.friend_id, friend.friend_name, friend.friend_picture); }}>
                    Message
                  </Button>
                </div>
              ))}

              {activeTab === 'requests' && requests.map((request) => (
                <div key={request.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Avatar
                      src={request.profile_picture}
                      alt={request.full_name}
                      fallback={request.full_name?.charAt(0)}
                    />
                    <div>
                      <p className="font-medium">{request.full_name}</p>
                      <p className="text-sm text-gray-500">@{request.username}</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button size="sm" onClick={() => handleAcceptRequest(request.id)}>Accept</Button>
                    <Button variant="outline" size="sm" onClick={() => handleDeclineRequest(request.id)}>Decline</Button>
                  </div>
                </div>
              ))}

              {activeTab === 'suggestions' && suggestions.map((suggestion) => {
                const status = getRequestStatus(suggestion.id);
                return (
                  <div key={suggestion.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Avatar
                        src={suggestion.profile_picture}
                        alt={suggestion.full_name}
                        fallback={suggestion.full_name?.charAt(0)}
                      />
                      <div>
                        <p className="font-medium">{suggestion.full_name}</p>
                        <p className="text-sm text-gray-500">@{suggestion.username}</p>
                      </div>
                    </div>
                    {status.status === 'none' && (
                      <Button size="sm" onClick={() => handleSendRequest(suggestion.id)}>
                        <UserPlus className="h-4 w-4 mr-1" />
                        Add Friend
                      </Button>
                    )}
                    {status.status === 'sent' && (
                      <Button variant="outline" size="sm" onClick={() => handleCancelRequest(status.requestId)}>
                        <X className="h-4 w-4 mr-1" />
                        Cancel Request
                      </Button>
                    )}
                    {status.status === 'friends' && (
                      <Button variant="outline" size="sm">
                        <UserCheck className="h-4 w-4 mr-1" />
                        Friends
                      </Button>
                    )}
                  </div>
                );
              })}

              {!loading && (
                activeTab === 'friends' && friends.length === 0 ||
                activeTab === 'requests' && requests.length === 0 ||
                activeTab === 'suggestions' && suggestions.length === 0
              ) && (
                <div className="text-center py-8 text-gray-500">
                  No {activeTab} found
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedUser && (
        <ChatModal
          isOpen={chatModalOpen}
          onClose={() => setChatModalOpen(false)}
          userId={selectedUser.id}
          userName={selectedUser.name}
          userPicture={selectedUser.picture}
        />
      )}
    </div>
  );
};

export default Friends;
