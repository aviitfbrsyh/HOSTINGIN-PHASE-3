import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { History, Filter, Package, CreditCard, Globe, MessageCircle, Search } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const ActivityTimeline = () => {
  const [timeline, setTimeline] = useState([]);
  const [filteredTimeline, setFilteredTimeline] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  useEffect(() => {
    fetchTimeline();
  }, []);
  
  useEffect(() => {
    filterTimeline();
  }, [timeline, activeFilter, searchQuery]);
  
  const fetchTimeline = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${BACKEND_URL}/api/history/timeline`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTimeline(response.data);
    } catch (error) {
      console.error('Failed to fetch timeline:', error);
      toast.error('Failed to load activity timeline');
    } finally {
      setIsLoading(false);
    }
  };
  
  const filterTimeline = () => {
    let filtered = [...timeline];
    
    // Filter by type
    if (activeFilter !== 'all') {
      filtered = filtered.filter(item => item.type === activeFilter);
    }
    
    // Filter by search
    if (searchQuery) {
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    setFilteredTimeline(filtered);
  };
  
  const getTypeColor = (type) => {
    const colors = {
      order_created: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      payment_success: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      service_active: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
      support_ticket: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
    };
    return colors[type] || 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
  };
  
  const getIcon = (type) => {
    const icons = {
      order_created: Package,
      payment_success: CreditCard,
      service_active: Globe,
      support_ticket: MessageCircle
    };
    const Icon = icons[type] || History;
    return Icon;
  };
  
  const filters = [
    { id: 'all', label: 'All Activity' },
    { id: 'order_created', label: 'Orders' },
    { id: 'payment_success', label: 'Payments' },
    { id: 'service_active', label: 'Services' },
    { id: 'support_ticket', label: 'Support' }
  ];
  
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Activity Timeline
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Complete history of your activities
        </p>
      </div>
      
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search activities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
          />
        </div>
        
        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
          {filters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap transition ${
                activeFilter === filter.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* Timeline */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredTimeline.length === 0 ? (
        <div className="text-center py-20">
          <History className="w-20 h-20 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No activity found
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {searchQuery || activeFilter !== 'all'
              ? 'Try adjusting your filters or search query'
              : 'Start by creating your first order!'}
          </p>
        </div>
      ) : (
        <div className="relative">
          {/* Timeline Line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700"></div>
          
          {/* Timeline Items */}
          <div className="space-y-6">
            {filteredTimeline.map((item, index) => {
              const Icon = getIcon(item.type);
              
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="relative pl-16"
                >
                  {/* Icon */}
                  <div className={`absolute left-0 w-12 h-12 rounded-full ${getTypeColor(item.type)} flex items-center justify-center shadow-lg`}>
                    <span className="text-2xl">{item.icon}</span>
                  </div>
                  
                  {/* Content Card */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border dark:border-gray-700 hover:shadow-md transition">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                          {item.title}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                          {item.description}
                        </p>
                        
                        {/* Meta Information */}
                        {item.meta && Object.keys(item.meta).length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-3">
                            {item.meta.domain && (
                              <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full">
                                {item.meta.domain}
                              </span>
                            )}
                            {item.meta.package && (
                              <span className="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-full">
                                {item.meta.package}
                              </span>
                            )}
                            {item.meta.amount && (
                              <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full">
                                Rp {(item.meta.amount / 100).toLocaleString('id-ID')}
                              </span>
                            )}
                            {item.meta.status && (
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                item.meta.status === 'resolved' || item.meta.status === 'closed'
                                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                  : item.meta.status === 'open' || item.meta.status === 'in_progress'
                                  ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                                  : 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400'
                              }`}>
                                {item.meta.status}
                              </span>
                            )}
                          </div>
                        )}
                        
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          {new Date(item.timestamp).toLocaleString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityTimeline;
