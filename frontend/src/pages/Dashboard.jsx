import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogOut, Cpu, FileBarChart, Sprout, TrendingUp, Users, Leaf } from 'lucide-react';

const Dashboard = ({ user, setUser }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    navigate('/login');
  };

  const features = [
    {
      title: 'Digital Twin Visualization',
      description: 'Real-time farm monitoring, crop health tracking, and predictive analytics',
      icon: Cpu,
      path: '/digital-twin',
      color: 'from-blue-500 to-cyan-500',
      testId: 'digital-twin-card'
    },
    {
      title: 'ESG Reporting',
      description: 'Environmental, Social, and Governance metrics aligned with ISO standards',
      icon: FileBarChart,
      path: '/esg-reporting',
      color: 'from-emerald-500 to-teal-500',
      testId: 'esg-reporting-card'
    }
  ];

  const stats = [
    { label: 'Active Farms', value: '3', icon: Sprout, color: 'text-emerald-600' },
    { label: 'Women Employed', value: '58', icon: Users, color: 'text-teal-600' },
    { label: 'Income Growth', value: '+25.5%', icon: TrendingUp, color: 'text-blue-600' },
    { label: 'Sustainability', value: '91%', icon: Leaf, color: 'text-green-600' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-teal-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Sprout className="w-8 h-8 text-emerald-600" />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900" style={{fontFamily: 'Space Grotesk, sans-serif'}}>DIMS Platform</h1>
              <p className="text-xs sm:text-sm text-gray-500">Women-Led Agri-Supply Chains</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleLogout}
              data-testid="logout-button"
              className="hover:bg-red-50 hover:text-red-600 hover:border-red-200"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Welcome Section */}
        <div className="space-y-2">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">Welcome back, {user?.name}!</h2>
          <p className="text-base sm:text-lg text-gray-600">Manage your agricultural operations with digital twin technology and ESG reporting</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" data-testid="stats-grid">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="border-0 shadow-md hover:shadow-lg transition-all duration-300">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
                      <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stat.value}</p>
                    </div>
                    <Icon className={`w-10 h-10 ${stat.color}`} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card 
                key={index} 
                className="border-0 shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer group overflow-hidden"
                onClick={() => navigate(feature.path)}
                data-testid={feature.testId}
              >
                <div className={`h-2 bg-gradient-to-r ${feature.color}`}></div>
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className={`p-4 rounded-2xl bg-gradient-to-br ${feature.color} text-white transform group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="w-8 h-8" />
                    </div>
                    <div>
                      <CardTitle className="text-xl sm:text-2xl">{feature.title}</CardTitle>
                      <CardDescription className="text-sm sm:text-base mt-1">{feature.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button className={`w-full bg-gradient-to-r ${feature.color} hover:opacity-90 text-white`}>
                    Open Dashboard
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Info Section */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
          <CardHeader>
            <CardTitle className="text-white text-xl sm:text-2xl">About DIMS</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm sm:text-base">
            <p className="text-emerald-50">
              The Digital Twin–Enabled Integrated Management Systems (DIMS) platform integrates advanced digital technologies 
              with ISO-aligned management practices to empower women farmers in developing regions.
            </p>
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="bg-white/20 backdrop-blur-sm p-4 rounded-lg">
                <p className="font-semibold mb-1">ISO 9001</p>
                <p className="text-sm text-emerald-100">Quality Management</p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm p-4 rounded-lg">
                <p className="font-semibold mb-1">ISO 14001</p>
                <p className="text-sm text-emerald-100">Environmental Management</p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm p-4 rounded-lg">
                <p className="font-semibold mb-1">ISO 45001</p>
                <p className="text-sm text-emerald-100">Health & Safety</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Dashboard;