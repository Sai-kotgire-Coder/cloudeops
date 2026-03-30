import { useState, useEffect } from 'react';
import { useAlertStore, Alert as AlertType } from '@/store/alertStore';
import { useGameStore } from '@/store/gameStore';
import { useTicketStore } from '@/store/ticketStore';
import { AlertCard } from '@/components/alerts/AlertCard';
import { SeverityBadge, AlertStats } from '@/components/alerts/SeverityBadge';
import { AlertLearningModal } from '@/components/alerts/AlertLearningModal';
import { 
  AlertTriangle, 
  Settings, 
  History, 
  Filter,
  RotateCcw,
  Power,
  TrendingUp,
  Zap
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const IssuesPage = () => {
  const {
    alerts,
    alertHistory,
    autoDetectionEnabled,
    toggleAutoDetection,
    getActiveAlerts,
    getAlertsBySeverity,
    getCriticalCount,
    getHighCount,
    investigateAlert,
    resolveAlert,
    dismissAlert,
    clearAllAlerts,
    clearHistory,
  } = useAlertStore();

  const {
    addInstance,
    updateHPA,
    updateASG,
    updateVPA,
    toggleLoadBalancer,
    hasLoadBalancer,
    hpa,
    asg,
    vpa,
    restartInstance,
    instances,
    restartPod,
  } = useGameStore();

  const { addTicket } = useTicketStore();

  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [learningAlert, setLearningAlert] = useState<AlertType | null>(null);

  const activeAlerts = getActiveAlerts();
  const criticalCount = getCriticalCount();
  const highCount = getHighCount();
  const mediumAlerts = getAlertsBySeverity('medium');
  const lowAlerts = getAlertsBySeverity('low');

  // Filter alerts
  const filteredAlerts = activeAlerts.filter(alert => {
    if (severityFilter !== 'all' && alert.severity !== severityFilter) return false;
    if (categoryFilter !== 'all' && alert.category !== categoryFilter) return false;
    return true;
  });

  const categories = Array.from(new Set(alerts.map(a => a.category)));

  // Handle Fix Now actions
  const handleFixNow = (alert: AlertType) => {
    const category = alert.category;
    const severity = alert.severity;

    try {
      if (category === 'cpu' && severity === 'high') {
        // Enable HPA if not already enabled
        if (!hpa.enabled) {
          updateHPA({ enabled: true });
          toast.success('✅ Enabled Horizontal Pod Autoscaler (HPA)');
        } else {
          toast.info('HPA already enabled. Consider adding more instances manually.');
        }
      } else if (category === 'cpu' && severity === 'critical') {
        // Add instance immediately
        addInstance('m5.large');
        toast.success('✅ Provisioning additional m5.large instance');
      } else if (category === 'memory' && severity === 'high') {
        // Enable VPA
        if (!vpa.enabled) {
          updateVPA({ enabled: true, mode: 'Auto' });
          toast.success('✅ Enabled Vertical Pod Autoscaler (VPA)');
        } else {
          toast.info('VPA already enabled. Monitoring memory usage...');
        }
      } else if (category === 'pod') {
        // Restart crashed pods
        const crashedPods = instances.flatMap(i => 
          (i.pods || []).filter(p => p.status === 'crashed')
        );
        crashedPods.forEach(pod => restartPod(pod.id));
        toast.success(`✅ Restarting ${crashedPods.length} crashed pod(s)`);
      } else if (category === 'traffic' && severity === 'critical') {
        // Enable ASG and add instances
        if (!asg.enabled) {
          updateASG({ enabled: true });
        }
        addInstance('c5.xlarge');
        toast.success('✅ Enabled ASG and adding high-capacity instance');
      } else if (category === 'network') {
        // Enable load balancer
        if (!hasLoadBalancer) {
          toggleLoadBalancer();
          toast.success('✅ Enabled Load Balancer');
        } else {
          toast.info('Load Balancer already enabled');
        }
      } else if (category === 'capacity') {
        // Enable ASG
        if (!asg.enabled) {
          updateASG({ enabled: true });
          toast.success('✅ Enabled Auto-Scaling Group (ASG)');
        } else {
          addInstance();
          toast.success('✅ Adding additional instance');
        }
      } else {
        toast.info('Manual investigation required. Check the metrics and recommendations.');
      }

      // Mark as investigating
      investigateAlert(alert.id);

      // Create a ticket for tracking
      addTicket({
        title: `[Auto-Created] ${alert.title}`,
        description: `${alert.message}\n\nAI Insight:\n${alert.insight?.why || 'N/A'}\n\nRecommendation:\n${alert.insight?.recommendation || 'N/A'}`,
        type: severity === 'critical' ? 'incident' : 'alert',
        priority: severity,
        category: alert.category,
        affectedService: alert.serviceName,
        metricsSnapshot: alert.metrics,
      });

    } catch (error) {
      console.error('Error handling fix:', error);
      toast.error('Failed to apply automatic fix');
    }
  };

  const handleCreateTicket = (alert: AlertType) => {
    addTicket({
      title: alert.title,
      description: `${alert.message}\n\nCategory: ${alert.category}\nSeverity: ${alert.severity}\n\nAI Insight:\n${alert.insight?.why || 'No insight available'}`,
      type: alert.severity === 'critical' ? 'incident' : 'alert',
      priority: alert.severity,
      category: alert.category,
      affectedService: alert.serviceName,
      metricsSnapshot: alert.metrics,
    });
    toast.success('Ticket created for this alert');
  };

  return (
    <div className="p-6 space-y-6 overflow-auto h-full">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-orange-500" /> 
            Issues & Alerts
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time DevOps monitoring & alerting system
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={autoDetectionEnabled ? 'default' : 'outline'}
            size="sm"
            onClick={toggleAutoDetection}
          >
            <Power className="w-4 h-4 mr-1" />
            {autoDetectionEnabled ? 'Auto-Detection On' : 'Auto-Detection Off'}
          </Button>
          
          {activeAlerts.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearAllAlerts}
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              Clear All
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div 
          className="panel p-4"
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground">Critical</div>
              <div className="text-2xl font-bold text-red-500">{criticalCount}</div>
            </div>
            <div className="text-3xl">🔴</div>
          </div>
        </motion.div>

        <motion.div 
          className="panel p-4"
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground">High</div>
              <div className="text-2xl font-bold text-orange-500">{highCount}</div>
            </div>
            <div className="text-3xl">🟠</div>
          </div>
        </motion.div>

        <motion.div 
          className="panel p-4"
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground">Medium</div>
              <div className="text-2xl font-bold text-yellow-500">{mediumAlerts.length}</div>
            </div>
            <div className="text-3xl">🟡</div>
          </div>
        </motion.div>

        <motion.div 
          className="panel p-4"
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground">Low</div>
              <div className="text-2xl font-bold text-blue-500">{lowAlerts.length}</div>
            </div>
            <div className="text-3xl">⚪</div>
          </div>
        </motion.div>
      </div>

      {/* Filters */}
      {activeAlerts.length > 0 && (
        <div className="flex items-center gap-3">
          <Filter className="w-4 h-4 text-muted-foreground" />
          
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severities</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <span className="text-sm text-muted-foreground ml-auto">
            {filteredAlerts.length} of {activeAlerts.length} alerts
          </span>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="active" className="w-full">
        <TabsList>
          <TabsTrigger value="active">
            Active Alerts ({activeAlerts.length})
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="w-4 h-4 mr-1" />
            History ({alertHistory.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-3 mt-4">
          {filteredAlerts.length === 0 ? (
            <div className="panel p-12 text-center">
              <div className="text-6xl mb-4">✅</div>
              <h3 className="text-xl font-bold mb-2">All Systems Operational</h3>
              <p className="text-muted-foreground">
                {activeAlerts.length === 0 
                  ? "No active alerts. Your infrastructure is running smoothly!"
                  : "No alerts match the selected filters."}
              </p>
              {!autoDetectionEnabled && (
                <div className="mt-4">
                  <Button onClick={toggleAutoDetection} variant="outline">
                    <Power className="w-4 h-4 mr-2" />
                    Enable Auto-Detection
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {filteredAlerts.map((alert) => (
                <AlertCard
                  key={alert.id}
                  alert={alert}
                  onInvestigate={investigateAlert}
                  onResolve={resolveAlert}
                  onDismiss={dismissAlert}
                  onFixNow={handleFixNow}
                  onLearnMore={setLearningAlert}
                />
              ))}
            </AnimatePresence>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-3 mt-4">
          {alertHistory.length === 0 ? (
            <div className="panel p-8 text-center text-muted-foreground">
              <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No alert history yet</p>
            </div>
          ) : (
            <div>
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-muted-foreground">
                  Showing {alertHistory.length} resolved alerts
                </p>
                <Button variant="ghost" size="sm" onClick={clearHistory}>
                  Clear History
                </Button>
              </div>
              <div className="space-y-2">
                {alertHistory.slice(0, 50).map((alert) => (
                  <AlertCard
                    key={alert.id}
                    alert={alert}
                    onLearnMore={setLearningAlert}
                    compact={false}
                  />
                ))}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Learning Modal */}
      <AlertLearningModal
        alert={learningAlert}
        open={!!learningAlert}
        onClose={() => setLearningAlert(null)}
      />
    </div>
  );
};

export default IssuesPage;
