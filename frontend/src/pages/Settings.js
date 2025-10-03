import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  User, Lock, Palette, Bell, Shield, Moon, Sun,
  Check, Upload, Mail, Phone
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import DashboardLayout from '../components/DashboardLayout';
import { toast } from 'sonner';

export default function Settings() {
  const { user, updateUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { request } = useApi();
  
  const [saving, setSaving] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: ''
  });

  const [passwordData, setPasswordData] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  const [preferences, setPreferences] = useState({
    accentColor: user?.settings?.color || 'blue',
    emailNotifications: true,
    pushNotifications: false,
    weeklyDigest: true,
    marketingEmails: false
  });

  const accentColors = [
    { name: 'Blue', value: 'blue', class: 'bg-blue-600' },
    { name: 'Violet', value: 'violet', class: 'bg-violet-600' },
    { name: 'Purple', value: 'purple', class: 'bg-purple-600' },
    { name: 'Green', value: 'green', class: 'bg-green-600' },
    { name: 'Orange', value: 'orange', class: 'bg-orange-600' },
    { name: 'Pink', value: 'pink', class: 'bg-pink-600' }
  ];

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.new !== passwordData.confirm) {
      toast.error('Passwords do not match');
      return;
    }

    if (passwordData.new.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Password changed successfully!');
      setPasswordData({ current: '', new: '', confirm: '' });
    } catch (error) {
      toast.error('Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePreferences = async () => {
    setSaving(true);
    try {
      await request('PATCH', '/auth/settings', {
        color: preferences.accentColor,
        theme: theme
      });
      toast.success('Preferences saved!');
    } catch (error) {
      toast.error('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = () => {
    toast.info('Avatar upload coming soon!');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-bold mb-2">Settings</h1>
          <p className="text-slate-600 dark:text-slate-400">
            Manage your account settings and preferences
          </p>
        </motion.div>

        {/* Settings Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid bg-white/50 dark:bg-slate-800/50 backdrop-blur">
              <TabsTrigger value="profile" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-violet-600 data-[state=active]:text-white">
                <User className="w-4 h-4 mr-2" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="security" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-violet-600 data-[state=active]:text-white">
                <Shield className="w-4 h-4 mr-2" />
                Security
              </TabsTrigger>
              <TabsTrigger value="preferences" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-violet-600 data-[state=active]:text-white">
                <Palette className="w-4 h-4 mr-2" />
                Preferences
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile">
              <Card className="border-0 shadow-lg bg-white/50 dark:bg-slate-800/50 backdrop-blur">
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>
                    Update your account profile information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Avatar */}
                  <div className="flex items-center gap-6">
                    <Avatar className="w-24 h-24 border-4 border-white dark:border-slate-700 shadow-lg">
                      <AvatarImage src="" />
                      <AvatarFallback className="text-2xl bg-gradient-to-br from-blue-500 to-violet-500 text-white">
                        {user?.name?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleAvatarUpload}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Photo
                      </Button>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        JPG, PNG or GIF. Max 2MB.
                      </p>
                    </div>
                  </div>

                  {/* Form Fields */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={profileData.name}
                        onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+62 xxx xxxx xxxx"
                        value={profileData.phone}
                        onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Account Type</Label>
                      <Input
                        value={user?.role === 'admin' ? 'Administrator' : 'User'}
                        disabled
                      />
                    </div>
                  </div>

                  <Button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security">
              <Card className="border-0 shadow-lg bg-white/50 dark:bg-slate-800/50 backdrop-blur">
                <CardHeader>
                  <CardTitle>Change Password</CardTitle>
                  <CardDescription>
                    Ensure your account is using a strong password
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Current Password</Label>
                    <Input
                      id="current-password"
                      type="password"
                      value={passwordData.current}
                      onChange={(e) => setPasswordData({ ...passwordData, current: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={passwordData.new}
                      onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
                    />
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Must be at least 8 characters long
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={passwordData.confirm}
                      onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
                    />
                  </div>
                  <Button
                    onClick={handleChangePassword}
                    disabled={saving}
                    className="bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700"
                  >
                    {saving ? 'Updating...' : 'Update Password'}
                  </Button>
                </CardContent>
              </Card>

              {/* Two-Factor Authentication */}
              <Card className="border-0 shadow-lg bg-white/50 dark:bg-slate-800/50 backdrop-blur mt-6">
                <CardHeader>
                  <CardTitle>Two-Factor Authentication</CardTitle>
                  <CardDescription>
                    Add an extra layer of security to your account
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Shield className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="font-medium">Two-Factor Authentication</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Coming soon
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" disabled>
                      Enable
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Preferences Tab */}
            <TabsContent value="preferences">
              <Card className="border-0 shadow-lg bg-white/50 dark:bg-slate-800/50 backdrop-blur">
                <CardHeader>
                  <CardTitle>Appearance</CardTitle>
                  <CardDescription>
                    Customize how HostingIn looks for you
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Theme Toggle */}
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                      <div>
                        <p className="font-medium">Dark Mode</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Toggle dark mode theme
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={theme === 'dark'}
                      onCheckedChange={toggleTheme}
                    />
                  </div>

                  {/* Accent Color */}
                  <div className="space-y-3">
                    <Label>Accent Color</Label>
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                      {accentColors.map((color) => (
                        <button
                          key={color.value}
                          onClick={() => setPreferences({ ...preferences, accentColor: color.value })}
                          className={`relative p-4 rounded-lg border-2 transition-all ${
                            preferences.accentColor === color.value
                              ? 'border-slate-900 dark:border-white scale-105'
                              : 'border-slate-200 dark:border-slate-700 hover:scale-105'
                          }`}
                        >
                          <div className={`w-full h-12 rounded ${color.class}`}></div>
                          {preferences.accentColor === color.value && (
                            <div className="absolute -top-2 -right-2 p-1 bg-green-500 rounded-full">
                              <Check className="w-3 h-3 text-white" />
                            </div>
                          )}
                          <p className="text-xs mt-2 font-medium">{color.name}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <Button
                    onClick={handleSavePreferences}
                    disabled={saving}
                    className="bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700"
                  >
                    {saving ? 'Saving...' : 'Save Preferences'}
                  </Button>
                </CardContent>
              </Card>

              {/* Notifications */}
              <Card className="border-0 shadow-lg bg-white/50 dark:bg-slate-800/50 backdrop-blur mt-6">
                <CardHeader>
                  <CardTitle>Notification Preferences</CardTitle>
                  <CardDescription>
                    Manage how you receive notifications
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5" />
                      <div>
                        <p className="font-medium">Email Notifications</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Receive updates via email
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={preferences.emailNotifications}
                      onCheckedChange={(checked) => 
                        setPreferences({ ...preferences, emailNotifications: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Bell className="w-5 h-5" />
                      <div>
                        <p className="font-medium">Push Notifications</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Receive browser notifications
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={preferences.pushNotifications}
                      onCheckedChange={(checked) => 
                        setPreferences({ ...preferences, pushNotifications: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5" />
                      <div>
                        <p className="font-medium">Weekly Digest</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Weekly summary of your activity
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={preferences.weeklyDigest}
                      onCheckedChange={(checked) => 
                        setPreferences({ ...preferences, weeklyDigest: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5" />
                      <div>
                        <p className="font-medium">Marketing Emails</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Promotions and product updates
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={preferences.marketingEmails}
                      onCheckedChange={(checked) => 
                        setPreferences({ ...preferences, marketingEmails: checked })
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}