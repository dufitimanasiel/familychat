import React, { useState, useEffect } from 'react';
import { Search, UserPlus, MessageSquare } from 'lucide-react';
import axios from '../utils/axios';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Avatar from '../components/ui/Avatar';
import ChatModal from '../components/ChatModal';

const SearchUsers = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sentRequests, setSentRequests] = useState([]);
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    fetchSentRequests();
  }, []);

  const fetchSentRequests = async () => {
    try {
      const response = await axios.get('/friends/requests?type=sent');
      setSentRequests(response.data.data || []);
    } catch (error) {
      console.error('Error fetching sent requests:', error);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const response = await axios.get(`/users/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchResults(response.data.data || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Search failed');
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async (userId) => {
    try {
      await axios.post('/friends/request', { receiver_id: userId });
      toast.success('Friend request sent');
      fetchSentRequests();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send request');
    }
  };

  const handleStartChat = async (userId, userName, userPicture) => {
    try {
      // Create a chat even if not friends
      await axios.post('/chats', { user_id: userId });
      setSelectedUser({ id: userId, name: userName, picture: userPicture });
      setChatModalOpen(true);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to start chat');
    }
  };

  const getRequestStatus = (userId) => {
    const sentRequest = sentRequests.find(req => req.receiver_id === userId);
    if (sentRequest) {
      return { status: 'sent', requestId: sentRequest.id };
    }
    return { status: 'none' };
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Search Users</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Search by username or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </form>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : (
            <div className="space-y-3">
              {searchResults.length === 0 && searchQuery && (
                <div className="text-center py-8 text-gray-500">
                  No users found
                </div>
              )}
              {searchResults.map((result) => {
                if (result.id === user.id) return null;
                const status = getRequestStatus(result.id);
                return (
                  <div key={result.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div 
                      className="flex items-center space-x-3 flex-1 cursor-pointer"
                      onClick={() => handleStartChat(result.id, result.full_name, result.profile_picture)}
                    >
                      <Avatar
                        src={result.profile_picture}
                        alt={result.full_name}
                        fallback={result.full_name?.charAt(0)}
                        size="lg"
                      />
                      <div>
                        <p className="font-semibold">{result.full_name}</p>
                        <p className="text-sm text-gray-500">@{result.username}</p>
                        {result.bio && (
                          <p className="text-sm text-gray-600 mt-1">{result.bio}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      {status.status === 'none' && (
                        <>
                          <Button size="sm" onClick={() => handleSendRequest(result.id)}>
                            <UserPlus className="h-4 w-4 mr-1" />
                            Add Friend
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleStartChat(result.id, result.full_name, result.profile_picture)}>
                            <MessageSquare className="h-4 w-4 mr-1" />
                            Message
                          </Button>
                        </>
                      )}
                      {status.status === 'sent' && (
                        <Button variant="outline" size="sm" onClick={() => handleStartChat(result.id, result.full_name, result.profile_picture)}>
                          <MessageSquare className="h-4 w-4 mr-1" />
                          Message
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
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

export default SearchUsers;
