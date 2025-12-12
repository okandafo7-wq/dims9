import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Wrench, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const AdminTools = ({ user, api }) => {
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  if (user?.role !== 'officer') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Only officers can access admin tools. Please login with an officer account.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const handleFixManager = async () => {
    setLoading(true);
    setResult(null);
    try {
      const response = await api.post('/fix-manager-cooperative');
      setResult(response.data);
      toast.success('Manager account fixed successfully!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to fix manager account');
      setResult({ error: error.response?.data?.detail || 'Failed to fix manager account' });
    }
    setLoading(false);
  };

  const handleReinitData = async () => {
    if (!window.confirm('This will delete all cooperatives, production logs, and nonconformities and recreate sample data. Are you sure?')) {
      return;
    }
    
    setLoading(true);
    setResult(null);
    try {
      const response = await api.post('/reinit-data');
      setResult(response.data);
      toast.success('Data reinitialized successfully!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to reinitialize data');
      setResult({ error: error.response?.data?.detail || 'Failed to reinitialize data' });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-50">
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate('/overview')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900" style={{fontFamily: 'Space Grotesk, sans-serif'}}>
              Admin Tools
            </h1>
            <p className="text-xs sm:text-sm text-gray-500">System maintenance and fixes</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <Alert className="border-orange-200 bg-orange-50">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <strong>Warning:</strong> These tools should only be used by system administrators. 
            Some actions are irreversible.
          </AlertDescription>
        </Alert>

        {/* Fix Manager Account */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="w-5 h-5" />
              Fix Manager Account
            </CardTitle>
            <CardDescription>
              Update the manager account's cooperative assignment to the first cooperative in the database.
              Use this if manager account shows "Failed to load data" error.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={handleFixManager} 
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? 'Fixing...' : 'Fix Manager Cooperative'}
            </Button>
          </CardContent>
        </Card>

        {/* Reinitialize Data */}
        <Card className="border-0 shadow-lg border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              Reinitialize Sample Data
            </CardTitle>
            <CardDescription>
              <strong className="text-red-600">Destructive Action:</strong> Delete all cooperatives, 
              production logs, and nonconformities, then recreate sample data. This cannot be undone.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={handleReinitData} 
              disabled={loading}
              variant="destructive"
            >
              {loading ? 'Reinitializing...' : 'Reinitialize Data'}
            </Button>
          </CardContent>
        </Card>

        {/* Result Display */}
        {result && (
          <Card className={`border-0 shadow-lg ${result.error ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {result.error ? (
                  <>
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <span className="text-red-600">Error</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-green-600">Success</span>
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-white p-4 rounded-lg overflow-auto text-sm">
                {JSON.stringify(result, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Troubleshooting Guide</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <strong className="text-gray-900">Manager shows "Failed to load data":</strong>
              <p className="text-gray-600 mt-1">
                Click "Fix Manager Cooperative" button above. This updates the manager's cooperative 
                assignment to a valid cooperative.
              </p>
            </div>
            <div>
              <strong className="text-gray-900">Need fresh sample data:</strong>
              <p className="text-gray-600 mt-1">
                Click "Reinitialize Data" button. This will create 4 cooperatives, 40 production logs, 
                and 25 realistic nonconformities.
              </p>
            </div>
            <div>
              <strong className="text-gray-900">After reinitialization:</strong>
              <p className="text-gray-600 mt-1">
                The manager account is automatically updated to the first cooperative. No additional 
                action needed.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AdminTools;
