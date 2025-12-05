import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Award, CheckCircle, Shield, Leaf, AlertCircle, FileCheck, BookOpen, Users, Target } from 'lucide-react';
import ISOLogo from '@/components/ISOLogo';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';

const ISOCompliance = ({ user, api }) => {
  const navigate = useNavigate();
  const [nonconformities, setNonconformities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const ncsResponse = await api.get('/nonconformities');
      setNonconformities(ncsResponse.data);
    } catch (error) {
      toast.error('Failed to load compliance data');
    }
    setLoading(false);
  };

  const getBackRoute = () => {
    return user?.role === 'officer' ? '/overview' : '/home';
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  // Calculate compliance scores
  const qualityIssues = nonconformities.filter(nc => nc.category === 'quality');
  const environmentalIssues = nonconformities.filter(nc => nc.category === 'environmental');
  const safetyIssues = nonconformities.filter(nc => nc.category === 'safety');

  const qualityResolved = qualityIssues.filter(nc => nc.status === 'closed').length;
  const environmentalResolved = environmentalIssues.filter(nc => nc.status === 'closed').length;
  const safetyResolved = safetyIssues.filter(nc => nc.status === 'closed').length;

  const iso9001Score = qualityIssues.length > 0 ? Math.round((qualityResolved / qualityIssues.length) * 100) : 100;
  const iso14001Score = environmentalIssues.length > 0 ? Math.round((environmentalResolved / environmentalIssues.length) * 100) : 100;
  const iso45001Score = safetyIssues.length > 0 ? Math.round((safetyResolved / safetyIssues.length) * 100) : 100;
  const overallScore = Math.round((iso9001Score + iso14001Score + iso45001Score) / 3);

  const radarData = [
    { standard: 'ISO 9001\nQuality', score: iso9001Score },
    { standard: 'ISO 14001\nEnvironment', score: iso14001Score },
    { standard: 'ISO 45001\nSafety', score: iso45001Score }
  ];

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBg = (score) => {
    if (score >= 90) return 'bg-green-100 border-green-300';
    if (score >= 70) return 'bg-yellow-100 border-yellow-300';
    return 'bg-red-100 border-red-300';
  };

  const isoStandards = [
    {
      id: 'iso9001',
      title: 'ISO 9001:2015',
      subtitle: 'Quality Management Systems',
      icon: Award,
      color: 'from-blue-500 to-cyan-500',
      score: iso9001Score,
      issues: qualityIssues.length,
      resolved: qualityResolved,
      description: 'ISO 9001 sets out the criteria for a quality management system and is based on principles including strong customer focus, involvement of top management, process approach, and continual improvement.',
      keyRequirements: [
        'Context of the organization (4.1) - Understanding organizational context and stakeholder needs',
        'Leadership and commitment (5.1) - Top management accountability for QMS effectiveness',
        'Risk-based thinking (6.1) - Proactive risk and opportunity management',
        'Operational planning and control (8.1) - Controlled production and service provision',
        'Product/service conformity (8.5) - Control of outputs to meet requirements',
        'Monitoring and measurement (9.1) - Performance evaluation and customer satisfaction',
        'Nonconformity and corrective action (10.2) - Systematic problem resolution',
        'Continual improvement (10.3) - Ongoing QMS enhancement'
      ],
      benefits: [
        'Improved product and service quality',
        'Enhanced customer satisfaction and retention',
        'Increased operational efficiency',
        'Better decision-making processes',
        'Competitive market advantage',
        'International recognition and credibility'
      ]
    },
    {
      id: 'iso14001',
      title: 'ISO 14001:2015',
      subtitle: 'Environmental Management Systems',
      icon: Leaf,
      color: 'from-green-500 to-emerald-500',
      score: iso14001Score,
      issues: environmentalIssues.length,
      resolved: environmentalResolved,
      description: 'ISO 14001 provides a framework for organizations to protect the environment, respond to changing environmental conditions, and achieve continual improvement of environmental performance.',
      keyRequirements: [
        'Environmental policy and objectives',
        'Identification of environmental aspects',
        'Legal and regulatory compliance',
        'Resource management and conservation',
        'Emergency preparedness and response',
        'Monitoring and measurement of environmental performance'
      ],
      benefits: [
        'Reduced environmental impact',
        'Cost savings through efficiency',
        'Enhanced corporate reputation',
        'Regulatory compliance assurance',
        'Improved stakeholder relationships',
        'Risk management and prevention'
      ]
    },
    {
      id: 'iso45001',
      title: 'ISO 45001:2018',
      subtitle: 'Occupational Health and Safety Management',
      icon: Shield,
      color: 'from-orange-500 to-red-500',
      score: iso45001Score,
      issues: safetyIssues.length,
      resolved: safetyResolved,
      description: 'ISO 45001 specifies requirements for an occupational health and safety management system, enabling organizations to provide safe and healthy workplaces by preventing work-related injury and ill health.',
      keyRequirements: [
        'Hazard identification and risk assessment',
        'Worker participation and consultation',
        'Legal compliance and obligations',
        'Emergency preparedness protocols',
        'Incident investigation and analysis',
        'Health and safety performance monitoring'
      ],
      benefits: [
        'Reduced workplace accidents and injuries',
        'Lower absenteeism and turnover',
        'Improved employee morale and productivity',
        'Legal compliance and liability reduction',
        'Enhanced organizational culture',
        'Stakeholder confidence and trust'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50">
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
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900" style={{fontFamily: 'Space Grotesk, sans-serif'}}>ISO Compliance Center</h1>
            <p className="text-xs sm:text-sm text-gray-500">Quality, Environment & Safety Standards</p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Overall Score */}
        <Card className="border-0 shadow-xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white">
          <CardContent className="pt-8">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full">
                <Award className="w-10 h-10" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-purple-100 uppercase tracking-wide">Overall Compliance Score</h2>
                <p className="text-6xl font-bold mt-2">{overallScore}%</p>
                <p className="text-purple-100 mt-2">Across all ISO standards</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Compliance Radar */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Standards Compliance Overview</CardTitle>
            <CardDescription>Performance across ISO standards</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis dataKey="standard" tick={{ fill: '#6b7280', fontSize: 12 }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} />
                <Radar name="Score" dataKey="score" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* ISO Standards Tabs */}
        <Tabs defaultValue="iso9001" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="iso9001" data-testid="iso9001-tab">
              <Award className="w-4 h-4 mr-2" />
              ISO 9001
            </TabsTrigger>
            <TabsTrigger value="iso14001" data-testid="iso14001-tab">
              <Leaf className="w-4 h-4 mr-2" />
              ISO 14001
            </TabsTrigger>
            <TabsTrigger value="iso45001" data-testid="iso45001-tab">
              <Shield className="w-4 h-4 mr-2" />
              ISO 45001
            </TabsTrigger>
          </TabsList>

          {isoStandards.map((standard) => (
            <TabsContent key={standard.id} value={standard.id} className="space-y-6">
              {/* Standard Header */}
              <Card className={`border-0 shadow-lg bg-gradient-to-br ${standard.color} text-white`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                        <standard.icon className="w-8 h-8" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl text-white">{standard.title}</CardTitle>
                        <CardDescription className="text-white/90 mt-1">{standard.subtitle}</CardDescription>
                      </div>
                    </div>
                    <Badge className="bg-white/30 text-white text-lg px-4 py-2">{standard.score}%</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-white/90">{standard.description}</p>
                </CardContent>
              </Card>

              {/* Compliance Status */}
              <Card className={`border-2 ${getScoreBg(standard.score)}`}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileCheck className="w-5 h-5" />
                    Compliance Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-1">Total Issues</p>
                      <p className="text-3xl font-bold text-gray-900">{standard.issues}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-1">Resolved</p>
                      <p className="text-3xl font-bold text-green-600">{standard.resolved}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-1">Open</p>
                      <p className="text-3xl font-bold text-red-600">{standard.issues - standard.resolved}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Compliance Progress</span>
                      <span className={`font-semibold ${getScoreColor(standard.score)}`}>{standard.score}%</span>
                    </div>
                    <Progress value={standard.score} className="h-3" />
                  </div>
                </CardContent>
              </Card>

              {/* Key Requirements */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    Key Requirements
                  </CardTitle>
                  <CardDescription>Essential elements for compliance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {standard.keyRequirements.map((req, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                        <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{req}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Benefits */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="w-5 h-5" />
                    Benefits of Compliance
                  </CardTitle>
                  <CardDescription>Advantages of implementing this standard</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {standard.benefits.map((benefit, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                        <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>

        {/* Action Button */}
        <Card className="border-0 shadow-lg bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold">Need to address compliance issues?</h3>
                <p className="text-indigo-100 text-sm mt-1">View and manage all nonconformities</p>
              </div>
              <Button 
                onClick={() => navigate('/issues')} 
                className="bg-white text-indigo-600 hover:bg-indigo-50"
                data-testid="view-issues-button"
              >
                <AlertCircle className="w-4 h-4 mr-2" />
                View Issues
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default ISOCompliance;