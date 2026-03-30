import { useAlertStore } from '@/store/alertStore';
import { AlertTriangle, ArrowRight, AlertOctagon, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { AlertStats } from '@/components/alerts/SeverityBadge';

export function ActiveAlertsPreview() {
  const navigate = useNavigate();
  const {
    alerts,
    getCriticalCount,
    getHighCount,
  } = useAlertStore();

  const activeAlerts = alerts.filter(a => a.status === 'active').slice(0, 3);
  const criticalCount = getCriticalCount();
  const highCount = getHighCount();
  const totalActive = alerts.filter(a => a.status === 'active').length;

  if (totalActive === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="panel p-6 text-center"
      >
        <div className="text-5xl mb-3">✅</div>
        <h3 className="font-semibold mb-1">All Systems Operational</h3>
        <p className="text-sm text-muted-foreground">
          No active alerts detected
        </p>
      </motion.div>
    );
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertOctagon className="w-4 h-4 text-red-500" />;
      case 'high':
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case 'medium':
        return <Info className="w-4 h-4 text-yellow-500" />;
      default:
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'border-red-500/30 bg-red-500/5';
      case 'high':
        return 'border-orange-500/30 bg-orange-500/5';
      case 'medium':
        return 'border-yellow-500/30 bg-yellow-500/5';
      default:
        return 'border-blue-500/30 bg-blue-500/5';
    }
  };

  return (
    <div className="panel p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-500" />
            Active Issues
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {totalActive} alert{totalActive !== 1 ? 's' : ''} requiring attention
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/issues')}
          className="gap-1"
        >
          View All
          <ArrowRight className="w-3 h-3" />
        </Button>
      </div>

      {/* Stats */}
      <div className="flex gap-2">
        <AlertStats
          critical={criticalCount}
          high={highCount}
          medium={alerts.filter(a => a.status === 'active' && a.severity === 'medium').length}
          low={alerts.filter(a => a.status === 'active' && a.severity === 'low').length}
          compact
        />
      </div>

      {/* Top 3 Alerts */}
      <div className="space-y-2">
        {activeAlerts.map((alert, idx) => (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            onClick={() => navigate('/issues')}
            className={`p-3 rounded-lg border cursor-pointer hover:bg-secondary/50 transition-all ${getSeverityColor(alert.severity)}`}
          >
            <div className="flex items-start gap-2">
              {getSeverityIcon(alert.severity)}
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold truncate">{alert.title}</h4>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                  {alert.message}
                </p>
                {alert.count && alert.count > 1 && (
                  <span className="text-[10px] text-muted-foreground mt-1 inline-block">
                    {alert.count} similar alerts grouped
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {totalActive > 3 && (
        <p className="text-xs text-center text-muted-foreground">
          + {totalActive - 3} more alert{totalActive - 3 !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
}
