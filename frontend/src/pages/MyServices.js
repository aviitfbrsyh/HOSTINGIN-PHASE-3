import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Server, Calendar, CheckCircle, XCircle, Clock, 
  RotateCw, ExternalLink, AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { useApi } from '../hooks/useApi';
import { formatCurrency } from '../utils/formatters';
import DashboardLayout from '../components/DashboardLayout';
import { toast } from 'sonner';

export default function MyServices() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const { request } = useApi();

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const data = await request('GET', '/services/my');
      setServices(data);
    } catch (error) {
      toast.error('Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  const renewService = async (serviceId) => {
    try {
      await request('POST', `/services/${serviceId}/renew`);
      toast.success('Service renewed successfully!');
      fetchServices();
    } catch (error) {
      toast.error('Failed to renew service');
    }
  };

  const getStatusConfig = (status) => {
    const configs = {
      active: {
        label: 'Active',
        color: 'bg-green-500',
        icon: CheckCircle,
        textColor: 'text-green-600 dark:text-green-400',
        bgColor: 'bg-green-50 dark:bg-green-900/20'
      },
      inactive: {
        label: 'Inactive',
        color: 'bg-slate-500',
        icon: Clock,
        textColor: 'text-slate-600 dark:text-slate-400',
        bgColor: 'bg-slate-50 dark:bg-slate-900/20'
      },
      pending: {
        label: 'Pending',
        color: 'bg-yellow-500',
        icon: Clock,
        textColor: 'text-yellow-600 dark:text-yellow-400',
        bgColor: 'bg-yellow-50 dark:bg-yellow-900/20'
      },
      expired: {
        label: 'Expired',
        color: 'bg-orange-500',
        icon: AlertCircle,
        textColor: 'text-orange-600 dark:text-orange-400',
        bgColor: 'bg-orange-50 dark:bg-orange-900/20'
      },
      cancelled: {
        label: 'Cancelled',
        color: 'bg-red-500',
        icon: XCircle,
        textColor: 'text-red-600 dark:text-red-400',
        bgColor: 'bg-red-50 dark:bg-red-900/20'
      }
    };
    return configs[status] || configs.inactive;
  };

  const calculateDaysRemaining = (expiryDate) => {
    if (!expiryDate) return null;
    
    const expiry = new Date(expiryDate);
    const now = new Date();
    const diffTime = expiry - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  const getExpiryProgress = (createdAt, expiryDate) => {
    if (!expiryDate || !createdAt) return 0;
    
    const created = new Date(createdAt);
    const expiry = new Date(expiryDate);
    const now = new Date();
    
    const totalDuration = expiry - created;
    const elapsed = now - created;
    
    return Math.max(0, Math.min(100, (elapsed / totalDuration) * 100));
  };

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
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
              My Services
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Manage all your active hosting services
            </p>
          </div>
          
          <Badge variant="secondary" className="text-lg px-4 py-2">
            {services.length} {services.length === 1 ? 'Service' : 'Services'}
          </Badge>
        </motion.div>

        {/* Services List */}
        {loading ? (
          <div className="grid md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="animate-pulse space-y-4">
                    <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
                    <div className="h-20 bg-slate-200 dark:bg-slate-700 rounded"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : services.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-slate-800 dark:to-slate-900">
              <CardContent className="p-12 text-center">
                <Server className="w-24 h-24 mx-auto text-slate-300 dark:text-slate-700 mb-6" />
                <h3 className="text-2xl font-semibold mb-2">No Services Yet</h3>
                <p className="text-slate-600 dark:text-slate-400 mb-6">
                  You haven't purchased any hosting services yet
                </p>
                <Button
                  onClick={() => window.location.href = '/dashboard/packages'}
                  className="bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700"
                >
                  Browse Packages
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {services.map((service, index) => {
              const statusConfig = getStatusConfig(service.status);
              const daysRemaining = calculateDaysRemaining(service.expires_at);
              const progress = getExpiryProgress(service.created_at, service.expires_at);
              const StatusIcon = statusConfig.icon;

              return (
                <motion.div
                  key={service.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="border-0 shadow-lg hover:shadow-xl transition-all">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center">
                            <Server className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <CardTitle className="text-xl mb-1">
                              {service.domain}
                            </CardTitle>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              {service.package}
                            </p>
                          </div>
                        </div>
                        
                        <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${statusConfig.bgColor}`}>
                          <StatusIcon className={`w-4 h-4 ${statusConfig.textColor}`} />
                          <span className={`text-sm font-medium ${statusConfig.textColor}`}>
                            {statusConfig.label}
                          </span>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {/* Expiry Information */}
                      {service.expires_at && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-600 dark:text-slate-400">Service Period</span>
                            {daysRemaining !== null && (
                              <span className={`font-medium ${
                                daysRemaining < 30 
                                  ? 'text-orange-600 dark:text-orange-400' 
                                  : 'text-slate-700 dark:text-slate-300'
                              }`}>
                                {daysRemaining > 0 
                                  ? `${daysRemaining} days remaining` 
                                  : 'Expired'}
                              </span>
                            )}
                          </div>
                          <Progress value={progress} className="h-2" />
                          <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                            <span>{new Date(service.created_at).toLocaleDateString()}</span>
                            <span>{new Date(service.expires_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                        <div>
                          <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Price</p>
                          <p className="font-semibold text-blue-600 dark:text-blue-400">
                            {formatCurrency(service.price_cents)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Period</p>
                          <p className="font-semibold">
                            {service.period_months} {service.period_months === 1 ? 'month' : 'months'}
                          </p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-2">
                        {(service.status === 'expired' || (daysRemaining !== null && daysRemaining < 30)) && (
                          <Button
                            onClick={() => renewService(service.id)}
                            className="flex-1 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700"
                            size="sm"
                          >
                            <RotateCw className="w-4 h-4 mr-2" />
                            Renew
                          </Button>
                        )}
                        
                        {service.status === 'active' && (
                          <Button
                            variant="outline"
                            className="flex-1"
                            size="sm"
                          >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Manage
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
