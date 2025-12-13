import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Users, TrendingUp, Award, BookOpen, Bell, Target, Lightbulb, BarChart3 } from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';

const FarmerCommunity = ({ user, api }) => {
  const navigate = useNavigate();
  const [cooperative, setCooperative] = useState(null);
  const [coopStats, setCoopStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      if (user?.cooperative_id) {
        const coopResponse = await api.get(`/cooperatives/${user.cooperative_id}`);
        setCooperative(coopResponse.data);

        const statsResponse = await api.get(`/cooperatives/${user.cooperative_id}/stats`);
        setCoopStats(statsResponse.data);
      }
    } catch (error) {
      toast.error('Failed to load community data');
    }
    setLoading(false);
  };

  const bestPractices = [
    {
      category: 'Quality Management',
      icon: Award,
      color: 'blue',
      tips: [
        'Harvest at optimal maturity for best quality',
        'Use clean, sanitized containers for collection',
        'Sort and grade immediately after harvest',
        'Keep detailed records of each harvest batch'
      ]
    },
    {
      category: 'Loss Prevention',
      icon: Target,
      color: 'green',
      tips: [
        'Handle produce gently to avoid bruising',
        'Store in cool, shaded areas immediately',
        'Check storage areas daily for spoilage',
        'Use proper ventilation to prevent moisture buildup'
      ]
    },
    {
      category: 'Safety First',
      icon: BookOpen,
      color: 'red',
      tips: [
        'Always wear protective equipment',
        'Keep work areas clean and organized',
        'Report any safety hazards immediately',
        'Follow chemical handling procedures strictly'
      ]
    }
  ];

  const announcements = [
    {
      title: 'New Quality Standards Workshop',
      date: 'Dec 15, 2025',
      type: 'training',
      description: 'Learn advanced sorting techniques and quality grading methods'
    },
    {
      title: 'Cooperative Achieves 95% Quality Rating',
      date: 'Dec 10, 2025',
      type: 'success',
      description: 'Thanks to all farmers for maintaining excellent standards!'
    },
    {
      title: 'Updated Post-Harvest Guidelines',
      date: 'Dec 8, 2025',
      type: 'info',
      description: 'New procedures for cooling and storage now available'
    }
  ];

  const getColorClass = (color) => {
    const colors = {
      blue: 'bg-blue-50 border-blue-200 text-blue-900',
      green: 'bg-green-50 border-green-200 text-green-900',
      red: 'bg-red-50 border-red-200 text-red-900'
    };
    return colors[color];
  };

  const getIconColor = (color) => {
    const colors = {
      blue: 'text-blue-600',
      green: 'text-green-600',
      red: 'text-red-600'
    };
    return colors[color];
  };

  const getAnnouncementBadge = (type) => {
    const badges = {
      training: { label: 'Training', color: 'bg-purple-100 text-purple-700' },
      success: { label: 'Success', color: 'bg-green-100 text-green-700' },
      info: { label: 'Info', color: 'bg-blue-100 text-blue-700' }
    };
    return badges[type];
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => navigate('/home')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900" style={{fontFamily: 'Space Grotesk, sans-serif'}}>Farmer Community</h1>
            <p className="text-xs sm:text-sm text-gray-500">{cooperative?.name}</p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Cooperative Overview */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-emerald-600 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">{cooperative?.name}</h2>
                <p className="text-green-100">{cooperative?.country} • {cooperative?.product}</p>
              </div>
              <Users className="w-16 h-16 text-green-200" />
            </div>
            {coopStats && (
              <div className="grid grid-cols-3 gap-4 mt-6">
                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 text-center">
                  <p className="text-3xl font-bold">{coopStats.total_farmers || '15'}</p>
                  <p className="text-xs text-green-100">Farmers</p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 text-center">
                  <p className="text-3xl font-bold">{coopStats.avg_quality?.toFixed(0) || '88'}%</p>
                  <p className="text-xs text-green-100">Avg Quality</p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 text-center">
                  <p className="text-3xl font-bold">{coopStats.total_production?.toFixed(0) || '12500'} kg</p>
                  <p className="text-xs text-green-100">Total Production</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Announcements */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-orange-600" />
              Announcements & Updates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {announcements.map((announcement, index) => {
                const badge = getAnnouncementBadge(announcement.type);
                return (
                  <div key={index} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">{announcement.title}</h4>
                      <Badge className={badge.color}>{badge.label}</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{announcement.description}</p>
                    <p className="text-xs text-gray-400">{announcement.date}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Best Practices */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {bestPractices.map((practice, index) => {
            const Icon = practice.icon;
            return (
              <Card key={index} className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Icon className={`w-5 h-5 ${getIconColor(practice.color)}`} />
                    {practice.category}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {practice.tips.map((tip, tipIndex) => (
                      <li key={tipIndex} className={`p-3 rounded-lg border ${getColorClass(practice.color)}`}>
                        <div className="flex items-start gap-2">
                          <Lightbulb className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{tip}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Performance Comparison */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-purple-600" />
              Cooperative Performance (Anonymous)
            </CardTitle>
            <CardDescription>See how our cooperative compares to regional averages</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Quality Grade A (%)</span>
                  <span className="text-sm font-bold text-gray-900">{coopStats?.avg_quality_a?.toFixed(0) || '88'}%</span>
                </div>
                <Progress value={coopStats?.avg_quality_a || 88} className="h-3" />
                <p className="text-xs text-gray-500 mt-1">Regional Avg: 82%</p>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Post-Harvest Loss (%)</span>
                  <span className="text-sm font-bold text-gray-900">{coopStats?.avg_loss?.toFixed(1) || '3.2'}%</span>
                </div>
                <Progress value={100 - (coopStats?.avg_loss || 3.2) * 10} className="h-3" />
                <p className="text-xs text-gray-500 mt-1">Regional Avg: 5.8%</p>
              </div>
              <div className="bg-green-50 border border-green-200 p-4 rounded-lg mt-4">
                <p className="text-sm font-semibold text-green-900 mb-1">🎉 Outstanding Performance!</p>
                <p className="text-sm text-green-800">Our cooperative is performing 12% better than regional average in quality and 45% better in loss reduction.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Training Schedule */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-600" />
              Upcoming Training Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-4 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                <div className="bg-indigo-600 text-white rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold">15</p>
                  <p className="text-xs">DEC</p>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">ISO 9001 Quality Management</h4>
                  <p className="text-sm text-gray-600">10:00 AM - 12:00 PM • Main Hall</p>
                </div>
                <Badge className="bg-green-100 text-green-700">Open</Badge>
              </div>
              <div className="flex items-center gap-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <div className="bg-purple-600 text-white rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold">18</p>
                  <p className="text-xs">DEC</p>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">Environmental Best Practices</h4>
                  <p className="text-sm text-gray-600">2:00 PM - 4:00 PM • Training Center</p>
                </div>
                <Badge className="bg-green-100 text-green-700">Open</Badge>
              </div>
              <div className="flex items-center gap-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="bg-orange-600 text-white rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold">22</p>
                  <p className="text-xs">DEC</p>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">Safety & Health Workshop</h4>
                  <p className="text-sm text-gray-600">9:00 AM - 11:00 AM • Main Hall</p>
                </div>
                <Badge className="bg-yellow-100 text-yellow-700">3 Spots Left</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default FarmerCommunity;
