import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Camera, MapPin, Calendar, Link as LinkIcon, Edit2, MessageSquare, UserPlus } from 'lucide-react';
import axios from '../utils/axios';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';
import Button from '../components/ui/Button';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Avatar from '../components/ui/Avatar';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Textarea from '../components/ui/Textarea';
import { getMediaUrl } from '../utils/api';

const Profile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.user);
  const userId = id || currentUser?.id;
  const isOwnProfile = !id || id == currentUser?.id;
  
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const [sentRequests, setSentRequests] = useState([]);
  const [isFriend, setIsFriend] = useState(false);
  const [editData, setEditData] = useState({});
  const [editMode, setEditMode] = useState(false);
  
  // Profile picture upload states
  const [profilePictureFile, setProfilePictureFile] = useState(null);
  const [uploadingProfilePicture, setUploadingProfilePicture] = useState(false);

  useEffect(() => {
    fetchUserData();
    fetchUserPosts();
    if (!isOwnProfile) {
      fetchFriendshipStatus();
      fetchSentRequests();
    }
  }, [userId]);

  const fetchFriendshipStatus = async () => {
    try {
      const response = await axios.get('/friends');
      const friends = response.data.data || [];
      const friend = friends.find(f => f.friend_id == userId);
      setIsFriend(!!friend);
    } catch (error) {
      console.error('Error fetching friendship status:', error);
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

  const fetchUserData = async () => {
    try {
      const response = await axios.get(`/users/${userId}`);
      setUser(response.data.data);
      setEditData(response.data.data);
    } catch (error) {
      console.error('Error fetching user:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPosts = async () => {
    try {
      const response = await axios.get(`/posts?user_id=${userId}`);
      console.log('Profile posts response:', response.data);
      console.log('Profile posts data:', response.data.data);
      setPosts(response.data.data || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  };

  const handleSendRequest = async () => {
    try {
      await axios.post('/friends/request', { receiver_id: userId });
      toast.success('Friend request sent');
      fetchSentRequests();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send request');
    }
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      await axios.post(`/friends/requests/${requestId}/accept`);
      toast.success('Friend request accepted');
      fetchFriendshipStatus();
      fetchSentRequests();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to accept request');
    }
  };

  const handleDeclineRequest = async (requestId) => {
    try {
      await axios.delete(`/friends/requests/${requestId}`);
      toast.success('Friend request declined');
      fetchSentRequests();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to decline request');
    }
  };

  const handleRemoveFriend = async () => {
    try {
      await axios.delete(`/friends/${userId}`);
      toast.success('Friend removed');
      fetchFriendshipStatus();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to remove friend');
    }
  };

  const handleStartChat = async (userId, userName, userPicture) => {
    try {
      await axios.post('/chats', { user_id: userId });
      navigate('/messages');
      toast.success('Chat started');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to start chat');
    }
  };

  const handleBlockUser = async (userId) => {
    try {
      await axios.post(`/users/${userId}/block`);
      toast.success('User blocked');
      fetchUserData();
      setIsBlocked(true);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to block user');
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post?')) {
      return;
    }

    try {
      await axios.delete(`/posts/${postId}`);
      toast.success('Post deleted successfully');
      fetchUserPosts();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete post');
    }
  };

  const handleUnblockUser = async (userId) => {
    try {
      await axios.delete(`/users/${userId}/block`);
      toast.success('User unblocked');
      fetchUserData();
      setIsBlocked(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to unblock user');
    }
  };

  const handleProfilePictureUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Profile picture must be less than 10MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Profile picture must be an image');
      return;
    }

    setUploadingProfilePicture(true);
    try {
      const formData = new FormData();
      formData.append('file', file); // Use 'file' field name as expected by backend
      formData.append('uploadType', 'profile');

      const response = await axios.post('/users/upload-profile-picture', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      console.log('Profile picture upload response:', response.data);
      
      // Update local user state to show new profile picture immediately
      const newProfilePicture = response.data.data.profile_picture;
      setUser(prevUser => ({
        ...prevUser,
        profile_picture: newProfilePicture
      }));
      
      // Update auth store as well
      const authStore = useAuthStore.getState();
      authStore.updateUser({ profile_picture: newProfilePicture });
      
      toast.success('Profile picture updated successfully');
      fetchUserData(); // Refresh user data to ensure consistency
    } catch (error) {
      console.error('Profile picture upload error:', error);
      toast.error(error.response?.data?.message || 'Failed to update profile picture');
    } finally {
      setUploadingProfilePicture(false);
    }
  };

  const getRequestStatus = () => {
    const sentRequest = sentRequests.find(req => req.receiver_id == userId);
    if (sentRequest) {
      return { status: 'sent', requestId: sentRequest.id };
    }
    if (isFriend) {
      return { status: 'friends' };
    }
    return { status: 'none' };
  };

  const handleUpdateProfile = async () => {
    try {
      await axios.put('/users/profile', editData);
      setUser(editData);
      setEditMode(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-500">User not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <Card className="mb-6">
        <div className="h-48 bg-gradient-to-r from-blue-500 to-purple-600 rounded-t-lg relative">
          {isOwnProfile && (
            <Button
              variant="secondary"
              size="sm"
              className="absolute top-4 right-4"
              onClick={() => setEditMode(true)}
            >
              <Edit2 className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          )}
        </div>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-end md:space-x-6 -mt-16">
            <div className="relative">
              <Avatar
                src={user?.profile_picture}
                alt={user?.full_name}
                fallback={user?.full_name?.charAt(0)}
                size="xl"
                className="border-4 border-white dark:border-gray-800"
              />
              {isOwnProfile && (
                <>
                  <input
                    type="file"
                    ref={(input) => {
                      if (input) {
                        input.setAttribute('hidden', 'true');
                      }
                    }}
                    onChange={handleProfilePictureUpload}
                    accept="image/*"
                    disabled={uploadingProfilePicture}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="absolute bottom-0 right-0 bg-primary-600 text-white p-2 rounded-full"
                    onClick={() => document.querySelector('input[type="file"]').click()}
                    disabled={uploadingProfilePicture}
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                </>
              )}
              {isOwnProfile && (
                <>
                  <input
                    type="file"
                    ref={(input) => {
                      if (input) {
                        input.setAttribute('hidden', 'true');
                      }
                    }}
                    onChange={handleProfilePictureUpload}
                    accept="image/*"
                    disabled={uploadingProfilePicture}
                  />
                  <button 
                    className="absolute bottom-0 right-0 bg-primary-600 text-white p-2 rounded-full hover:bg-primary-700 transition-colors"
                    onClick={() => document.querySelector('input[type="file"]').click()}
                    disabled={uploadingProfilePicture}
                  >
                    {uploadingProfilePicture ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    ) : (
                      <Camera className="h-4 w-4" />
                    )}
                  </button>
                </>
              )}
            </div>
            <div className="mt-4 md:mt-0 flex-1">
              {(isOwnProfile || isFriend) && (
                <div>
                  <h1 className="text-2xl font-bold">{user?.full_name}</h1>
                  <p className="text-gray-500">@{user?.username}</p>
                  {user?.bio && <p className="mt-2">{user.bio}</p>}
                  {!isOwnProfile && isFriend && (
                    <div className="flex space-x-2 mt-3">
                      <Button variant="outline" size="sm" onClick={handleRemoveFriend}>
                        Remove Friend
                      </Button>
                    </div>
                  )}
                  {!isOwnProfile && !isFriend && (
                    <div className="flex space-x-2 mt-3">
                      {(() => {
                        const status = getRequestStatus();
                        if (status.status === 'none') {
                          return (
                            <>
                              <Button size="sm" onClick={handleSendRequest}>
                                <UserPlus className="h-4 w-4 mr-1" />
                                Add Friend
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleStartChat(user.id, user.full_name, user.profile_picture)}
                              >
                                <MessageSquare className="h-4 w-4 mr-1" />
                                Message
                              </Button>
                            </>
                          );
                        } else if (status.status === 'sent') {
                          return (
                            <Button variant="outline" size="sm" disabled>
                              Friend Request Sent
                            </Button>
                          );
                        } else if (status.status === 'received') {
                          return (
                            <>
                              <Button size="sm" onClick={() => handleAcceptRequest(status.requestId)}>
                                Accept
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => handleDeclineRequest(status.requestId)}>
                                Decline
                              </Button>
                            </>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  )}
                  {user?.location && (
                    <span className="flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      {user.location}
                    </span>
                  )}
                  {user?.website && (
                    <span className="flex items-center">
                      <LinkIcon className="h-4 w-4 mr-1" />
                      <a href={user.website} target="_blank" rel="noopener noreferrer" className="text-primary-600">
                        {user.website}
                      </a>
                    </span>
                  )}
                  <span className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    Joined {new Date(user?.created_at).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
            {!isOwnProfile && (
              <div className="mt-4 md:mt-0">
                <Button>Send Friend Request</Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Posts</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {posts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No posts yet</div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <div key={post.id} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="whitespace-pre-wrap">{post.content}</p>
                      {post.media_urls && post.media_urls.length > 0 && (
                        <div className="mt-2 space-y-2">
                          {post.media_urls.map((url, index) => {
                            const isImage = url.match(/\.(jpg|jpeg|png|gif|webp)$/i);
                            const isVideo = url.match(/\.(mp4|webm|ogg)$/i);
                            
                            if (isImage) {
                              const fullUrl = getMediaUrl(url);
                              return (
                                <div key={index} className="relative">
                                  <img
                                    src={fullUrl}
                                    alt="Post media"
                                    className="rounded-lg w-full h-auto max-h-96 object-contain"
                                    onError={(e) => {
                                      e.target.style.display = 'none';
                                      e.target.nextElementSibling.style.display = 'flex';
                                    }}
                                  />
                                  <div className="hidden items-center justify-center p-8 bg-gray-100 dark:bg-gray-800 rounded-lg">
                                    <div className="text-center">
                                      <p className="text-gray-500 dark:text-gray-400">Image failed to load</p>
                                      <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">{fullUrl}</p>
                                    </div>
                                  </div>
                                </div>
                              );
                            } else if (isVideo) {
                              const fullUrl = getMediaUrl(url);
                              return (
                                <video
                                  key={index}
                                  src={fullUrl}
                                  controls
                                  className="rounded-lg w-full h-auto max-h-96 object-contain"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextElementSibling.style.display = 'flex';
                                  }}
                                >
                                  Your browser does not support the video tag.
                                </video>
                              );
                            }
                            return null;
                          })}
                        </div>
                      )}
                      <p className="text-sm text-gray-500 mt-2">
                        {new Date(post.created_at).toLocaleString()}
                      </p>
                    </div>
                    {isOwnProfile && (
                      <button
                        onClick={() => handleDeletePost(post.id)}
                        className="ml-4 text-red-500 hover:text-red-700 text-sm"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Modal isOpen={editMode} onClose={() => setEditMode(false)} title="Edit Profile">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Full Name</label>
            <Input
              value={editData.full_name || ''}
              onChange={(e) => setEditData({ ...editData, full_name: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Bio</label>
            <Textarea
              value={editData.bio || ''}
              onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
              rows={3}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Location</label>
            <Input
              value={editData.location || ''}
              onChange={(e) => setEditData({ ...editData, location: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Website</label>
            <Input
              value={editData.website || ''}
              onChange={(e) => setEditData({ ...editData, website: e.target.value })}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setEditMode(false)}>Cancel</Button>
            <Button onClick={handleUpdateProfile}>Save</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Profile;
