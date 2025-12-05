import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Droplets, Leaf, Users, Shield, TrendingUp, Award } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';

const ESGReporting = ({ api }) => {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      const response = await api.get('/esg');
      if (response.data.length === 0) {
        await api.post('/init-data');
        const newResponse = await api.get('/esg');
        setMetrics(newResponse.data);
        toast.success('Sample ESG data loaded');
      } else {
        setMetrics(response.data);
      }
    } catch (error) {
      toast.error('Failed to load ESG data');
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading ESG data...</div>
      </div>
    );
  }

  const latestMetric = metrics[metrics.length - 1] || {};

  // Chart data
  const environmentalTrend = metrics.map(m => ({
    period: m.period,
    water: m.water_usage / 1000,
    carbon: m.carbon_footprint,
    waste: m.waste_reduced
  }));

  const socialTrend = metrics.map(m => ({
    period: m.period,
    women: m.women_employed,
    training: m.training_hours,
    income: m.income_growth
  }));

  const isoCompliance = [
    { subject: 'ISO 9001\n(Quality)', score: latestMetric.iso9001_score },
    { subject: 'ISO 14001\n(Environment)', score: latestMetric.iso14001_score },
    { subject: 'ISO 45001\n(Safety)', score: latestMetric.iso45001_score },
    { subject: 'Audit\nCompliance', score: latestMetric.audit_compliance }
  ];

  const sustainabilityMetrics = [
    { name: 'Renewable Energy', value: latestMetric.renewable_energy },
    { name: 'Waste Reduction', value: (latestMetric.waste_reduced / 500) * 100 },
    { name: 'Water Efficiency', value: 100 - (latestMetric.water_usage / 1500) },
    { name: 'Carbon Reduction', value: 100 - (latestMetric.carbon_footprint / 10) }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-50">
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
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900" style={{fontFamily: 'Space Grotesk, sans-serif'}}>ESG Reporting</h1>
              <p className="text-xs sm:text-sm text-gray-500">Environmental, Social & Governance metrics</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" data-testid="esg-key-metrics">
          <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-cyan-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Women Employed</p>
                  <p className="text-3xl font-bold text-gray-900">{latestMetric.women_employed}</p>
                  <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    Growing
                  </p>
                </div>
                <Users className="w-10 h-10 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md bg-gradient-to-br from-emerald-50 to-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Income Growth</p>
                  <p className="text-3xl font-bold text-gray-900">{latestMetric.income_growth}%</p>
                  <p className="text-xs text-emerald-600 mt-1">This Quarter</p>
                </div>
                <TrendingUp className="w-10 h-10 text-emerald-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md bg-gradient-to-br from-teal-50 to-cyan-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Renewable Energy</p>
                  <p className="text-3xl font-bold text-gray-900">{latestMetric.renewable_energy}%</p>
                  <p className="text-xs text-teal-600 mt-1">of Total</p>
                </div>
                <Leaf className="w-10 h-10 text-teal-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md bg-gradient-to-br from-purple-50 to-pink-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Avg ISO Score</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {((latestMetric.iso9001_score + latestMetric.iso14001_score + latestMetric.iso45001_score) / 3).toFixed(0)}
                  </p>
                  <p className="text-xs text-purple-600 mt-1">Compliance</p>
                </div>
                <Award className="w-10 h-10 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for different ESG categories */}
        <Tabs defaultValue="environmental" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
            <TabsTrigger value="environmental" data-testid="environmental-tab">
              <Leaf className="w-4 h-4 mr-2" />
              Environmental
            </TabsTrigger>
            <TabsTrigger value="social" data-testid="social-tab">
              <Users className="w-4 h-4 mr-2" />
              Social
            </TabsTrigger>
            <TabsTrigger value="governance" data-testid="governance-tab">
              <Shield className="w-4 h-4 mr-2" />
              Governance
            </TabsTrigger>
          </TabsList>

          {/* Environmental Tab */}
          <TabsContent value="environmental" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>Environmental Trends</CardTitle>
                  <CardDescription>Water usage, carbon footprint, and waste reduction over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={environmentalTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="period" stroke="#6b7280" />
                      <YAxis stroke="#6b7280" />
                      <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                      <Legend />
                      <Line type="monotone" dataKey="water" stroke="#06b6d4" strokeWidth={2} name="Water (k liters)" />
                      <Line type="monotone" dataKey="carbon" stroke="#f97316" strokeWidth={2} name="Carbon (kg CO2)" />
                      <Line type="monotone" dataKey="waste" stroke="#10b981" strokeWidth={2} name="Waste Reduced (kg)" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>Sustainability Metrics</CardTitle>
                  <CardDescription>Current performance indicators</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={sustainabilityMetrics} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis type="number" domain={[0, 100]} stroke="#6b7280" />
                      <YAxis dataKey="name" type="category" width={120} stroke="#6b7280" />
                      <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                      <Bar dataKey="value" fill="#10b981" radius={[0, 8, 8, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Environmental Impact Details</CardTitle>
                <CardDescription>Latest quarter performance - {latestMetric.period}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-cyan-600">
                      <Droplets className="w-5 h-5" />
                      <span className="text-sm font-semibold">Water Usage</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{latestMetric.water_usage?.toLocaleString()} L</p>
                    <p className="text-xs text-gray-500">Total consumption this quarter</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-orange-600">
                      <Leaf className="w-5 h-5" />
                      <span className="text-sm font-semibold">Carbon Footprint</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{latestMetric.carbon_footprint} kg</p>
                    <p className="text-xs text-gray-500">CO2 emissions</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-green-600">
                      <Leaf className="w-5 h-5" />
                      <span className="text-sm font-semibold">Waste Reduced</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{latestMetric.waste_reduced} kg</p>
                    <p className="text-xs text-gray-500">Recycled and composted</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-emerald-600">
                      <Leaf className="w-5 h-5" />
                      <span className="text-sm font-semibold">Renewable Energy</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{latestMetric.renewable_energy}%</p>
                    <p className="text-xs text-gray-500">Solar and wind power</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Social Tab */}
          <TabsContent value="social" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>Social Impact Trends</CardTitle>
                  <CardDescription>Women employment, training, and income growth</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={socialTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="period" stroke="#6b7280" />
                      <YAxis stroke="#6b7280" />
                      <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                      <Legend />
                      <Line type="monotone" dataKey="women" stroke="#8b5cf6" strokeWidth={2} name="Women Employed" />
                      <Line type="monotone" dataKey="training" stroke="#3b82f6" strokeWidth={2} name="Training Hours" />
                      <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} name="Income Growth (%)" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>Women Employment Growth</CardTitle>
                  <CardDescription>Quarterly comparison</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={socialTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="period" stroke="#6b7280" />
                      <YAxis stroke="#6b7280" />
                      <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                      <Legend />
                      <Bar dataKey="women" fill="#8b5cf6" name="Women Employed" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Social Metrics Details</CardTitle>
                <CardDescription>Latest quarter performance - {latestMetric.period}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-purple-600">
                      <Users className="w-5 h-5" />
                      <span className="text-sm font-semibold">Women Employed</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{latestMetric.women_employed}</p>
                    <p className="text-xs text-gray-500">Active workers in cooperatives</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-blue-600">
                      <Award className="w-5 h-5" />
                      <span className="text-sm font-semibold">Training Hours</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{latestMetric.training_hours}</p>
                    <p className="text-xs text-gray-500">Capacity building programs</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-emerald-600">
                      <TrendingUp className="w-5 h-5" />
                      <span className="text-sm font-semibold">Income Growth</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{latestMetric.income_growth}%</p>
                    <p className="text-xs text-gray-500">Compared to last quarter</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Governance Tab */}
          <TabsContent value="governance" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>ISO Compliance Scores</CardTitle>
                  <CardDescription>Current performance across ISO standards</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={350}>
                    <RadarChart data={isoCompliance}>
                      <PolarGrid stroke="#e5e7eb" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#6b7280', fontSize: 12 }} />
                      <PolarRadiusAxis angle={90} domain={[0, 100]} />
                      <Radar name="Score" dataKey="score" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>ISO Scores Trend</CardTitle>
                  <CardDescription>Quarterly improvement across standards</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={350}>
                    <LineChart data={metrics.map(m => ({
                      period: m.period,
                      iso9001: m.iso9001_score,
                      iso14001: m.iso14001_score,
                      iso45001: m.iso45001_score
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="period" stroke="#6b7280" />
                      <YAxis domain={[70, 100]} stroke="#6b7280" />
                      <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                      <Legend />
                      <Line type="monotone" dataKey="iso9001" stroke="#3b82f6" strokeWidth={2} name="ISO 9001" />
                      <Line type="monotone" dataKey="iso14001" stroke="#10b981" strokeWidth={2} name="ISO 14001" />
                      <Line type="monotone" dataKey="iso45001" stroke="#f59e0b" strokeWidth={2} name="ISO 45001" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Governance Details</CardTitle>
                <CardDescription>Latest quarter performance - {latestMetric.period}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-700">ISO 9001 - Quality</span>
                      <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">{latestMetric.iso9001_score}/100</Badge>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${latestMetric.iso9001_score}%` }}></div>
                    </div>
                    <p className="text-xs text-gray-500">Quality Management System</p>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-700">ISO 14001 - Environment</span>
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100">{latestMetric.iso14001_score}/100</Badge>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-600 h-2 rounded-full" style={{ width: `${latestMetric.iso14001_score}%` }}></div>
                    </div>
                    <p className="text-xs text-gray-500">Environmental Management</p>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-700">ISO 45001 - Safety</span>
                      <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">{latestMetric.iso45001_score}/100</Badge>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-amber-600 h-2 rounded-full" style={{ width: `${latestMetric.iso45001_score}%` }}></div>
                    </div>
                    <p className="text-xs text-gray-500">Occupational Health & Safety</p>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-700">Audit Compliance</span>
                      <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">{latestMetric.audit_compliance}%</Badge>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-purple-600 h-2 rounded-full" style={{ width: `${latestMetric.audit_compliance}%` }}></div>
                    </div>
                    <p className="text-xs text-gray-500">Overall Compliance Rate</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default ESGReporting;