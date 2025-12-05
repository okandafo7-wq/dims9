import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Droplets, Thermometer, Gauge, TrendingUp, MapPin, Sprout } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';

const DigitalTwin = ({ api }) => {
  const navigate = useNavigate();
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFarms();
  }, []);

  const loadFarms = async () => {
    try {
      const response = await api.get('/farms');
      if (response.data.length === 0) {
        // Initialize dummy data
        await api.post('/init-data');
        const newResponse = await api.get('/farms');
        setFarms(newResponse.data);
        toast.success('Sample farm data loaded');
      } else {
        setFarms(response.data);
      }
    } catch (error) {
      toast.error('Failed to load farm data');
    }
    setLoading(false);
  };

  // Chart data
  const temperatureData = farms.map(farm => ({
    name: farm.farm_name.split(' ')[0],
    temperature: farm.temperature,
    humidity: farm.humidity
  }));

  const yieldData = farms.map(farm => ({
    name: farm.farm_name.split(' ')[0],
    yield: farm.predicted_yield,
    area: farm.area_hectares
  }));

  const healthStatusData = [
    { name: 'Excellent', value: farms.filter(f => f.health_status === 'Excellent').length, color: '#10b981' },
    { name: 'Good', value: farms.filter(f => f.health_status === 'Good').length, color: '#3b82f6' },
    { name: 'Fair', value: farms.filter(f => f.health_status === 'Fair').length, color: '#f59e0b' },
    { name: 'Poor', value: farms.filter(f => f.health_status === 'Poor').length, color: '#ef4444' }
  ].filter(item => item.value > 0);

  const getHealthColor = (status) => {
    const colors = {
      'Excellent': 'bg-green-500',
      'Good': 'bg-blue-500',
      'Fair': 'bg-yellow-500',
      'Poor': 'bg-red-500'
    };
    return colors[status] || 'bg-gray-500';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading farm data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate('/dashboard')}
              data-testid="back-to-dashboard-button"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900" style={{fontFamily: 'Space Grotesk, sans-serif'}}>Digital Twin Visualization</h1>
              <p className="text-xs sm:text-sm text-gray-500">Real-time farm monitoring & analytics</p>
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
                  <p className="text-sm text-gray-500 mb-1">Total Farms</p>
                  <p className="text-3xl font-bold text-gray-900">{farms.length}</p>
                </div>
                <Sprout className="w-10 h-10 text-emerald-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Total Area</p>
                  <p className="text-3xl font-bold text-gray-900">{farms.reduce((sum, f) => sum + f.area_hectares, 0).toFixed(1)}<span className="text-lg text-gray-500 ml-1">ha</span></p>
                </div>
                <MapPin className="w-10 h-10 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Avg Temperature</p>
                  <p className="text-3xl font-bold text-gray-900">{(farms.reduce((sum, f) => sum + f.temperature, 0) / farms.length).toFixed(1)}<span className="text-lg text-gray-500 ml-1">°C</span></p>
                </div>
                <Thermometer className="w-10 h-10 text-orange-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Total Yield</p>
                  <p className="text-3xl font-bold text-gray-900">{(farms.reduce((sum, f) => sum + f.predicted_yield, 0) / 1000).toFixed(1)}<span className="text-lg text-gray-500 ml-1">t</span></p>
                </div>
                <TrendingUp className="w-10 h-10 text-teal-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Environmental Parameters</CardTitle>
              <CardDescription>Temperature and humidity across farms</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={temperatureData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                  <Legend />
                  <Line type="monotone" dataKey="temperature" stroke="#f97316" strokeWidth={3} name="Temperature (°C)" />
                  <Line type="monotone" dataKey="humidity" stroke="#3b82f6" strokeWidth={3} name="Humidity (%)" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Predicted Yield</CardTitle>
              <CardDescription>Estimated crop yield by farm</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={yieldData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                  <Legend />
                  <Bar dataKey="yield" fill="#10b981" name="Yield (kg)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Farm Health Status</CardTitle>
              <CardDescription>Distribution of crop health across farms</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={healthStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {healthStatusData.map((entry, index) => (
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
              <CardTitle>Soil Moisture Levels</CardTitle>
              <CardDescription>Current soil moisture by farm</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={farms.map(f => ({ name: f.farm_name.split(' ')[0], moisture: f.soil_moisture }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                  <Legend />
                  <Bar dataKey="moisture" fill="#06b6d4" name="Moisture (%)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Farm Details */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Farm Details</CardTitle>
            <CardDescription>Comprehensive information about each farm</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4" data-testid="farm-list">
              {farms.map((farm, index) => (
                <Card key={farm.id} className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <CardTitle className="text-lg sm:text-xl">{farm.farm_name}</CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1">
                          <MapPin className="w-4 h-4" />
                          {farm.location}
                        </CardDescription>
                      </div>
                      <Badge className={`${getHealthColor(farm.health_status)} text-white w-fit`}>
                        {farm.health_status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                      <div className="space-y-1">
                        <p className="text-xs text-gray-500">Crop Type</p>
                        <p className="text-sm font-semibold text-gray-900">{farm.crop_type}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-gray-500">Growth Stage</p>
                        <p className="text-sm font-semibold text-gray-900">{farm.growth_stage}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-gray-500">Area</p>
                        <p className="text-sm font-semibold text-gray-900">{farm.area_hectares} ha</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-gray-500 flex items-center gap-1"><Thermometer className="w-3 h-3" /> Temp</p>
                        <p className="text-sm font-semibold text-gray-900">{farm.temperature}°C</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-gray-500 flex items-center gap-1"><Droplets className="w-3 h-3" /> Humidity</p>
                        <p className="text-sm font-semibold text-gray-900">{farm.humidity}%</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-gray-500 flex items-center gap-1"><Gauge className="w-3 h-3" /> Moisture</p>
                        <p className="text-sm font-semibold text-gray-900">{farm.soil_moisture}%</p>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Predicted Yield:</span>
                        <span className="text-lg font-bold text-emerald-600">{farm.predicted_yield.toLocaleString()} kg</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default DigitalTwin;