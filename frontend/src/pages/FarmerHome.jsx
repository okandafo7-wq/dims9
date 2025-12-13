import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, Plus, TrendingUp, Package, Users, BookOpen, DollarSign, Calendar, BarChart3, Leaf, Award } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';

const FarmerHome = ({ user, setUser, api }) => {
  const navigate = useNavigate();
  const [cooperative, setCooperative] = useState(null);
  const [myProduction, setMyProduction] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Get cooperative info
      if (user?.cooperative_id) {
        const coopResponse = await api.get(`/cooperatives/${user.cooperative_id}`);
        setCooperative(coopResponse.data);
      }

      // Get farmer's production logs (simulated - in reality would filter by farmer_id)
      const logsResponse = await api.get('/production-logs');
      const farmerLogs = logsResponse.data.filter(log => log.cooperative_id === user?.cooperative_id).slice(0, 7);
      setMyProduction(farmerLogs);
    } catch (error) {
      toast.error('Failed to load data');
    }
    setLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    navigate('/login');
    toast.success('Logged out successfully');
  };

  const calculateStats = () => {
    if (myProduction.length === 0) return { total: 0, avgQuality: 0, avgLoss: 0 };
    
    const total = myProduction.reduce((sum, log) => sum + log.total_production, 0);
    const avgQuality = myProduction.reduce((sum, log) => sum + log.grade_a_percent, 0) / myProduction.length;
    const avgLoss = myProduction.reduce((sum, log) => sum + log.post_harvest_loss_percent, 0) / myProduction.length;
    
    return { total, avgQuality, avgLoss };
  };

  const stats = calculateStats();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900" style={{fontFamily: 'Space Grotesk, sans-serif'}}>🌾 Farmer Portal</h1>
            <p className="text-xs sm:text-sm text-gray-500">{cooperative?.name}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-500">Farmer</p>
            </div>
            <Avatar className="h-12 w-12 border-2 border-green-500 shadow-lg">
              <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=farmer&backgroundColor=d1fae5&clothing=hoodie&clothingColor=059669&top=shortHairShortFlat" alt={user?.name} />
              <AvatarFallback className="bg-green-100 text-green-700 font-semibold">
                {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Quick Actions */}
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => navigate('/data-entry')} className="bg-green-600 hover:bg-green-700">
            <Plus className="w-4 h-4 mr-2" />
            Log Production
          </Button>
          <Button variant="outline" onClick={() => navigate('/farmer-community')}>
            <Users className="w-4 h-4 mr-2" />
            Community
          </Button>
          <Button variant="outline" onClick={() => navigate('/data-entries')}>
            <Package className="w-4 h-4 mr-2" />
            My History
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-emerald-600 text-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-green-100 mb-1">Total Production</p>
                  <p className="text-4xl font-bold">{stats.total.toFixed(0)} kg</p>
                  <p className="text-xs text-green-100 mt-2">Last 7 entries</p>
                </div>
                <Package className="w-12 h-12 text-green-100" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-blue-100 mb-1">Avg Quality (Grade A)</p>
                  <p className="text-4xl font-bold">{stats.avgQuality.toFixed(1)}%</p>
                  <p className="text-xs text-blue-100 mt-2">Keep up the good work!</p>
                </div>
                <Award className="w-12 h-12 text-blue-100" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-500 to-red-600 text-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-orange-100 mb-1">Avg Loss</p>
                  <p className="text-4xl font-bold">{stats.avgLoss.toFixed(1)}%</p>
                  <p className="text-xs text-orange-100 mt-2">Target: Below 5%</p>
                </div>
                <TrendingUp className="w-12 h-12 text-orange-100" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Production Trend */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>My Production Trend</CardTitle>
            <CardDescription>Last 7 entries</CardDescription>
          </CardHeader>
          <CardContent>
            {myProduction.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={myProduction}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="total_production" stroke="#10b981" strokeWidth={2} name="Production (kg)" />
                  <Line type="monotone" dataKey="grade_a_percent" stroke="#3b82f6" strokeWidth={2} name="Grade A (%)" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-gray-500 py-8">No production data yet. Start logging your harvests!</p>
            )}
          </CardContent>
        </Card>

        {/* Training & Market Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Training */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-green-600" />
                Training & Guidelines
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h4 className="font-semibold text-green-900 mb-2">Quality Standards (ISO 9001)</h4>
                <ul className="text-sm text-green-800 space-y-1 list-disc list-inside">
                  <li>Sort produce by size and color</li>
                  <li>Remove damaged or diseased items</li>
                  <li>Store in clean, dry containers</li>
                  <li>Label with harvest date and grade</li>
                </ul>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-2">Post-Harvest Best Practices</h4>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                  <li>Harvest early morning for freshness</li>
                  <li>Handle gently to prevent bruising</li>
                  <li>Cool produce quickly after harvest</li>
                  <li>Clean and sanitize storage areas</li>
                </ul>
              </div>
              <Button variant="outline" className="w-full" onClick={() => navigate('/iso-compliance')}>
                View Full ISO Guidelines
              </Button>
            </CardContent>
          </Card>

          {/* Market Info */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-blue-600" />
                Market Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-4 rounded-lg">
                <p className="text-sm font-semibold mb-1">Current Price</p>
                <p className="text-3xl font-bold">$3.50/kg</p>
                <p className="text-xs text-green-100 mt-1">Grade A Quality</p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Grade B</span>
                  <span className="text-lg font-bold text-gray-900">$2.80/kg</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Grade C</span>
                  <span className="text-lg font-bold text-gray-900">$2.00/kg</span>
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                <p className="text-xs font-semibold text-blue-900 mb-1">💡 Quality Tip</p>
                <p className="text-xs text-blue-800">Improving quality from Grade B to A can increase earnings by 25%!</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Tasks */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-600" />
              Upcoming Tasks & Reminders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                <Calendar className="w-5 h-5 text-purple-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-purple-900 text-sm">ISO 9001 Quality Training</p>
                  <p className="text-xs text-purple-700">Friday, Dec 15 • 10:00 AM</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                <Leaf className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-green-900 text-sm">Environmental Safety Briefing</p>
                  <p className="text-xs text-green-700">Monday, Dec 18 • 2:00 PM</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <Award className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-yellow-900 text-sm">Annual Certification Audit</p>
                  <p className="text-xs text-yellow-700">Tuesday, Dec 20 • All Day</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default FarmerHome;
