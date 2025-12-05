import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogOut, Plus, BarChart3, Calculator, TrendingUp, AlertCircle, Package, FileText, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

const ManagerHome = ({ user, setUser, api }) => {
  const navigate = useNavigate();
  const [cooperative, setCooperative] = useState(null);
  const [kpis, setKpis] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load cooperative details
      const coopResponse = await api.get(`/cooperatives/${user.cooperative_id}`);
      setCooperative(coopResponse.data);
      
      // Load KPIs
      const kpiResponse = await api.get(`/kpis/cooperative/${user.cooperative_id}`);
      setKpis(kpiResponse.data);
    } catch (error) {
      toast.error('Failed to load data');
    }
    setLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    navigate('/login');
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900" style={{fontFamily: 'Space Grotesk, sans-serif'}}>{cooperative?.name}</h1>
            <p className="text-xs sm:text-sm text-gray-500">{cooperative?.country} • {cooperative?.product}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-500">Cooperative Manager</p>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleLogout}
              data-testid="logout-button"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Welcome Section */}
        <div className="space-y-2">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">Welcome back, {user?.name}!</h2>
          <p className="text-base sm:text-lg text-gray-600">Here's your cooperative's performance this week</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" data-testid="kpi-cards">
          <Card className="border-0 shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Production</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900">{kpis?.total_production_last_week?.toFixed(0) || 0}<span className="text-sm text-gray-500 ml-1">kg</span></p>
                </div>
                <Package className="w-10 h-10 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Avg Loss</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900">{kpis?.avg_loss_percent?.toFixed(1) || 0}<span className="text-sm text-gray-500 ml-1">%</span></p>
                </div>
                <TrendingUp className={`w-10 h-10 ${kpis?.avg_loss_percent > 10 ? 'text-red-600' : 'text-green-600'}`} />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Open Issues</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900">{kpis?.open_issues || 0}</p>
                </div>
                <AlertCircle className="w-10 h-10 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Quality A</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900">{kpis?.avg_quality_a?.toFixed(1) || 0}<span className="text-sm text-gray-500 ml-1">%</span></p>
                </div>
                <BarChart3 className="w-10 h-10 text-emerald-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all cursor-pointer" onClick={() => navigate('/data-entry')} data-testid="data-entry-card">
            <div className="h-2 bg-gradient-to-r from-blue-500 to-cyan-500"></div>
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
                  <Plus className="w-8 h-8" />
                </div>
                <div>
                  <CardTitle className="text-xl">Data Entry</CardTitle>
                  <CardDescription className="mt-1">Log production & quality</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-all cursor-pointer" onClick={() => navigate('/dashboard')} data-testid="dashboard-card">
            <div className="h-2 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white">
                  <BarChart3 className="w-8 h-8" />
                </div>
                <div>
                  <CardTitle className="text-xl">Dashboard</CardTitle>
                  <CardDescription className="mt-1">View performance metrics</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-all cursor-pointer" onClick={() => navigate('/simulator')} data-testid="simulator-card">
            <div className="h-2 bg-gradient-to-r from-purple-500 to-pink-500"></div>
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                  <Calculator className="w-8 h-8" />
                </div>
                <div>
                  <CardTitle className="text-xl">What-if Simulator</CardTitle>
                  <CardDescription className="mt-1">Predict loss reduction</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default ManagerHome;