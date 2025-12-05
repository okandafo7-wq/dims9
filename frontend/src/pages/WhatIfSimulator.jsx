import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { ArrowLeft, Calculator, TrendingUp, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

const WhatIfSimulator = ({ user, setUser, api }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [cooperatives, setCooperatives] = useState([]);
  const [selectedCoopId, setSelectedCoopId] = useState('');
  const [inputs, setInputs] = useState({
    current_loss_percent: 12,
    target_loss_percent: 8,
    price_per_kg: 5,
    avg_production_kg: 500
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCooperatives();
  }, []);

  useEffect(() => {
    const coopId = searchParams.get('cooperative');
    if (coopId) {
      setSelectedCoopId(coopId);
      loadCooperativeData(coopId);
    } else if (user.role === 'manager' && user.cooperative_id) {
      setSelectedCoopId(user.cooperative_id);
      loadCooperativeData(user.cooperative_id);
    }
  }, [searchParams, user]);

  const loadCooperatives = async () => {
    try {
      const response = await api.get('/cooperatives');
      setCooperatives(response.data);
    } catch (error) {
      toast.error('Failed to load cooperatives');
    }
  };

  const loadCooperativeData = async (coopId) => {
    try {
      // Get recent production logs to calculate averages
      const response = await api.get(`/production-logs?cooperative_id=${coopId}`);
      if (response.data.length > 0) {
        const logs = response.data.slice(0, 10);
        const avgLoss = logs.reduce((sum, log) => sum + log.post_harvest_loss_percent, 0) / logs.length;
        const avgProduction = logs.reduce((sum, log) => sum + log.total_production, 0) / logs.length;
        
        setInputs(prev => ({
          ...prev,
          current_loss_percent: Math.round(avgLoss * 10) / 10,
          avg_production_kg: Math.round(avgProduction)
        }));
      }
    } catch (error) {
      console.error('Failed to load cooperative data', error);
    }
  };

  const handleCalculate = async () => {
    if (!selectedCoopId) {
      toast.error('Please select a cooperative');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/scenario/loss-reduction', {
        cooperative_id: selectedCoopId,
        ...inputs
      });
      setResult(response.data);
      toast.success('Scenario calculated successfully!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to calculate scenario');
    }
    setLoading(false);
  };

  const getBackRoute = () => {
    return user.role === 'officer' ? '/overview' : '/home';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50">
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
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900" style={{fontFamily: 'Space Grotesk, sans-serif'}}>What-if Simulator</h1>
            <p className="text-xs sm:text-sm text-gray-500">Loss Reduction Impact Analysis</p>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Input Card */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5" />
                Scenario Inputs
              </CardTitle>
              <CardDescription>Adjust parameters to see the impact</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Cooperative Selection */}
              {user.role === 'officer' && (
                <div className="space-y-2">
                  <Label htmlFor="cooperative">Select Cooperative *</Label>
                  <Select 
                    value={selectedCoopId} 
                    onValueChange={(value) => {
                      setSelectedCoopId(value);
                      loadCooperativeData(value);
                    }}
                  >
                    <SelectTrigger data-testid="cooperative-select">
                      <SelectValue placeholder="Choose cooperative..." />
                    </SelectTrigger>
                    <SelectContent>
                      {cooperatives.map((coop) => (
                        <SelectItem key={coop.id} value={coop.id}>
                          {coop.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Current Loss */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Current Average Loss (%)</Label>
                  <span className="text-sm font-semibold">{inputs.current_loss_percent}%</span>
                </div>
                <Slider
                  value={[inputs.current_loss_percent]}
                  onValueChange={([value]) => setInputs({ ...inputs, current_loss_percent: value })}
                  min={0}
                  max={50}
                  step={0.5}
                  data-testid="current-loss-slider"
                />
              </div>

              {/* Target Loss */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Target Loss (%)</Label>
                  <span className="text-sm font-semibold text-green-600">{inputs.target_loss_percent}%</span>
                </div>
                <Slider
                  value={[inputs.target_loss_percent]}
                  onValueChange={([value]) => setInputs({ ...inputs, target_loss_percent: value })}
                  min={0}
                  max={inputs.current_loss_percent}
                  step={0.5}
                  data-testid="target-loss-slider"
                />
              </div>

              {/* Average Production */}
              <div className="space-y-2">
                <Label htmlFor="avg_production">Average Production (kg/period)</Label>
                <Input
                  id="avg_production"
                  type="number"
                  step="10"
                  value={inputs.avg_production_kg}
                  onChange={(e) => setInputs({ ...inputs, avg_production_kg: parseFloat(e.target.value) })}
                  data-testid="production-input"
                />
              </div>

              {/* Price per kg */}
              <div className="space-y-2">
                <Label htmlFor="price_per_kg">Price per kg (€)</Label>
                <Input
                  id="price_per_kg"
                  type="number"
                  step="0.1"
                  value={inputs.price_per_kg}
                  onChange={(e) => setInputs({ ...inputs, price_per_kg: parseFloat(e.target.value) })}
                  data-testid="price-input"
                />
              </div>

              <Button 
                onClick={handleCalculate} 
                className="w-full bg-purple-600 hover:bg-purple-700"
                disabled={loading}
                data-testid="calculate-button"
              >
                <Calculator className="w-4 h-4 mr-2" />
                {loading ? 'Calculating...' : 'Calculate Scenario'}
              </Button>
            </CardContent>
          </Card>

          {/* Results Card */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Results & Impact
              </CardTitle>
              <CardDescription>Predicted outcomes of loss reduction</CardDescription>
            </CardHeader>
            <CardContent>
              {result ? (
                <div className="space-y-6" data-testid="results-section">
                  {/* Sellable Quantity */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-gray-900">Sellable Quantity</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-100 p-4 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">Current</p>
                        <p className="text-2xl font-bold text-gray-900">{result.current_sellable_kg} kg</p>
                      </div>
                      <div className="bg-green-100 p-4 rounded-lg">
                        <p className="text-sm text-green-700 mb-1">Target</p>
                        <p className="text-2xl font-bold text-green-900">{result.target_sellable_kg} kg</p>
                      </div>
                    </div>
                    <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-lg">
                      <p className="text-sm text-emerald-700 mb-1">Additional Product</p>
                      <p className="text-3xl font-bold text-emerald-900">+{result.additional_sellable_kg} kg</p>
                    </div>
                  </div>

                  {/* Revenue */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      <DollarSign className="w-5 h-5" />
                      Revenue Impact
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-100 p-4 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">Current</p>
                        <p className="text-2xl font-bold text-gray-900">€{result.current_revenue}</p>
                      </div>
                      <div className="bg-blue-100 p-4 rounded-lg">
                        <p className="text-sm text-blue-700 mb-1">Target</p>
                        <p className="text-2xl font-bold text-blue-900">€{result.target_revenue}</p>
                      </div>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                      <p className="text-sm text-blue-700 mb-1">Revenue Gain</p>
                      <p className="text-3xl font-bold text-blue-900">+€{result.revenue_gain}</p>
                    </div>
                  </div>

                  {/* Explanation */}
                  <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg">
                    <h3 className="font-semibold text-purple-900 mb-2">Interpretation</h3>
                    <p className="text-sm text-purple-800">{result.explanation}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Calculator className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>Adjust inputs and click Calculate to see results</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default WhatIfSimulator;