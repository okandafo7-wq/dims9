import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';

const DataEntry = ({ user, setUser, api }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    batch_period: '',
    total_production: '',
    grade_a_percent: '',
    grade_b_percent: '',
    post_harvest_loss_percent: '',
    energy_use: 'Medium',
    has_nonconformity: false,
    nonconformity_description: '',
    corrective_action: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Calculate post harvest loss in kg
      const lossKg = (parseFloat(formData.total_production) * parseFloat(formData.post_harvest_loss_percent)) / 100;

      const logData = {
        cooperative_id: user.cooperative_id,
        date: new Date(formData.date).toISOString(),
        batch_period: formData.batch_period,
        total_production: parseFloat(formData.total_production),
        grade_a_percent: parseFloat(formData.grade_a_percent),
        grade_b_percent: parseFloat(formData.grade_b_percent),
        post_harvest_loss_percent: parseFloat(formData.post_harvest_loss_percent),
        post_harvest_loss_kg: lossKg,
        energy_use: formData.energy_use,
        has_nonconformity: formData.has_nonconformity,
        nonconformity_description: formData.has_nonconformity ? formData.nonconformity_description : null,
        corrective_action: formData.has_nonconformity ? formData.corrective_action : null
      };

      await api.post('/production-logs', logData);
      toast.success('Production data saved successfully!');
      
      // Reset form
      setFormData({
        date: new Date().toISOString().split('T')[0],
        batch_period: '',
        total_production: '',
        grade_a_percent: '',
        grade_b_percent: '',
        post_harvest_loss_percent: '',
        energy_use: 'Medium',
        has_nonconformity: false,
        nonconformity_description: '',
        corrective_action: ''
      });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save data');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate('/home')}
            data-testid="back-button"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900" style={{fontFamily: 'Space Grotesk, sans-serif'}}>Production & Quality Log</h1>
            <p className="text-xs sm:text-sm text-gray-500">Record daily/weekly production data</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Data Entry Form</CardTitle>
            <CardDescription>Enter production, quality, and loss information</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6" data-testid="data-entry-form">
              {/* Date and Batch */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                    data-testid="date-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="batch_period">Batch / Period *</Label>
                  <Input
                    id="batch_period"
                    placeholder="e.g., Week 1, Batch A"
                    value={formData.batch_period}
                    onChange={(e) => setFormData({ ...formData, batch_period: e.target.value })}
                    required
                    data-testid="batch-input"
                  />
                </div>
              </div>

              {/* Production */}
              <div className="space-y-2">
                <Label htmlFor="total_production">Total Production (kg/liters) *</Label>
                <Input
                  id="total_production"
                  type="number"
                  step="0.01"
                  placeholder="e.g., 500"
                  value={formData.total_production}
                  onChange={(e) => setFormData({ ...formData, total_production: e.target.value })}
                  required
                  data-testid="production-input"
                />
              </div>

              {/* Quality Breakdown */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="grade_a_percent">Grade A (%) *</Label>
                  <Input
                    id="grade_a_percent"
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    placeholder="e.g., 75"
                    value={formData.grade_a_percent}
                    onChange={(e) => setFormData({ ...formData, grade_a_percent: e.target.value })}
                    required
                    data-testid="grade-a-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="grade_b_percent">Grade B (%) *</Label>
                  <Input
                    id="grade_b_percent"
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    placeholder="e.g., 25"
                    value={formData.grade_b_percent}
                    onChange={(e) => setFormData({ ...formData, grade_b_percent: e.target.value })}
                    required
                    data-testid="grade-b-input"
                  />
                </div>
              </div>

              {/* Post-Harvest Loss */}
              <div className="space-y-2">
                <Label htmlFor="post_harvest_loss_percent">Post-Harvest Loss (%) *</Label>
                <Input
                  id="post_harvest_loss_percent"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  placeholder="e.g., 12"
                  value={formData.post_harvest_loss_percent}
                  onChange={(e) => setFormData({ ...formData, post_harvest_loss_percent: e.target.value })}
                  required
                  data-testid="loss-input"
                />
                {formData.total_production && formData.post_harvest_loss_percent && (
                  <p className="text-sm text-gray-500">
                    Loss: {((parseFloat(formData.total_production) * parseFloat(formData.post_harvest_loss_percent)) / 100).toFixed(2)} kg
                  </p>
                )}
              </div>

              {/* Energy Use */}
              <div className="space-y-2">
                <Label htmlFor="energy_use">Energy Use Level *</Label>
                <Select 
                  value={formData.energy_use} 
                  onValueChange={(value) => setFormData({ ...formData, energy_use: value })}
                >
                  <SelectTrigger data-testid="energy-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Nonconformity */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="has_nonconformity"
                    checked={formData.has_nonconformity}
                    onChange={(e) => setFormData({ ...formData, has_nonconformity: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                    data-testid="nonconformity-checkbox"
                  />
                  <Label htmlFor="has_nonconformity" className="cursor-pointer">Nonconformity detected?</Label>
                </div>

                {formData.has_nonconformity && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="nonconformity_description">Description *</Label>
                      <Textarea
                        id="nonconformity_description"
                        placeholder="Describe the issue..."
                        value={formData.nonconformity_description}
                        onChange={(e) => setFormData({ ...formData, nonconformity_description: e.target.value })}
                        required={formData.has_nonconformity}
                        data-testid="nonconformity-description"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="corrective_action">Corrective Action *</Label>
                      <Textarea
                        id="corrective_action"
                        placeholder="Actions taken to resolve..."
                        value={formData.corrective_action}
                        onChange={(e) => setFormData({ ...formData, corrective_action: e.target.value })}
                        required={formData.has_nonconformity}
                        data-testid="corrective-action"
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Submit */}
              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={loading}
                data-testid="save-button"
              >
                <Save className="w-4 h-4 mr-2" />
                {loading ? 'Saving...' : 'Save Production Log'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default DataEntry;