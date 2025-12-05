import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Leaf, Users, Shield, TrendingUp, Award, AlertCircle } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';

const ESGReporting = ({ api }) => {
  const navigate = useNavigate();
  const [cooperatives, setCooperatives] = useState([]);
  const [productionLogs, setProductionLogs] = useState([]);
  const [nonconformities, setNonconformities] = useState([]);
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
      
      const ncsResponse = await api.get('/nonconformities');
      setNonconformities(ncsResponse.data);
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

  // Calculate metrics
  const recentLogs = productionLogs.slice(0, 20);
  const totalProduction = recentLogs.reduce((sum, log) => sum + log.total_production, 0);
  const avgLoss = recentLogs.length > 0
    ? recentLogs.reduce((sum, log) => sum + log.post_harvest_loss_percent, 0) / recentLogs.length
    : 0;
  const openIssues = nonconformities.filter(nc => nc.status === 'open' || nc.status === 'in_progress').length;
  const closedIssues = nonconformities.filter(nc => nc.status === 'closed').length;
  const complianceRate = nonconformities.length > 0
    ? (closedIssues / nonconformities.length) * 100
    : 100;

  // Environmental trend
  const environmentalTrend = recentLogs.slice(0, 10).reverse().map((log, idx) => ({
    period: `P${idx + 1}`,
    loss: log.post_harvest_loss_percent,
    energy: log.energy_use === 'High' ? 3 : log.energy_use === 'Medium' ? 2 : 1
  }));

  // Social metrics trend (simulated)
  const socialTrend = [
    { period: 'Q1', employment: 48, training: 156, income: 18.5 },
    { period: 'Q2', employment: 52, training: 178, income: 22.0 },
    { period: 'Q3', employment: 58, training: 192, income: 25.5 }
  ];

  // Governance - ISO compliance (simulated)
  const isoCompliance = [
    { subject: 'Quality\n(ISO 9001)', score: 87 },
    { subject: 'Environment\n(ISO 14001)', score: 85 },
    { subject: 'Safety\n(ISO 45001)', score: 90 },
    { subject: 'Compliance\nRate', score: complianceRate }
  ];

  // Nonconformity breakdown
  const ncByCategory = [
    { name: 'Quality', value: nonconformities.filter(nc => nc.category === 'quality').length, color: '#3b82f6' },
    { name: 'Safety', value: nonconformities.filter(nc => nc.category === 'safety').length, color: '#f59e0b' },
    { name: 'Environmental', value: nonconformities.filter(nc => nc.category === 'environmental').length, color: '#10b981' }
  ].filter(item => item.value > 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-50">
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
                  <p className="text-sm text-gray-600 mb-1">Cooperatives</p>
                  <p className="text-3xl font-bold text-gray-900">{cooperatives.length}</p>
                  <p className="text-xs text-blue-600 mt-1">Active</p>
                </div>
                <Users className="w-10 h-10 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md bg-gradient-to-br from-emerald-50 to-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Avg Loss</p>
                  <p className="text-3xl font-bold text-gray-900">{avgLoss.toFixed(1)}%</p>
                  <p className="text-xs text-emerald-600 mt-1">Environmental</p>
                </div>
                <Leaf className="w-10 h-10 text-emerald-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md bg-gradient-to-br from-yellow-50 to-orange-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Open Issues</p>
                  <p className="text-3xl font-bold text-gray-900">{openIssues}</p>
                  <p className="text-xs text-orange-600 mt-1">Governance</p>
                </div>
                <AlertCircle className="w-10 h-10 text-orange-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md bg-gradient-to-br from-purple-50 to-pink-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Compliance</p>
                  <p className="text-3xl font-bold text-gray-900">{complianceRate.toFixed(0)}%</p>
                  <p className="text-xs text-purple-600 mt-1">Rate</p>
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
                  <CardTitle>Environmental Performance</CardTitle>
                  <CardDescription>Loss and energy usage trends</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={environmentalTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="period" stroke="#6b7280" />
                      <YAxis stroke="#6b7280" />
                      <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                      <Legend />
                      <Line type="monotone" dataKey="loss" stroke="#ef4444" strokeWidth={2} name="Loss (%)" />
                      <Line type="monotone" dataKey="energy" stroke="#f59e0b" strokeWidth={2} name="Energy Level" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>Environmental Impact</CardTitle>
                  <CardDescription>Key sustainability indicators</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-700">Post-Harvest Loss Reduction</span>
                        <Badge className="bg-green-100 text-green-700">{avgLoss < 12 ? 'Good' : 'Needs Improvement'}</Badge>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div className="bg-green-600 h-3 rounded-full" style={{ width: `${Math.max(0, 100 - (avgLoss * 5))}%` }}></div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-700">Energy Efficiency</span>
                        <Badge className="bg-blue-100 text-blue-700">Moderate</Badge>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div className="bg-blue-600 h-3 rounded-full" style={{ width: '65%' }}></div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-700">Waste Management</span>
                        <Badge className="bg-emerald-100 text-emerald-700">Good</Badge>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div className="bg-emerald-600 h-3 rounded-full" style={{ width: '75%' }}></div>
                      </div>
                    </div>

                    <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-lg mt-4">
                      <p className="text-sm text-emerald-800">
                        <strong>Total Production:</strong> {totalProduction.toFixed(0)} kg across {cooperatives.length} cooperatives
                      </p>
                      <p className="text-sm text-emerald-800 mt-2">
                        <strong>Avg Loss:</strong> {avgLoss.toFixed(1)}% - Potential savings of {(totalProduction * avgLoss / 100).toFixed(0)} kg
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Social Tab */}
          <TabsContent value="social" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>Social Impact Trends</CardTitle>
                  <CardDescription>Women employment and training progress</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={socialTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="period" stroke="#6b7280" />
                      <YAxis stroke="#6b7280" />
                      <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                      <Legend />
                      <Line type="monotone" dataKey="employment" stroke="#8b5cf6" strokeWidth={2} name="Women Employed" />
                      <Line type="monotone" dataKey="training" stroke="#3b82f6" strokeWidth={2} name="Training Hours" />
                      <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} name="Income Growth (%)" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>Social Metrics</CardTitle>
                  <CardDescription>Current quarter achievements</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-purple-600">
                        <Users className="w-5 h-5" />
                        <span className="text-sm font-semibold">Women Employed</span>
                      </div>
                      <p className="text-2xl font-bold text-gray-900">58</p>
                      <p className="text-xs text-gray-500">+21% growth from Q1</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-blue-600">
                        <Award className="w-5 h-5" />
                        <span className="text-sm font-semibold">Training Hours</span>
                      </div>
                      <p className="text-2xl font-bold text-gray-900">192</p>
                      <p className="text-xs text-gray-500">Capacity building programs</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-emerald-600">
                        <TrendingUp className="w-5 h-5" />
                        <span className="text-sm font-semibold">Income Growth</span>
                      </div>
                      <p className="text-2xl font-bold text-gray-900">25.5%</p>
                      <p className="text-xs text-gray-500">Compared to previous quarter</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Governance Tab */}
          <TabsContent value="governance" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>ISO Compliance</CardTitle>
                  <CardDescription>Standards performance overview</CardDescription>
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
                  <CardTitle>Nonconformities</CardTitle>
                  <CardDescription>Issues tracking and resolution</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-red-50 p-4 rounded-lg text-center">
                        <p className="text-2xl font-bold text-red-600">{openIssues}</p>
                        <p className="text-xs text-red-700 mt-1">Open</p>
                      </div>
                      <div className="bg-yellow-50 p-4 rounded-lg text-center">
                        <p className="text-2xl font-bold text-yellow-600">{nonconformities.filter(nc => nc.status === 'in_progress').length}</p>
                        <p className="text-xs text-yellow-700 mt-1">In Progress</p>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg text-center">
                        <p className="text-2xl font-bold text-green-600">{closedIssues}</p>
                        <p className="text-xs text-green-700 mt-1">Closed</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-semibold text-sm text-gray-900">By Category</h4>
                      {ncByCategory.map((cat, idx) => (
                        <div key={idx} className="flex items-center justify-between">
                          <span className="text-sm text-gray-700">{cat.name}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-32 bg-gray-200 rounded-full h-2">
                              <div 
                                className="h-2 rounded-full" 
                                style={{ 
                                  width: `${(cat.value / nonconformities.length) * 100}%`,
                                  backgroundColor: cat.color
                                }}
                              ></div>
                            </div>
                            <span className="text-sm font-semibold text-gray-900 w-8">{cat.value}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg mt-4">
                      <p className="text-sm font-semibold text-purple-900">Compliance Rate</p>
                      <p className="text-3xl font-bold text-purple-900 mt-2">{complianceRate.toFixed(0)}%</p>
                      <p className="text-xs text-purple-700 mt-1">{closedIssues} of {nonconformities.length} issues resolved</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default ESGReporting;
