import { useNetworkStore } from '@/store/networkStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, AlertCircle, AlertTriangle, Info, CheckCircle } from 'lucide-react';

export const NetworkAlerts = () => {
  const { alerts, dismissAlert, clearAlerts } = useNetworkStore();
  
  const activeAlerts = alerts.filter(a => !a.dismissed);

  if (activeAlerts.length === 0) {
    return null;
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <AlertCircle className="w-5 h-5" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5" />;
      case 'success':
        return <CheckCircle className="w-5 h-5" />;
      case 'info':
      default:
        return <Info className="w-5 h-5" />;
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'error':
        return 'bg-red-900/50 border-red-600 text-red-200';
      case 'warning':
        return 'bg-yellow-900/50 border-yellow-600 text-yellow-200';
      case 'success':
        return 'bg-green-900/50 border-green-600 text-green-200';
      case 'info':
      default:
        return 'bg-blue-900/50 border-blue-600 text-blue-200';
    }
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Active Alerts
            <Badge variant="destructive">{activeAlerts.length}</Badge>
          </CardTitle>
          {activeAlerts.length > 1 && (
            <Button
              size="sm"
              variant="outline"
              onClick={clearAlerts}
            >
              Clear All
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {activeAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`border rounded-lg p-4 ${getAlertColor(alert.type)}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1">
                  <div className="mt-0.5">
                    {getAlertIcon(alert.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm mb-1">{alert.title}</h4>
                    <p className="text-sm opacity-90">{alert.message}</p>
                    <p className="text-xs opacity-70 mt-2">
                      {new Date(alert.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => dismissAlert(alert.id)}
                  className="flex-shrink-0 hover:bg-white/10"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
