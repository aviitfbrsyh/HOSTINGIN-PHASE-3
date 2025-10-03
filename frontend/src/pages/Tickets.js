import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, Plus, Clock, CheckCircle, Search, 
  Send, User, Calendar, ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { useApi } from '../hooks/useApi';
import { formatDate, getStatusColor } from '../utils/formatters';
import DashboardLayout from '../components/DashboardLayout';
import { toast } from 'sonner';

export default function Tickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [creating, setCreating] = useState(false);
  const { request } = useApi();

  const [newTicket, setNewTicket] = useState({
    subject: '',
    message: ''
  });

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const data = await request('GET', '/tickets');
      setTickets(data);
    } catch (error) {
      toast.error('Failed to fetch tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async () => {
    if (!newTicket.subject.trim() || !newTicket.message.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    setCreating(true);
    try {
      await request('POST', '/tickets', newTicket);
      toast.success('Ticket created successfully!');
      setCreateDialogOpen(false);
      setNewTicket({ subject: '', message: '' });
      fetchTickets();
    } catch (error) {
      toast.error('Failed to create ticket');
    } finally {
      setCreating(false);
    }
  };

  const viewTicketDetail = (ticket) => {
    setSelectedTicket({
      ...ticket,
      replies: [
        {
          id: '1',
          message: 'Thank you for contacting us. We are reviewing your request.',
          from: 'Support Team',
          created_at: new Date().toISOString(),
          is_staff: true
        }
      ]
    });
    setDetailDialogOpen(true);
  };

  const filteredTickets = tickets.filter(ticket =>
    ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.message.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openTickets = tickets.filter(t => t.status === 'open').length;
  const resolvedTickets = tickets.filter(t => t.status === 'resolved').length;

  const stats = [
    {
      title: 'Total Tickets',
      value: tickets.length,
      icon: MessageSquare,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20'
    },
    {
      title: 'Open Tickets',
      value: openTickets,
      icon: Clock,
      color: 'from-amber-500 to-orange-500',
      bgColor: 'bg-amber-100 dark:bg-amber-900/20'
    },
    {
      title: 'Resolved',
      value: resolvedTickets,
      icon: CheckCircle,
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-100 dark:bg-green-900/20'
    }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-4xl font-bold mb-2">Support Tickets</h1>
            <p className="text-slate-600 dark:text-slate-400">
              Get help from our support team
            </p>
          </div>
          <Button
            onClick={() => setCreateDialogOpen(true)}
            className="bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Ticket
          </Button>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="border-0 shadow-lg hover:shadow-xl transition-all bg-white/50 dark:bg-slate-800/50 backdrop-blur">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                        {stat.title}
                      </p>
                      <p className="text-3xl font-bold">{stat.value}</p>
                    </div>
                    <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                      <stat.icon className="w-6 h-6 text-slate-700 dark:text-slate-300" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-0 shadow-lg bg-white/50 dark:bg-slate-800/50 backdrop-blur">
            <CardContent className="p-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  placeholder="Search tickets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white dark:bg-slate-900"
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Tickets List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="animate-pulse space-y-3">
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredTickets.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="border-0 shadow-lg bg-white/50 dark:bg-slate-800/50 backdrop-blur">
              <CardContent className="p-12 text-center">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 text-slate-400" />
                <h3 className="text-xl font-semibold mb-2">No tickets found</h3>
                <p className="text-slate-600 dark:text-slate-400 mb-6">
                  {searchTerm ? 'Try a different search term' : 'Create your first support ticket to get started'}
                </p>
                {!searchTerm && (
                  <Button
                    onClick={() => setCreateDialogOpen(true)}
                    className="bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Ticket
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {filteredTickets.map((ticket, index) => (
              <motion.div
                key={ticket.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="border-0 shadow-lg hover:shadow-xl transition-all bg-white/50 dark:bg-slate-800/50 backdrop-blur group cursor-pointer"
                  onClick={() => viewTicketDetail(ticket)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-violet-500">
                            <MessageSquare className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{ticket.subject}</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-1">
                              {ticket.message}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400 mt-3">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatDate(ticket.created_at)}
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageSquare className="w-4 h-4" />
                            {ticket.replies_count} replies
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={getStatusColor(ticket.status)}>
                          {ticket.status === 'open' ? (
                            <Clock className="w-3 h-3 mr-1" />
                          ) : (
                            <CheckCircle className="w-3 h-3 mr-1" />
                          )}
                          {ticket.status}
                        </Badge>
                        <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Create Ticket Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Ticket</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                placeholder="Brief description of your issue"
                value={newTicket.subject}
                onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                placeholder="Provide detailed information about your issue..."
                rows={6}
                value={newTicket.message}
                onChange={(e) => setNewTicket({ ...newTicket, message: e.target.value })}
              />
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setCreateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700"
                onClick={handleCreateTicket}
                disabled={creating}
              >
                {creating ? 'Creating...' : 'Create Ticket'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Ticket Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Ticket Details</DialogTitle>
          </DialogHeader>
          {selectedTicket && (
            <div className="space-y-6">
              <div className="p-4 rounded-lg bg-gradient-to-br from-blue-50 to-violet-50 dark:from-blue-900/20 dark:to-violet-900/20">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-lg">{selectedTicket.subject}</h3>
                  <Badge className={getStatusColor(selectedTicket.status)}>
                    {selectedTicket.status}
                  </Badge>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Created: {formatDate(selectedTicket.created_at)}
                </p>
              </div>

              {/* Original Message */}
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4" />
                    <span className="font-medium">You</span>
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      {formatDate(selectedTicket.created_at)}
                    </span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300">{selectedTicket.message}</p>
                </div>

                {/* Replies */}
                {selectedTicket.replies && selectedTicket.replies.map((reply) => (
                  <motion.div
                    key={reply.id}
                    initial={{ opacity: 0, x: reply.is_staff ? 20 : -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`p-4 border rounded-lg ${
                      reply.is_staff 
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' 
                        : ''
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-4 h-4" />
                      <span className="font-medium">{reply.from}</span>
                      {reply.is_staff && (
                        <Badge className="bg-blue-500">Staff</Badge>
                      )}
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        {formatDate(reply.created_at)}
                      </span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300">{reply.message}</p>
                  </motion.div>
                ))}
              </div>

              {/* Reply Input (Dummy) */}
              {selectedTicket.status === 'open' && (
                <div className="space-y-2">
                  <Label>Add Reply</Label>
                  <div className="flex gap-2">
                    <Input placeholder="Type your reply..." className="flex-1" />
                    <Button className="bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700">
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Note: Reply functionality is coming soon
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}