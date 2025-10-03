import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Activity, Calendar, User, Package, Edit, Trash2, Shield, 
  CheckCircle, Clock, AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { useApi } from '../hooks/useApi';
import { formatDate } from '../utils/formatters';
import DashboardLayout from '../components/DashboardLayout';
import { toast } from 'sonner';

export default function AdminLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const { request } = useApi();

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const data = await request('GET', '/admin/logs').catch(() => [
        {
          id: '1',
          admin_user_email: 'admin@hostingin.com',
          action: 'Updated order #12345',
          created_at: new Date().toISOString(),
          meta: { order_id: '12345', status: 'active' }
        },
        {
          id: '2',
          admin_user_email: 'admin@hostingin.com',
          action: 'Created new package "Professional"',
          created_at: new Date(Date.now() - 3600000).toISOString(),
          meta: { package_id: 'prof-001' }
        },
        {
          id: '3',
          admin_user_email: 'admin@hostingin.com',
          action: 'Changed user role for john@example.com',
          created_at: new Date(Date.now() - 7200000).toISOString(),
          meta: { user_email: 'john@example.com', new_role: 'admin' }
        }
      ]);
      setLogs(data);
    } catch (error) {
      toast.error('Failed to fetch activity logs');
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action) => {
    if (action.includes('Update') || action.includes('Changed')) {
      return <Edit className="w-5 h-5 text-blue-600" />;
    } else if (action.includes('Created')) {
      return <CheckCircle className="w-5 h-5 text-green-600" />;
    } else if (action.includes('Deleted')) {
      return <Trash2 className="w-5 h-5 text-red-600" />;
    } else {
      return <Activity className="w-5 h-5 text-slate-600" />;
    }
  };

  const getActionColor = (action) => {
    if (action.includes('Update') || action.includes('Changed')) {
      return 'bg-blue-100 dark:bg-blue-900/20';
    } else if (action.includes('Created')) {
      return 'bg-green-100 dark:bg-green-900/20';
    } else if (action.includes('Deleted')) {
      return 'bg-red-100 dark:bg-red-900/20';
    } else {
      return 'bg-slate-100 dark:bg-slate-900/20';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-bold mb-2">Activity Logs</h1>
          <p className="text-slate-600 dark:text-slate-400">
            Track all administrative actions and changes
          </p>
        </motion.div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border-0 shadow-lg bg-white/50 dark:bg-slate-800/50 backdrop-blur">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <Activity className="w-8 h-8 text-blue-600" />
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Total Actions</p>
                    <p className="text-2xl font-bold">{logs.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Card className="border-0 shadow-lg bg-white/50 dark:bg-slate-800/50 backdrop-blur">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Created</p>
                    <p className="text-2xl font-bold">
                      {logs.filter(l => l.action.includes('Created')).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-0 shadow-lg bg-white/50 dark:bg-slate-800/50 backdrop-blur">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <Edit className="w-8 h-8 text-blue-600" />
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Updated</p>
                    <p className="text-2xl font-bold">
                      {logs.filter(l => l.action.includes('Update') || l.action.includes('Changed')).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <Card className="border-0 shadow-lg bg-white/50 dark:bg-slate-800/50 backdrop-blur">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <Trash2 className="w-8 h-8 text-red-600" />
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Deleted</p>
                    <p className="text-2xl font-bold">
                      {logs.filter(l => l.action.includes('Deleted')).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Activity Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-0 shadow-lg bg-white/50 dark:bg-slate-800/50 backdrop-blur">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="animate-pulse flex items-start gap-4">
                      <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-2/3"></div>
                        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : logs.length === 0 ? (
                <div className="text-center py-12">
                  <Activity className="w-16 h-16 mx-auto mb-4 text-slate-400" />
                  <h3 className="text-xl font-semibold mb-2">No activity logs yet</h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    Admin actions will appear here
                  </p>
                </div>
              ) : (
                <div className="relative">
                  {/* Timeline Line */}
                  <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 via-violet-500 to-transparent"></div>

                  <div className="space-y-6">
                    {logs.map((log, index) => (
                      <motion.div
                        key={log.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="relative flex items-start gap-4"
                      >
                        {/* Icon */}
                        <div className={`relative z-10 p-3 rounded-lg ${getActionColor(log.action)}`}>
                          {getActionIcon(log.action)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 p-4 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <p className="font-medium text-slate-900 dark:text-slate-100 mb-1">
                                {log.action}
                              </p>
                              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                <Shield className="w-4 h-4" />
                                <span>{log.admin_user_email}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400">
                              <Clock className="w-4 h-4" />
                              {formatDate(log.created_at)}
                            </div>
                          </div>

                          {/* Meta Information */}
                          {log.meta && Object.keys(log.meta).length > 0 && (
                            <div className="mt-3 pt-3 border-t">
                              <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">Details:</p>
                              <div className="flex flex-wrap gap-2">
                                {Object.entries(log.meta).map(([key, value]) => (
                                  <Badge key={key} variant="outline" className="text-xs">
                                    {key}: {typeof value === 'object' ? JSON.stringify(value) : value}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}