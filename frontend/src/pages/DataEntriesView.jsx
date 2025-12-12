import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, FileText, TrendingUp, Package, AlertCircle, Edit, Trash2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';

const DataEntriesView = ({ user, setUser, api }) => {
  const navigate = useNavigate();
  const [productionLogs, setProductionLogs] = useState([]);
  const [cooperatives, setCooperatives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCooperative, setFilterCooperative] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentLog, setCurrentLog] = useState(null);
  const [formData, setFormData] = useState({});!

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const logsResponse = await api.get('/production-logs');
      setProductionLogs(logsResponse.data);
      
      const coopsResponse = await api.get('/cooperatives');
      setCooperatives(coopsResponse.data);
    } catch (error) {
      toast.error('Failed to load data entries');
    }
    setLoading(false);
  };

  const handleOpenDialog = (log) => {
    setCurrentLog(log);
    setFormData({
      total_production: log.total_production,
      grade_a_percent: log.grade_a_percent,
      grade_b_percent: log.grade_b_percent,
      post_harvest_loss_percent: log.post_harvest_loss_percent,
      post_harvest_loss_kg: log.post_harvest_loss_kg,
      energy_use: log.energy_use,
      has_nonconformity: log.has_nonconformity,
      nonconformity_description: log.nonconformity_description || '',
      corrective_action: log.corrective_action || ''
    });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setCurrentLog(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/production-logs/${currentLog.id}`, formData);
      toast.success('Entry updated successfully');
      handleCloseDialog();
      loadData();
    } catch (error) {
      toast.error('Failed to update entry');
    }
  };

  const handleDelete = async (logId) => {
    if (!window.confirm('Are you sure you want to delete this entry?')) {
      return;
    }
    
    try {
      await api.delete(`/production-logs/${logId}`);
      toast.success('Entry deleted successfully');
      loadData();
    } catch (error) {
      toast.error('Failed to delete entry');
    }
  };

  const getBackRoute = () => {
    return user?.role === 'officer' ? '/overview' : '/home';
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  // Filter logs
  const filteredLogs = productionLogs.filter(log => {
    if (filterCooperative !== 'all' && log.cooperative_id !== filterCooperative) return false;
    if (user?.role === 'manager' && user.cooperative_id && log.cooperative_id !== user.cooperative_id) return false;
    return true;
  });

  // Calculate statistics
  const totalProduction = filteredLogs.reduce((sum, log) => sum + log.total_production, 0);
  const avgLoss = filteredLogs.length > 0
    ? filteredLogs.reduce((sum, log) => sum + log.post_harvest_loss_percent, 0) / filteredLogs.length
    : 0;
  const avgQualityA = filteredLogs.length > 0
    ? filteredLogs.reduce((sum, log) => sum + log.grade_a_percent, 0) / filteredLogs.length
    : 0;
  const issuesCount = filteredLogs.filter(log => log.has_nonconformity).length;

  // Trend data
  const trendData = filteredLogs.slice(0, 15).reverse().map((log, idx) => ({
    period: log.batch_period || `P${idx + 1}`,
    production: log.total_production,
    loss: log.post_harvest_loss_percent,
    quality: log.grade_a_percent
  }));

  const getEnergyColor = (energy) => {
    const colors = {
      'High': 'bg-red-500 text-white',
      'Medium': 'bg-yellow-500 text-white',
      'Low': 'bg-green-500 text-white'
    };
    return colors[energy] || 'bg-gray-500 text-white';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate(getBackRoute())}
            data-testid="back-button"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900" style={{fontFamily: 'Space Grotesk, sans-serif'}}>Data Entries</h1>
            <p className="text-xs sm:text-sm text-gray-500">Production logs & quality records</p>
          </div>
          {user?.role === 'manager' && (
            <Button onClick={() => navigate('/data-entry')} data-testid="add-entry-button">
              Add Entry
            </Button>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" data-testid="stats-cards">
          <Card className="border-0 shadow-md">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Total Entries</p>
                  <p className="text-3xl font-bold text-gray-900">{filteredLogs.length}</p>
                </div>
                <FileText className="w-10 h-10 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Total Production</p>
                  <p className="text-3xl font-bold text-gray-900">{totalProduction.toFixed(0)}<span className="text-lg text-gray-500 ml-1">kg</span></p>
                </div>
                <Package className="w-10 h-10 text-emerald-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Avg Loss</p>
                  <p className="text-3xl font-bold text-gray-900">{avgLoss.toFixed(1)}<span className="text-lg text-gray-500 ml-1">%</span></p>
                </div>
                <TrendingUp className={`w-10 h-10 ${avgLoss > 10 ? 'text-red-600' : 'text-green-600'}`} />
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Issues Reported</p>
                  <p className="text-3xl font-bold text-gray-900">{issuesCount}</p>
                </div>
                <AlertCircle className="w-10 h-10 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter */}
        {user?.role === 'officer' && (
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>Filter</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-w-xs">
                <Select value={filterCooperative} onValueChange={setFilterCooperative}>
                  <SelectTrigger data-testid="cooperative-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Cooperatives</SelectItem>
                    {cooperatives.map(coop => (
                      <SelectItem key={coop.id} value={coop.id}>{coop.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Trend Chart */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Production & Quality Trends</CardTitle>
            <CardDescription>Recent performance over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="period" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                <Legend />
                <Line type="monotone" dataKey="production" stroke="#3b82f6" strokeWidth={2} name="Production (kg)" />
                <Line type="monotone" dataKey="loss" stroke="#ef4444" strokeWidth={2} name="Loss (%)" />
                <Line type="monotone" dataKey="quality" stroke="#10b981" strokeWidth={2} name="Quality A (%)" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Entries List */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Production Entries</CardTitle>
            <CardDescription>{filteredLogs.length} records found</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4" data-testid="entries-list">
              {filteredLogs.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No entries found</p>
              ) : (
                filteredLogs.map((log) => {
                  const coop = cooperatives.find(c => c.id === log.cooperative_id);
                  return (
                    <Card key={log.id} className="border border-gray-200 hover:shadow-md transition-shadow">
                      <CardContent className="pt-6">
                        <div className="space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold text-gray-900">{log.batch_period}</h3>
                                <Badge className={getEnergyColor(log.energy_use)}>
                                  {log.energy_use} Energy
                                </Badge>
                                {log.has_nonconformity && (
                                  <Badge variant="destructive">Has Issue</Badge>
                                )}
                              </div>
                              {coop && (
                                <p className="text-sm text-gray-500">{coop.name}</p>
                              )}
                              <p className="text-xs text-gray-400 mt-1">
                                Date: {new Date(log.date).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <div className="space-y-1">
                              <p className="text-xs text-gray-500">Production</p>
                              <p className="text-lg font-semibold text-gray-900">{log.total_production} kg</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs text-gray-500">Grade A / B</p>
                              <p className="text-lg font-semibold text-gray-900">{log.grade_a_percent}% / {log.grade_b_percent}%</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs text-gray-500">Loss</p>
                              <p className="text-lg font-semibold text-red-600">{log.post_harvest_loss_percent}% ({log.post_harvest_loss_kg.toFixed(1)} kg)</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs text-gray-500">Sellable</p>
                              <p className="text-lg font-semibold text-green-600">{(log.total_production - log.post_harvest_loss_kg).toFixed(1)} kg</p>
                            </div>
                          </div>

                          {log.has_nonconformity && log.nonconformity_description && (
                            <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
                              <p className="text-sm font-semibold text-red-800 mb-1">Issue:</p>
                              <p className="text-sm text-red-700">{log.nonconformity_description}</p>
                              {log.corrective_action && (
                                <>
                                  <p className="text-sm font-semibold text-red-800 mt-2 mb-1">Action Taken:</p>
                                  <p className="text-sm text-red-700">{log.corrective_action}</p>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default DataEntriesView;