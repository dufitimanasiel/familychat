import React, { useState, useEffect, useRef } from 'react';
import { Heart, MessageCircle, Share2, X, ImageIcon, Share, Edit2, Trash2 } from 'lucide-react';
import axios from '../utils/axios';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';
import Button from '../components/ui/Button';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Avatar from '../components/ui/Avatar';
import Modal from '../components/ui/Modal';
import Textarea from '../components/ui/Textarea';
import RightSidebar from '../components/RightSidebar';
import { getMediaUrl } from '../utils/api';

const Feed = () => {
  const user = useAuthStore((state) => state.user);
  const [posts, setPosts] = useState([]);
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newPostContent, setNewPostContent] = useState('');
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [creatingPost, setCreatingPost] = useState(false);
  const [mediaFile, setMediaFile] = useState(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [postToShare, setPostToShare] = useState(null);
  const [shareContent, setShareContent] = useState('');
  
  // Story states
  const [showCreateStory, setShowCreateStory] = useState(false);
  const [storyFile, setStoryFile] = useState(null);
  const [storyCaption, setStoryCaption] = useState('');
  const [creatingStory, setCreatingStory] = useState(false);
  const [uploadingStory, setUploadingStory] = useState(false);
  const [viewingStory, setViewingStory] = useState(null);
  const [showStoryViewer, setShowStoryViewer] = useState(false);
  const postFileInputRef = useRef(null);
  const storyFileInputRef = useRef(null);

  useEffect(() => {
    if (user) {
      fetchPosts();
      fetchStories();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchPosts = async () => {
    try {
      console.log('Fetching posts...');
      const response = await axios.get('/posts');
      console.log('Posts response:', response.data);
      setPosts(response.data.data || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
      if (error.response?.status === 401) {
        // User is not authenticated, redirect to login
        toast.error('Please login to view posts');
        return;
      }
      toast.error(error.response?.data?.message || 'Failed to fetch posts');
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStories = async () => {
    try {
      console.log('Fetching stories...');
      const response = await axios.get('/stories');
      console.log('Stories response:', response.data);
      setStories(response.data.data || []);
    } catch (error) {
      console.error('Error fetching stories:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch stories');
    }
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim() && !mediaFile) {
      toast.error('Please enter some content or add media');
      return;
    }

    setCreatingPost(true);
    try {
      const formData = new FormData();
      formData.append('content', newPostContent);
      formData.append('privacy', 'public');
      formData.append('uploadType', 'post');
      
      if (mediaFile) {
        formData.append('files', mediaFile);
      }
      
      console.log('Creating post with mediaFile:', mediaFile);
      console.log('FormData entries:');
      for (let pair of formData.entries()) {
        console.log(pair[0], pair[1]);
      }
      
      setUploadingMedia(true);
      const response = await axios.post('/posts', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setUploadingMedia(false);
      
      console.log('Post creation response:', response.data);
      
      setNewPostContent('');
      setMediaFile(null);
      setShowCreatePost(false);
      toast.success('Post created successfully');
      if (response?.data?.data) {
        setPosts((prev) => [response.data.data, ...prev]);
      } else {
        fetchPosts();
      }
    } catch (error) {
      console.error('Post creation error:', error);
      toast.error(error.response?.data?.message || 'Failed to create post');
      setUploadingMedia(false);
    } finally {
      setCreatingPost(false);
    }
  };

  const handleMediaSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      toast.error('File size must be less than 50MB');
      return;
    }

    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      toast.error('Only image and video files are allowed');
      return;
    }

    setMediaFile(file);
  };

  const handleSharePost = (post) => {
    setPostToShare(post);
    setShareContent('');
    setShareModalOpen(true);
  };

  const handleShareSubmit = async () => {
    try {
      const formData = new FormData();
      formData.append('content', shareContent);
      formData.append('original_post_id', postToShare.id);
      formData.append('privacy', 'public');

      const response = await axios.post('/posts', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setShareModalOpen(false);
      setPostToShare(null);
      setShareContent('');
      toast.success('Post shared successfully');
      fetchPosts();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to share post');
    }
  };

  const handleCreateStory = async () => {
    if (!storyFile) {
      toast.error('Please select a photo for your story');
      return;
    }

    setCreatingStory(true);
    try {
      const formData = new FormData();
      formData.append('caption', storyCaption);
      formData.append('uploadType', 'story');
      formData.append('file', storyFile);
      
      setUploadingStory(true);
      const response = await axios.post('/stories', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setUploadingStory(false);
      
      setStoryFile(null);
      setStoryCaption('');
      setShowCreateStory(false);
      toast.success('Story created successfully');
      if (response?.data?.data) {
        setStories((prev) => [response.data.data, ...prev]);
      } else {
        fetchStories();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create story');
      setUploadingStory(false);
    } finally {
      setCreatingStory(false);
    }
  };

  const handleStoryFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type.startsWith('image/')) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Image size must be less than 10MB');
        return;
      }
    } else if (file.type.startsWith('video/')) {
      if (file.size > 50 * 1024 * 1024) {
        toast.error('Video size must be less than 50MB');
        return;
      }
      
      // Check video duration (1 minute 30 seconds = 90 seconds)
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = function() {
        if (video.duration > 90) {
          toast.error('Video duration must be less than 1 minute 30 seconds');
          return;
        }
        setStoryFile(file);
      };
      video.src = URL.createObjectURL(file);
      return;
    } else {
      toast.error('Only image and video files are allowed for stories');
      return;
    }

    setStoryFile(file);
  };

  const handleViewStory = (story) => {
    setViewingStory(story);
    setShowStoryViewer(true);
  };

  const handleDeleteStory = async (storyId) => {
    if (!window.confirm('Are you sure you want to delete this story?')) {
      return;
    }

    try {
      await axios.delete(`/stories/${storyId}`);
      toast.success('Story deleted successfully');
      setStories((prev) => prev.filter((story) => story.id !== storyId));
      if (viewingStory?.id === storyId) {
        setShowStoryViewer(false);
        setViewingStory(null);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete story');
    }
  };

  const handleLike = async (postId) => {
    try {
      await axios.post(`/posts/${postId}/like`);
      setPosts(posts.map(post => 
        post.id === postId 
          ? { ...post, user_liked: !post.user_liked, like_count: post.user_liked ? post.like_count - 1 : post.like_count + 1 }
          : post
      ));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to like post');
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post?')) {
      return;
    }

    try {
      await axios.delete(`/posts/${postId}`);
      toast.success('Post deleted successfully');
      fetchPosts();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete post');
    }
  };

  const getFullMediaUrl = (url) => {
    return getMediaUrl(url);
  };

  return (
    <div className="flex gap-4">
      <div className="flex-1 max-w-4xl mx-auto p-4">
        <div className="space-y-6">
          {/* Create Post Entry */}
          <Card>
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center gap-3">
                <Avatar
                  src={user?.profile_picture}
                  alt={user?.full_name}
                  fallback={user?.full_name?.charAt(0)}
                  size="lg"
                />
                <Button
                  variant="outline"
                  className="flex-1 justify-start text-gray-500 rounded-full h-12 px-5"
                  onClick={() => setShowCreatePost(true)}
                >
                  <Edit2 className="h-5 w-5 mr-2 text-primary-600" />
                  Create Post
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Stories */}
          <Card>
            <CardContent className="p-4">
              <div className="mb-3">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Stories</h3>
                <p className="text-sm text-gray-500">Share a moment that lasts 24 hours</p>
              </div>
              <div className="flex items-start space-x-4 overflow-x-auto pb-1">
                {/* Create Story */}
                <div className="flex-shrink-0">
                  <button
                    onClick={() => setShowCreateStory(true)}
                    className="relative group w-20"
                  >
                    <div className="w-20 h-32 bg-gradient-to-br from-blue-600 to-indigo-500 rounded-2xl flex items-end justify-center shadow-md overflow-hidden">
                      <div className="w-full h-10 bg-white/95 dark:bg-gray-900/95 flex items-center justify-center">
                        <span className="h-8 w-8 rounded-full bg-primary-600 text-white text-lg inline-flex items-center justify-center border-2 border-white dark:border-gray-900">+</span>
                      </div>
                    </div>
                    <p className="text-xs text-center mt-2 text-gray-600 dark:text-gray-300 truncate">Create Story</p>
                  </button>
                </div>
                
                {/* Display Stories */}
                {stories.map((story) => (
                  <div key={story.id} className="flex-shrink-0 relative">
                    <button
                      onClick={() => handleViewStory(story)}
                      className="relative group w-20"
                    >
                      <div className="w-20 h-32 bg-gradient-to-b from-black/40 via-transparent to-black/75 rounded-2xl overflow-hidden shadow-md relative">
                        {story.media_type === 'video' && (
                          <div className="absolute top-2 right-2 z-10 rounded-full bg-black/50 px-1.5 py-0.5 text-[10px] text-white">
                            VIDEO
                          </div>
                        )}
                        {story.media_type === 'video' ? (
                          <video
                            src={getFullMediaUrl(story.media_url)}
                            className="w-full h-full object-cover"
                            muted
                            playsInline
                          />
                        ) : (
                          <img
                            src={getFullMediaUrl(story.media_url)}
                            alt={story.full_name}
                            className="w-full h-full object-cover"
                          />
                        )}
                        <div className="absolute inset-x-0 bottom-0 p-2">
                          <p className="text-[11px] text-white font-medium truncate">{story.full_name}</p>
                        </div>
                      </div>
                    </button>
                    {story.user_id === user?.id && (
                      <button
                        onClick={() => handleDeleteStory(story.id)}
                        className="absolute top-2 left-2 bg-black/60 text-white rounded-full p-1 hover:bg-black/80 transition-colors"
                        title="Delete story"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))}
                
                {stories.length === 0 && (
                  <div className="text-gray-500 text-sm">
                    No stories yet. Be the first to share!
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Posts */}
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
          ) : (
            posts.map((post) => (
              <Card key={post.id}>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <Avatar
                      src={post.profile_picture}
                      alt={post.full_name}
                      fallback={post.full_name?.charAt(0)}
                      size="md"
                    />
                    <div>
                      <p className="font-semibold">{post.full_name}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(post.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {post.content && (
                    <p className="mb-4 whitespace-pre-wrap">{post.content}</p>
                  )}
                  {post.media_urls && post.media_urls.length > 0 && (
                    <div className="mb-4 grid grid-cols-1 gap-2">
                      {post.media_urls.map((url, index) => {
                        const isImage = url.match(/\.(jpg|jpeg|png|gif|webp)$/i);
                        const isVideo = url.match(/\.(mp4|webm|ogg)$/i);
                        const fullUrl = getFullMediaUrl(url);
                        
                        if (isImage) {
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
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => handleLike(post.id)}
                        className={`flex items-center space-x-2 ${post.user_liked ? 'text-red-500' : 'text-gray-500'}`}
                      >
                        <Heart className={`h-5 w-5 ${post.user_liked ? 'fill-current' : ''}`} />
                        <span>{post.like_count}</span>
                      </button>
                      <button className="flex items-center space-x-2 text-gray-500">
                        <MessageCircle className="h-5 w-5" />
                        <span>{post.comment_count}</span>
                      </button>
                      <button 
                        onClick={() => handleSharePost(post)}
                        className="flex items-center space-x-2 text-gray-500"
                      >
                        <Share2 className="h-5 w-5" />
                        <span>{post.share_count}</span>
                      </button>
                    </div>
                    {post.user_id === user?.id && (
                      <button
                        onClick={() => handleDeletePost(post.id)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Create Post Modal */}
        <Modal isOpen={showCreatePost} onClose={() => setShowCreatePost(false)} title="Create Post">
          <form onSubmit={(e) => { e.preventDefault(); handleCreatePost(); }} className="space-y-4">
            <Textarea
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              placeholder="What's on your mind?"
              rows={4}
            />
            <div className="flex items-center space-x-2">
              <input
                type="file"
                ref={postFileInputRef}
                hidden
                onChange={handleMediaSelect}
                accept="image/*,video/*"
                disabled={uploadingMedia || creatingPost}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => postFileInputRef.current?.click()}
                disabled={uploadingMedia || creatingPost}
              >
                <ImageIcon className="h-4 w-4 mr-2" />
                {uploadingMedia ? 'Uploading...' : 'Add Media'}
              </Button>
              {mediaFile && (
                <span className="text-sm text-gray-500 truncate max-w-xs">
                  {mediaFile.name}
                </span>
              )}
            </div>
            {mediaFile && mediaFile.type.startsWith('image/') && (
              <div className="relative">
                <img
                  src={URL.createObjectURL(mediaFile)}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-lg"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 bg-white dark:bg-gray-800"
                  onClick={() => setMediaFile(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            {mediaFile && mediaFile.type.startsWith('video/') && (
              <div className="relative">
                <video
                  src={URL.createObjectURL(mediaFile)}
                  controls
                  className="w-full h-48 object-cover rounded-lg"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 bg-white dark:bg-gray-800"
                  onClick={() => setMediaFile(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            {mediaFile && (
              <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <p>File: {mediaFile.name}</p>
                    <p>Size: {(mediaFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    <p>Type: {mediaFile.type}</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setMediaFile(null)}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            )}
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setShowCreatePost(false)} disabled={creatingPost || uploadingMedia}>
                Cancel
              </Button>
              <Button type="submit" disabled={creatingPost || uploadingMedia}>
                {creatingPost ? 'Creating...' : 'Post'}
              </Button>
            </div>
        </form>
      </Modal>

      <Modal isOpen={shareModalOpen} onClose={() => setShareModalOpen(false)} title="Share Post">
        <form onSubmit={(e) => { e.preventDefault(); handleShareSubmit(); }} className="space-y-4">
          {postToShare && (
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Avatar
                  src={postToShare.profile_picture}
                  alt={postToShare.full_name}
                  fallback={postToShare.full_name?.charAt(0)}
                  size="sm"
                />
                <div>
                  <p className="font-medium text-sm">{postToShare.full_name}</p>
                  <p className="text-xs text-gray-500">{new Date(postToShare.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              <p className="text-sm">{postToShare.content}</p>
            </div>
          )}
          <Textarea
            value={shareContent}
            onChange={(e) => setShareContent(e.target.value)}
            placeholder="Add your thoughts..."
            rows={3}
          />
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setShareModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              <Share className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        </form>
      </Modal>

      {/* Create Story Modal */}
      <Modal isOpen={showCreateStory} onClose={() => setShowCreateStory(false)} title="Create Story">
        <form onSubmit={(e) => { e.preventDefault(); handleCreateStory(); }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Select Photo or Video</label>
            <input
              type="file"
              ref={storyFileInputRef}
              hidden
              onChange={handleStoryFileSelect}
              accept="image/*,video/*"
              disabled={uploadingStory || creatingStory}
            />
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => storyFileInputRef.current?.click()}
              disabled={uploadingStory || creatingStory}
            >
              <ImageIcon className="h-4 w-4 mr-2" />
              {uploadingStory ? 'Uploading...' : 'Choose Photo/Video'}
            </Button>
          </div>
          
          {storyFile && (
            <div className="relative">
              {storyFile.type.startsWith('image/') ? (
                <img
                  src={URL.createObjectURL(storyFile)}
                  alt="Story preview"
                  className="w-full h-64 object-cover rounded-lg"
                />
              ) : (
                <video
                  src={URL.createObjectURL(storyFile)}
                  controls
                  className="w-full h-64 object-cover rounded-lg"
                />
              )}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 bg-white dark:bg-gray-800"
                onClick={() => setStoryFile(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium mb-2">Caption (Optional)</label>
            <Textarea
              value={storyCaption}
              onChange={(e) => setStoryCaption(e.target.value)}
              placeholder="Add a caption to your story..."
              rows={3}
              maxLength={200}
            />
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowCreateStory(false)}
              disabled={creatingStory}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={creatingStory || uploadingStory || !storyFile}
            >
              {creatingStory ? 'Creating...' : 'Create Story'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Story Viewer Modal */}
      <Modal isOpen={showStoryViewer} onClose={() => setShowStoryViewer(false)} title="">
        {viewingStory && (
          <div className="space-y-4">
            <div className="flex items-center space-x-3 mb-4">
              <Avatar
                src={viewingStory.profile_picture}
                alt={viewingStory.full_name}
                fallback={viewingStory.full_name?.charAt(0)}
                size="md"
              />
              <div>
                <p className="font-semibold">{viewingStory.full_name}</p>
                <p className="text-sm text-gray-500">
                  {new Date(viewingStory.created_at).toLocaleString()}
                </p>
              </div>
            </div>
            <div className="relative">
              {viewingStory.media_type === 'image' ? (
                <img
                  src={getFullMediaUrl(viewingStory.media_url)}
                  alt="Story"
                  className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
                />
              ) : (
                <video
                  src={getFullMediaUrl(viewingStory.media_url)}
                  controls
                  autoPlay
                  className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
                />
              )}
            </div>
            {viewingStory.caption && (
              <div className="text-center">
                <p className="text-gray-700 dark:text-gray-300">{viewingStory.caption}</p>
              </div>
            )}
            {viewingStory.user_id === user?.id && (
              <div className="flex justify-end">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteStory(viewingStory.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Story
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      </div>

      {/* Right Sidebar */}
      <RightSidebar />
    </div>
  );
};

export default Feed;
