import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, TrendingUp, TrendingDown, AlertTriangle, BarChart3, Calculator, FileText, AlertOctagon, Award } from 'lucide-react';
import { toast } from 'sonner';

const CooperativeOverview = ({ user, setUser, api }) => {
  const navigate = useNavigate();
  const [overview, setOverview] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOverview();
  }, []);

  const loadOverview = async () => {
    try {
      const response = await api.get('/kpis/overview');
      setOverview(response.data);
    } catch (error) {
      toast.error('Failed to load overview');
    }
    setLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    navigate('/login');
  };

  const getStatusColor = (status) => {
    const colors = {
      'active': 'bg-green-500',
      'pending': 'bg-yellow-500',
      'inactive': 'bg-gray-500'
    };
    return colors[status] || 'bg-gray-500';
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-teal-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900" style={{fontFamily: 'Space Grotesk, sans-serif'}}>DIMS - Officer Dashboard</h1>
            <p className="text-xs sm:text-sm text-gray-500">Multi-Cooperative Management</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-500">MOGD Project Officer</p>
            </div>
            <Avatar className="h-12 w-12 border-2 border-blue-500 shadow-lg">
              <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=officer&backgroundColor=dbeafe&clothing=blazerShirt&clothingColor=3b82f6&top=longHairStraight&hairColor=4a312c&accessories=prescription02" alt={user?.name} />
              <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold">
                {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
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
        {/* Quick Actions */}
        <div className="flex flex-wrap gap-4">
          <Button onClick={() => navigate('/dashboard')} data-testid="view-analytics-button">
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics
          </Button>
          <Button onClick={() => navigate('/data-entries')} variant="outline" data-testid="data-entries-button">
            <FileText className="w-4 h-4 mr-2" />
            Data Entries
          </Button>
          <Button onClick={() => navigate('/issues')} variant="outline" data-testid="issues-button">
            <AlertOctagon className="w-4 h-4 mr-2" />
            Issues
          </Button>
          <Button onClick={() => navigate('/simulator')} variant="outline" data-testid="simulator-button">
            <Calculator className="w-4 h-4 mr-2" />
            Simulator
          </Button>
          <Button onClick={() => navigate('/iso-compliance')} variant="outline" data-testid="iso-compliance-button">
            <Award className="w-4 h-4 mr-2" />
            ISO Compliance
          </Button>
          <Button onClick={() => navigate('/admin-tools')} variant="outline" className="border-orange-500 text-orange-600 hover:bg-orange-50" data-testid="admin-tools-button">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Admin Tools
          </Button>
        </div>

        {/* Cooperatives List */}
        <div className="space-y-4" data-testid="cooperatives-list">
          <h2 className="text-2xl font-bold text-gray-900">Cooperatives Overview</h2>
          
          {overview.map((item, index) => (
            <Card key={item.cooperative.id} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-xl">{item.cooperative.name}</CardTitle>
                      <Badge className={`${getStatusColor(item.cooperative.status)} text-white`}>
                        {item.cooperative.status}
                      </Badge>
                    </div>
                    <CardDescription className="mt-1">
                      {item.cooperative.country} • {item.cooperative.product}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500">Production (Last Week)</p>
                    <p className="text-2xl font-bold text-gray-900">{item.kpis.total_production_last_week.toFixed(0)} kg</p>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500">Avg Loss %</p>
                    <div className="flex items-center gap-2">
                      <p className="text-2xl font-bold text-gray-900">{item.kpis.avg_loss_percent}%</p>
                      {item.kpis.avg_loss_percent > 10 ? (
                        <TrendingUp className="w-5 h-5 text-red-500" />
                      ) : (
                        <TrendingDown className="w-5 h-5 text-green-500" />
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500">Open Issues</p>
                    <div className="flex items-center gap-2">
                      <p className="text-2xl font-bold text-gray-900">{item.kpis.open_issues}</p>
                      {item.kpis.open_issues > 0 && <AlertTriangle className="w-5 h-5 text-yellow-500" />}
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500">Quality (Grade A)</p>
                    <p className="text-2xl font-bold text-gray-900">{item.kpis.avg_quality_a.toFixed(1)}%</p>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-200 flex gap-2">
                  <Button 
                    size="sm" 
                    onClick={() => navigate(`/dashboard?cooperative=${item.cooperative.id}`)}
                    data-testid={`view-details-${index}`}
                  >
                    View Details
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => navigate(`/simulator?cooperative=${item.cooperative.id}`)}
                    data-testid={`run-scenario-${index}`}
                  >
                    Run Scenario
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
};

export default CooperativeOverview;