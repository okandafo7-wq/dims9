import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Droplets, Thermometer, TrendingUp, MapPin, Sprout, Package } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';

const DigitalTwin = ({ api }) => {
  const navigate = useNavigate();
  const [cooperatives, setCooperatives] = useState([]);
  const [productionLogs, setProductionLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const coopsResponse = await api.get('/cooperatives');
      setCooperatives(coopsResponse.data);
      
      const logsResponse = await api.get('/production-logs');
      setProductionLogs(logsResponse.data);
    } catch (error) {
      toast.error('Failed to load data');
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading farm data...</div>
      </div>
    );
  }

  // Calculate aggregate metrics
  const recentLogs = productionLogs.slice(0, 20);
  const totalProduction = recentLogs.reduce((sum, log) => sum + log.total_production, 0);
  const avgLoss = recentLogs.length > 0 
    ? recentLogs.reduce((sum, log) => sum + log.post_harvest_loss_percent, 0) / recentLogs.length 
    : 0;
  const avgQualityA = recentLogs.length > 0
    ? recentLogs.reduce((sum, log) => sum + log.grade_a_percent, 0) / recentLogs.length
    : 0;

  // Chart data - Production by cooperative
  const productionByCoopData = cooperatives.map(coop => {
    const coopLogs = productionLogs.filter(log => log.cooperative_id === coop.id).slice(0, 10);
    const total = coopLogs.reduce((sum, log) => sum + log.total_production, 0);
    return {
      name: coop.name.split(' ')[0],
      production: total
    };
  });

  // Loss trend over time
  const lossTrendData = recentLogs.slice(0, 10).reverse().map((log, idx) => ({
    period: `P${idx + 1}`,
    loss: log.post_harvest_loss_percent,
    quality: log.grade_a_percent
  }));

  // Quality distribution
  const qualityData = [
    { name: 'Grade A', value: Math.round(avgQualityA), color: '#10b981' },
    { name: 'Grade B', value: Math.round(100 - avgQualityA), color: '#3b82f6' }
  ];

  // Energy usage distribution
  const energyData = [
    { name: 'Low', value: recentLogs.filter(l => l.energy_use === 'Low').length, color: '#10b981' },
    { name: 'Medium', value: recentLogs.filter(l => l.energy_use === 'Medium').length, color: '#f59e0b' },
    { name: 'High', value: recentLogs.filter(l => l.energy_use === 'High').length, color: '#ef4444' }
  ].filter(item => item.value > 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate(-1)}
              data-testid="back-button"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900" style={{fontFamily: 'Space Grotesk, sans-serif'}}>Digital Twin Visualization</h1>
              <p className="text-xs sm:text-sm text-gray-500">Real-time production monitoring & analytics</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" data-testid="digital-twin-stats">
          <Card className="border-0 shadow-md">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Cooperatives</p>
                  <p className="text-3xl font-bold text-gray-900">{cooperatives.length}</p>
                </div>
                <Sprout className="w-10 h-10 text-emerald-600" />
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
                <Package className="w-10 h-10 text-blue-600" />
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
                  <p className="text-sm text-gray-500 mb-1">Avg Quality A</p>
                  <p className="text-3xl font-bold text-gray-900">{avgQualityA.toFixed(1)}<span className="text-lg text-gray-500 ml-1">%</span></p>
                </div>
                <Thermometer className="w-10 h-10 text-teal-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Production by Cooperative</CardTitle>
              <CardDescription>Total production volume</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={productionByCoopData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                  <Legend />
                  <Bar dataKey="production" fill="#10b981" name="Production (kg)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Loss & Quality Trend</CardTitle>
              <CardDescription>Recent performance indicators</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={lossTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="period" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                  <Legend />
                  <Line type="monotone" dataKey="loss" stroke="#ef4444" strokeWidth={3} name="Loss (%)" />
                  <Line type="monotone" dataKey="quality" stroke="#10b981" strokeWidth={3} name="Quality A (%)" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Quality Distribution</CardTitle>
              <CardDescription>Product grade breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={qualityData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {qualityData.map((entry, index) => (
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
              <CardTitle>Energy Usage</CardTitle>
              <CardDescription>Distribution across operations</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={energyData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {energyData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Cooperative Details */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Cooperative Overview</CardTitle>
            <CardDescription>Detailed information about each cooperative</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4" data-testid="coop-list">
              {cooperatives.map((coop) => {
                const coopLogs = productionLogs.filter(log => log.cooperative_id === coop.id).slice(0, 5);
                const coopProduction = coopLogs.reduce((sum, log) => sum + log.total_production, 0);
                const coopAvgLoss = coopLogs.length > 0
                  ? coopLogs.reduce((sum, log) => sum + log.post_harvest_loss_percent, 0) / coopLogs.length
                  : 0;
                const coopAvgQuality = coopLogs.length > 0
                  ? coopLogs.reduce((sum, log) => sum + log.grade_a_percent, 0) / coopLogs.length
                  : 0;

                return (
                  <Card key={coop.id} className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <CardTitle className="text-lg sm:text-xl">{coop.name}</CardTitle>
                          <CardDescription className="flex items-center gap-2 mt-1">
                            <MapPin className="w-4 h-4" />
                            {coop.country} • {coop.product}
                          </CardDescription>
                        </div>
                        <Badge className="bg-green-500 text-white w-fit">
                          {coop.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="space-y-1">
                          <p className="text-xs text-gray-500">Production</p>
                          <p className="text-sm font-semibold text-gray-900">{coopProduction.toFixed(0)} kg</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-gray-500">Avg Loss</p>
                          <p className="text-sm font-semibold text-gray-900">{coopAvgLoss.toFixed(1)}%</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-gray-500">Quality A</p>
                          <p className="text-sm font-semibold text-gray-900">{coopAvgQuality.toFixed(1)}%</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-gray-500">Records</p>
                          <p className="text-sm font-semibold text-gray-900">{coopLogs.length}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default DigitalTwin;