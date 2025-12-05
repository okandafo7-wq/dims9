import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, AlertCircle, CheckCircle, Clock, Filter } from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';

const IssuesManagement = ({ user, setUser, api }) => {
  const navigate = useNavigate();
  const [nonconformities, setNonconformities] = useState([]);
  const [cooperatives, setCooperatives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCooperative, setFilterCooperative] = useState('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const ncsResponse = await api.get('/nonconformities');
      setNonconformities(ncsResponse.data);
      
      const coopsResponse = await api.get('/cooperatives');
      setCooperatives(coopsResponse.data);
    } catch (error) {
      toast.error('Failed to load issues');
    }
    setLoading(false);
  };

  const handleStatusUpdate = async (ncId, newStatus, assignedTo = null) => {
    try {
      let url = `/nonconformities/${ncId}?status=${newStatus}`;
      if (assignedTo !== null) {
        url += `&assigned_to=${assignedTo}`;
      }
      await api.patch(url);
      toast.success('Status updated successfully');
      loadData();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const getBackRoute = () => {
    return user?.role === 'officer' ? '/overview' : '/home';
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  // Filter nonconformities
  const filteredNCs = nonconformities.filter(nc => {
    if (filterStatus !== 'all' && nc.status !== filterStatus) return false;
    if (filterCooperative !== 'all' && nc.cooperative_id !== filterCooperative) return false;
    if (user?.role === 'manager' && user.cooperative_id && nc.cooperative_id !== user.cooperative_id) return false;
    return true;
  });

  // Calculate statistics
  const openCount = filteredNCs.filter(nc => nc.status === 'open').length;
  const inProgressCount = filteredNCs.filter(nc => nc.status === 'in_progress').length;
  const closedCount = filteredNCs.filter(nc => nc.status === 'closed').length;

  // By category
  const categoryData = [
    { name: 'Quality', value: filteredNCs.filter(nc => nc.category === 'quality').length, color: '#3b82f6' },
    { name: 'Safety', value: filteredNCs.filter(nc => nc.category === 'safety').length, color: '#f59e0b' },
    { name: 'Environmental', value: filteredNCs.filter(nc => nc.category === 'environmental').length, color: '#10b981' }
  ].filter(item => item.value > 0);

  // By severity
  const severityData = [
    { name: 'High', value: filteredNCs.filter(nc => nc.severity === 'high').length, color: '#ef4444' },
    { name: 'Medium', value: filteredNCs.filter(nc => nc.severity === 'medium').length, color: '#f59e0b' },
    { name: 'Low', value: filteredNCs.filter(nc => nc.severity === 'low').length, color: '#10b981' }
  ].filter(item => item.value > 0);

  // Status distribution
  const statusData = [
    { status: 'Open', count: openCount },
    { status: 'In Progress', count: inProgressCount },
    { status: 'Closed', count: closedCount }
  ];

  const getStatusColor = (status) => {
    const colors = {
      'open': 'bg-red-100 text-red-700',
      'in_progress': 'bg-yellow-100 text-yellow-700',
      'closed': 'bg-green-100 text-green-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getSeverityColor = (severity) => {
    const colors = {
      'high': 'bg-red-500',
      'medium': 'bg-yellow-500',
      'low': 'bg-green-500'
    };
    return colors[severity] || 'bg-gray-500';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50 to-orange-50">
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
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900" style={{fontFamily: 'Space Grotesk, sans-serif'}}>Issues Management</h1>
            <p className="text-xs sm:text-sm text-gray-500">Nonconformities tracking & analysis</p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" data-testid="stats-cards">
          <Card className="border-0 shadow-md">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Total Issues</p>
                  <p className="text-3xl font-bold text-gray-900">{filteredNCs.length}</p>
                </div>
                <AlertCircle className="w-10 h-10 text-gray-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-600 mb-1">Open</p>
                  <p className="text-3xl font-bold text-red-700">{openCount}</p>
                </div>
                <AlertCircle className="w-10 h-10 text-red-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md bg-yellow-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-yellow-600 mb-1">In Progress</p>
                  <p className="text-3xl font-bold text-yellow-700">{inProgressCount}</p>
                </div>
                <Clock className="w-10 h-10 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 mb-1">Closed</p>
                  <p className="text-3xl font-bold text-green-700">{closedCount}</p>
                </div>
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger data-testid="status-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {user?.role === 'officer' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Cooperative</label>
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
              )}
            </div>
          </CardContent>
        </Card>

        {/* Charts */}
        <div className="grid lg:grid-cols-3 gap-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={statusData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="status" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>By Category</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>By Severity</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={severityData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {severityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Issues List */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Issues List</CardTitle>
            <CardDescription>{filteredNCs.length} issues found</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4" data-testid="issues-list">
              {filteredNCs.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No issues found</p>
              ) : (
                filteredNCs.map((nc) => {
                  const coop = cooperatives.find(c => c.id === nc.cooperative_id);
                  return (
                    <Card key={nc.id} className="border border-gray-200 hover:shadow-md transition-shadow">
                      <CardContent className="pt-6">
                        <div className="space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <div className={`w-3 h-3 rounded-full ${getSeverityColor(nc.severity)}`}></div>
                                <span className="text-sm font-semibold text-gray-700 capitalize">{nc.severity} Severity</span>
                                <Badge variant="outline" className="capitalize">{nc.category}</Badge>
                              </div>
                              <h3 className="font-semibold text-gray-900">{nc.description}</h3>
                              {coop && (
                                <p className="text-sm text-gray-500 mt-1">{coop.name}</p>
                              )}
                              <p className="text-xs text-gray-400 mt-1">
                                Reported: {new Date(nc.date).toLocaleDateString()}
                              </p>
                            </div>
                            <Badge className={getStatusColor(nc.status)}>
                              {nc.status.replace('_', ' ').toUpperCase()}
                            </Badge>
                          </div>
                          
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-sm font-semibold text-gray-700 mb-1">Corrective Action:</p>
                            <p className="text-sm text-gray-600">{nc.corrective_action}</p>
                          </div>

                          {nc.status !== 'closed' && (
                            <div className="flex gap-2">
                              {nc.status === 'open' && (
                                <Button 
                                  size="sm" 
                                  onClick={() => handleStatusUpdate(nc.id, 'in_progress')}
                                  data-testid={`start-${nc.id}`}
                                >
                                  Start Working
                                </Button>
                              )}
                              {nc.status === 'in_progress' && (
                                <Button 
                                  size="sm" 
                                  className="bg-green-600 hover:bg-green-700"
                                  onClick={() => handleStatusUpdate(nc.id, 'closed')}
                                  data-testid={`close-${nc.id}`}
                                >
                                  Mark as Closed
                                </Button>
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

export default IssuesManagement;