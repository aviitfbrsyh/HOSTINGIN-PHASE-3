import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, Edit, Trash2, Package as PackageIcon, HardDrive, Wifi
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { useApi } from '../hooks/useApi';
import { formatCurrency } from '../utils/formatters';
import DashboardLayout from '../components/DashboardLayout';
import { toast } from 'sonner';

export default function AdminPackages() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);
  const [saving, setSaving] = useState(false);
  const { request } = useApi();

  const [formData, setFormData] = useState({
    slug: '',
    title: '',
    description: '',
    price_cents: '',
    storage_mb: '',
    bandwidth_gb: '',
    features: ''
  });

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      const data = await request('GET', '/packages');
      setPackages(data);
    } catch (error) {
      toast.error('Failed to fetch packages');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    setEditingPackage(null);
    setFormData({
      slug: '',
      title: '',
      description: '',
      price_cents: '',
      storage_mb: '',
      bandwidth_gb: '',
      features: ''
    });
    setDialogOpen(true);
  };

  const handleEdit = (pkg) => {
    setEditingPackage(pkg);
    setFormData({
      slug: pkg.slug,
      title: pkg.title,
      description: pkg.description,
      price_cents: pkg.price_cents.toString(),
      storage_mb: pkg.storage_mb.toString(),
      bandwidth_gb: pkg.bandwidth_gb.toString(),
      features: pkg.features.join('\n')
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    // Validation
    if (!formData.title || !formData.slug || !formData.price_cents) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        price_cents: parseInt(formData.price_cents),
        storage_mb: parseInt(formData.storage_mb),
        bandwidth_gb: parseInt(formData.bandwidth_gb),
        features: formData.features.split('\n').filter(f => f.trim())
      };

      if (editingPackage) {
        await request('PATCH', `/packages/${editingPackage.id}`, payload);
        toast.success('Package updated successfully!');
      } else {
        await request('POST', '/packages', payload);
        toast.success('Package created successfully!');
      }

      setDialogOpen(false);
      fetchPackages();
    } catch (error) {
      toast.error(error.message || 'Failed to save package');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (pkg) => {
    if (!window.confirm(`Are you sure you want to delete "${pkg.title}"?`)) {
      return;
    }

    try {
      await request('DELETE', `/packages/${pkg.id}`);
      toast.success('Package deleted successfully!');
      fetchPackages();
    } catch (error) {
      toast.error('Failed to delete package');
    }
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
            <h1 className="text-4xl font-bold mb-2">Package Management</h1>
            <p className="text-slate-600 dark:text-slate-400">
              Create and manage hosting packages
            </p>
          </div>
          <Button
            onClick={handleCreateNew}
            className="bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Package
          </Button>
        </motion.div>

        {/* Packages Grid */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="animate-pulse space-y-4">
                    <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
                    <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded"></div>
                      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded"></div>
                      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {packages.map((pkg, index) => (
              <motion.div
                key={pkg.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="border-0 shadow-lg hover:shadow-xl transition-all bg-white/50 dark:bg-slate-800/50 backdrop-blur">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-2xl mb-2">{pkg.title}</CardTitle>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {pkg.description}
                        </p>
                      </div>
                      <PackageIcon className="w-8 h-8 text-blue-600" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
                      {formatCurrency(pkg.price_cents)}
                      <span className="text-sm text-slate-600 dark:text-slate-400">/month</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900">
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 mb-1">
                          <HardDrive className="w-4 h-4" />
                          <span className="text-xs">Storage</span>
                        </div>
                        <p className="font-semibold">{(pkg.storage_mb / 1024).toFixed(0)} GB</p>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900">
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 mb-1">
                          <Wifi className="w-4 h-4" />
                          <span className="text-xs">Bandwidth</span>
                        </div>
                        <p className="font-semibold">{pkg.bandwidth_gb} GB</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">Features:</p>
                      <ul className="text-sm space-y-1">
                        {pkg.features.slice(0, 3).map((feature, idx) => (
                          <li key={idx} className="text-slate-600 dark:text-slate-400">• {feature}</li>
                        ))}
                        {pkg.features.length > 3 && (
                          <li className="text-slate-500">+ {pkg.features.length - 3} more</li>
                        )}
                      </ul>
                    </div>

                    <div className="flex gap-2 pt-4 border-t">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleEdit(pkg)}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                        onClick={() => handleDelete(pkg)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPackage ? 'Edit Package' : 'Create New Package'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Professional Plan"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug * (unique)</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="professional"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Perfect for growing businesses"
              />
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price (cents) *</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price_cents}
                  onChange={(e) => setFormData({ ...formData, price_cents: e.target.value })}
                  placeholder="150000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="storage">Storage (MB)</Label>
                <Input
                  id="storage"
                  type="number"
                  value={formData.storage_mb}
                  onChange={(e) => setFormData({ ...formData, storage_mb: e.target.value })}
                  placeholder="51200"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bandwidth">Bandwidth (GB)</Label>
                <Input
                  id="bandwidth"
                  type="number"
                  value={formData.bandwidth_gb}
                  onChange={(e) => setFormData({ ...formData, bandwidth_gb: e.target.value })}
                  placeholder="500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="features">Features (one per line)</Label>
              <Textarea
                id="features"
                rows={6}
                value={formData.features}
                onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                placeholder="Free SSL Certificate&#10;Daily Backups&#10;24/7 Support&#10;Unlimited Email Accounts"
              />
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Saving...' : (editingPackage ? 'Update Package' : 'Create Package')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}