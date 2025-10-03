import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Filter, Send, CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import DashboardLayout from '../components/DashboardLayout';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const AdminSupport = () => {
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [replyText, setReplyText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  useEffect(() => {
    fetchTickets();
    fetchStats();
  }, [activeFilter]);
  
  const fetchTickets = async () => {
    try {
      const token = localStorage.getItem('token');
      const url = activeFilter === 'all' 
        ? `${BACKEND_URL}/api/admin/support/tickets`
        : `${BACKEND_URL}/api/admin/support/tickets?status=${activeFilter}`;
        
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTickets(response.data);
    } catch (error) {
      console.error('Failed to fetch tickets:', error);
      toast.error('Failed to load tickets');
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${BACKEND_URL}/api/admin/support/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };
  
  const fetchTicketDetail = async (ticketId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${BACKEND_URL}/api/admin/support/tickets/${ticketId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedTicket(response.data);
    } catch (error) {
      console.error('Failed to fetch ticket details:', error);
      toast.error('Failed to load ticket details');
    }
  };
  
  const updateTicketStatus = async (ticketId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `${BACKEND_URL}/api/admin/support/tickets/${ticketId}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success(`Ticket status updated to ${newStatus}`);
      fetchTickets();
      if (selectedTicket && selectedTicket.id === ticketId) {
        fetchTicketDetail(ticketId);
      }
    } catch (error) {
      console.error('Failed to update ticket:', error);
      toast.error('Failed to update ticket status');
    }
  };
  
  const sendReply = async () => {
    if (!replyText.trim() || !selectedTicket) return;
    
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `${BACKEND_URL}/api/admin/support/tickets/${selectedTicket.id}`,
        { reply: replyText },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setReplyText('');
      toast.success('Reply sent successfully');
      fetchTicketDetail(selectedTicket.id);
      fetchTickets();
    } catch (error) {
      console.error('Failed to send reply:', error);
      toast.error('Failed to send reply');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const getStatusIcon = (status) => {
    const icons = {
      open: Clock,
      in_progress: AlertCircle,
      resolved: CheckCircle,
      closed: XCircle
    };
    return icons[status] || AlertCircle;
  };
  
  const getStatusColor = (status) => {
    const colors = {
      open: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
      in_progress: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      resolved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      closed: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
    };
    return colors[status] || colors.open;
  };
  
  const getPriorityColor = (priority) => {
    const colors = {
      low: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
      medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
      high: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
    };
    return colors[priority] || colors.medium;
  };
  
  const filters = [
    { id: 'all', label: 'All' },
    { id: 'open', label: 'Open' },
    { id: 'in_progress', label: 'In Progress' },
    { id: 'resolved', label: 'Resolved' },
    { id: 'closed', label: 'Closed' }
  ];
  
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Support Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage customer support tickets
            </p>
          </div>
        </div>
        
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-900/50">
              <p className="text-sm text-yellow-700 dark:text-yellow-400">Open</p>
              <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">{stats.open}</p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-900/50">
              <p className="text-sm text-blue-700 dark:text-blue-400">In Progress</p>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">{stats.in_progress}</p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-900/50">
              <p className="text-sm text-green-700 dark:text-green-400">Resolved</p>
              <p className="text-2xl font-bold text-green-700 dark:text-green-400">{stats.resolved}</p>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-900/50">
              <p className="text-sm text-purple-700 dark:text-purple-400">AI Escalated</p>
              <p className="text-2xl font-bold text-purple-700 dark:text-purple-400">{stats.ai_escalated}</p>
            </div>
          </div>
        )}
        
        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2">
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
        
        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tickets List */}
          <div className="lg:col-span-1 space-y-3 max-h-[600px] overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : tickets.length === 0 ? (
              <div className="text-center py-10">
                <MessageCircle className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-600 dark:text-gray-400">No tickets found</p>
              </div>
            ) : (
              tickets.map((ticket) => {
                const StatusIcon = getStatusIcon(ticket.status);
                return (
                  <motion.div
                    key={ticket.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => fetchTicketDetail(ticket.id)}
                    className={`bg-white dark:bg-gray-800 rounded-lg p-4 border dark:border-gray-700 cursor-pointer hover:shadow-md transition ${
                      selectedTicket?.id === ticket.id ? 'ring-2 ring-blue-600' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-1">
                        {ticket.subject}
                      </h3>
                      <StatusIcon className="w-4 h-4 flex-shrink-0 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
                      {ticket.message}
                    </p>
                    <div className="flex items-center justify-between text-xs">
                      <span className={`px-2 py-1 rounded-full ${getStatusColor(ticket.status)}`}>
                        {ticket.status.replace('_', ' ')}
                      </span>
                      <span className={`px-2 py-1 rounded-full ${getPriorityColor(ticket.priority)}`}>
                        {ticket.priority}
                      </span>
                    </div>
                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-500">
                      {ticket.user_name} • {ticket.user_email}
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
          
          {/* Ticket Detail */}
          <div className="lg:col-span-2">
            {!selectedTicket ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-10 border dark:border-gray-700 text-center">
                <MessageCircle className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  Select a ticket to view details
                </p>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border dark:border-gray-700 space-y-6">
                {/* Ticket Header */}
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        {selectedTicket.subject}
                      </h2>
                      <div className="flex flex-wrap gap-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(selectedTicket.status)}`}>
                          {selectedTicket.status.replace('_', ' ')}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(selectedTicket.priority)}`}>
                          {selectedTicket.priority} priority
                        </span>
                        {selectedTicket.source === 'ai_escalation' && (
                          <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                            🤖 AI Escalated
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Status Actions */}
                  <div className="flex gap-2 mb-4">
                    <button
                      onClick={() => updateTicketStatus(selectedTicket.id, 'in_progress')}
                      disabled={selectedTicket.status === 'in_progress'}
                      className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Mark In Progress
                    </button>
                    <button
                      onClick={() => updateTicketStatus(selectedTicket.id, 'resolved')}
                      disabled={selectedTicket.status === 'resolved'}
                      className="px-3 py-1 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Mark Resolved
                    </button>
                    <button
                      onClick={() => updateTicketStatus(selectedTicket.id, 'closed')}
                      disabled={selectedTicket.status === 'closed'}
                      className="px-3 py-1 text-sm bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Close
                    </button>
                  </div>
                  
                  <div className="border-t dark:border-gray-700 pt-4">
                    <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                      {selectedTicket.message}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-4">
                      Created {new Date(selectedTicket.created_at).toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>
                
                {/* Replies */}
                {selectedTicket.replies && selectedTicket.replies.length > 0 && (
                  <div className="border-t dark:border-gray-700 pt-6">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Replies</h3>
                    <div className="space-y-4">
                      {selectedTicket.replies.map((reply, idx) => (
                        <div key={idx} className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-medium text-blue-700 dark:text-blue-400">
                              {reply.admin_name}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-500">
                              {new Date(reply.timestamp).toLocaleString('id-ID')}
                            </span>
                          </div>
                          <p className="text-gray-700 dark:text-gray-300">{reply.message}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Reply Form */}
                <div className="border-t dark:border-gray-700 pt-6">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Send Reply</h3>
                  <div className="flex gap-3">
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Type your reply..."
                      rows="3"
                      className="flex-1 px-4 py-2 border dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-900 dark:text-white resize-none"
                    />
                    <button
                      onClick={sendReply}
                      disabled={!replyText.trim() || isSubmitting}
                      className="px-6 py-2 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 self-end"
                    >
                      <Send className="w-4 h-4" />
                      Send
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminSupport;
