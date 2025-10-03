import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Megaphone, Users, Sparkles } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import DashboardLayout from '../components/DashboardLayout';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const AdminBroadcast = () => {
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    category: 'system',
    target: 'all'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const categories = [
    { id: 'promo', label: '🎉 Promo', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
    { id: 'system', label: '⚡ System', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
    { id: 'payment', label: '💳 Payment', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
    { id: 'expiry', label: '⏰ Expiry', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' }
  ];
  
  const targets = [
    { id: 'all', label: 'All Users', description: 'Send to all registered users' },
    { id: 'active_users', label: 'Active Users', description: 'Users with active services' },
    { id: 'new_users', label: 'New Users', description: 'Users registered in last 30 days' }
  ];
  
  const templates = [
    {
      title: 'Promo Akhir Tahun',
      message: '🎉 Promo Akhir Tahun! Diskon 50% untuk semua paket hosting. Gunakan kode TAHUNBARU2025 saat checkout. Promo berlaku hingga 31 Desember 2024.',
      category: 'promo'
    },
    {
      title: 'Maintenance Schedule',
      message: '🛠️ Scheduled maintenance akan dilakukan pada tanggal 25 Desember 2024, pukul 02:00 - 04:00 WIB. Layanan mungkin terganggu sementara. Terima kasih atas pengertiannya.',
      category: 'system'
    },
    {
      title: 'Payment Method Update',
      message: '💳 Kami telah menambahkan metode pembayaran baru: QRIS dan E-Wallet! Sekarang pembayaran lebih mudah dan cepat.',
      category: 'payment'
    },
    {
      title: 'Service Expiry Reminder',
      message: '⏰ Beberapa layanan Anda akan segera expired. Jangan lupa perpanjang untuk menghindari downtime. Klik "My Services" untuk melihat detail.',
      category: 'expiry'
    }
  ];
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.message.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${BACKEND_URL}/api/admin/notifications/broadcast`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success(response.data.message || 'Broadcast sent successfully!');
      
      // Reset form
      setFormData({
        title: '',
        message: '',
        category: 'system',
        target: 'all'
      });
    } catch (error) {
      console.error('Broadcast failed:', error);
      toast.error('Failed to send broadcast');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const useTemplate = (template) => {
    setFormData({
      ...formData,
      title: template.title,
      message: template.message,
      category: template.category
    });
    toast.success('Template loaded!');
  };
  
  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-violet-600 rounded-full mb-4"
          >
            <Megaphone className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Broadcast Notifications
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Send announcements to all users or specific groups
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl p-6 border dark:border-gray-700 space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Notification Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Promo Akhir Tahun"
                  className="w-full px-4 py-2 border dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-900 dark:text-white"
                  required
                />
              </div>
              
              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Message *
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Write your announcement message here..."
                  rows="6"
                  className="w-full px-4 py-2 border dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-900 dark:text-white resize-none"
                  required
                />
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  {formData.message.length} characters
                </p>
              </div>
              
              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, category: cat.id })}
                      className={`p-3 rounded-lg border-2 text-left transition ${
                        formData.category === cat.id
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <span className="font-medium">{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Target Audience */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Target Audience
                </label>
                <div className="space-y-2">
                  {targets.map((target) => (
                    <label
                      key={target.id}
                      className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition ${
                        formData.target === target.id
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <input
                        type="radio"
                        name="target"
                        value={target.id}
                        checked={formData.target === target.id}
                        onChange={(e) => setFormData({ ...formData, target: e.target.value })}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">{target.label}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{target.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              
              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Send Broadcast
                  </>
                )}
              </button>
            </form>
          </div>
          
          {/* Templates Sidebar */}
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border dark:border-gray-700">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900 dark:text-white">Quick Templates</h3>
              </div>
              <div className="space-y-3">
                {templates.map((template, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => useTemplate(template)}
                    className="w-full text-left p-3 rounded-lg border dark:border-gray-700 hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition"
                  >
                    <p className="font-medium text-gray-900 dark:text-white text-sm mb-1">
                      {template.title}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                      {template.message}
                    </p>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Info Box */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-900/50">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="font-semibold text-blue-900 dark:text-blue-100">Broadcasting Tips</h3>
              </div>
              <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                <li>• Keep messages clear and concise</li>
                <li>• Use appropriate categories for better organization</li>
                <li>• Target specific audiences for better engagement</li>
                <li>• Include call-to-action when needed</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminBroadcast;
