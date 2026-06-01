import React, { useState, useEffect } from 'react';
import { Save, RefreshCw } from 'lucide-react';
import axios from '../../utils/axios';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import Input from '../../components/ui/Input';

const AdminSettings = () => {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await axios.get('/admin/settings');
      setSettings(response.data.data);
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      await axios.put('/admin/settings', settings);
      toast.success('Settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
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
      <div className="mb-6">
        <h1 className="text-3xl font-bold">System Settings</h1>
        <p className="text-gray-500">Configure system-wide settings</p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>General Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Site Name</label>
                <Input
                  value={settings.site_name || ''}
                  onChange={(e) => handleChange('site_name', e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Site Description</label>
                <Input
                  value={settings.site_description || ''}
                  onChange={(e) => handleChange('site_description', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Registration Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={settings.allow_registration === true}
                  onChange={(e) => handleChange('allow_registration', e.target.checked)}
                  className="rounded"
                />
                <span>Allow Public Registration</span>
              </label>
              <p className="text-sm text-gray-500">
                When disabled, only admin can create user accounts.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>File Upload Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Max File Size (bytes)</label>
                <Input
                  type="number"
                  value={settings.max_file_size || 10485760}
                  onChange={(e) => handleChange('max_file_size', parseInt(e.target.value))}
                />
                <p className="text-sm text-gray-500 mt-1">Default: 10485760 (10MB)</p>
              </div>
              <div>
                <label className="text-sm font-medium">Allowed File Types (JSON array)</label>
                <Input
                  value={JSON.stringify(settings.allowed_file_types || ['jpg', 'jpeg', 'png', 'gif', 'mp4', 'mp3', 'pdf'])}
                  onChange={(e) => {
                    try {
                      handleChange('allowed_file_types', JSON.parse(e.target.value));
                    } catch (err) {
                      // Invalid JSON, don't update
                    }
                  }}
                />
                <p className="text-sm text-gray-500 mt-1">Example: ["jpg","jpeg","png","gif","mp4"]</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rate Limiting</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Rate Limit Window (minutes)</label>
                <Input
                  type="number"
                  value={settings.rate_limit_window || 15}
                  onChange={(e) => handleChange('rate_limit_window', parseInt(e.target.value))}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Max Requests per Window</label>
                <Input
                  type="number"
                  value={settings.rate_limit_max_requests || 100}
                  onChange={(e) => handleChange('rate_limit_max_requests', parseInt(e.target.value))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={fetchSettings}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button onClick={handleSaveSettings} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
