import { AlertSeverity, Alert } from '@/store/alertStore';
import { 
  AlertTriangle, 
  AlertOctagon, 
  Info, 
  CheckCircle2,
  Clock,
  Eye,
  X,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Zap,
  BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface AlertCardProps {
  alert: Alert;
  onInvestigate?: (id: string) => void;
  onResolve?: (id: string) => void;
  onDismiss?: (id: string) => void;
  onFixNow?: (alert: Alert) => void;
  onLearnMore?: (alert: Alert) => void;
  compact?: boolean;
}

const severityConfig = {
  critical: {
    icon: AlertOctagon,
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
    label: 'Critical',
    emoji: '🔴',
  },
  high: {
    icon: AlertTriangle,
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/30',
    label: 'High',
    emoji: '🟠',
  },
  medium: {
    icon: Info,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/30',
    label: 'Medium',
    emoji: '🟡',
  },
  low: {
    icon: Info,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    label: 'Low',
    emoji: '⚪',
  },
};

const statusConfig = {
  active: {
    icon: AlertTriangle,
    label: 'Active',
    color: 'text-red-400',
  },
 investigating: {
    icon: Eye,
    label: 'Investigating',
    color: 'text-yellow-400',
  },
  resolved: {
    icon: CheckCircle2,
    label: 'Resolved',
    color: 'text-green-400',
  },
};

export function AlertCard({ 
  alert, 
  onInvestigate, 
  onResolve, 
  onDismiss,
  onFixNow,
  onLearnMore,
  compact = false 
}: AlertCardProps) {
  const [expanded, setExpanded] = useState(false);
  const config = severityConfig[alert.severity];
  const statusInfo = statusConfig[alert.status];
  const Icon = config.icon;
  const StatusIcon = statusInfo.icon;

  const timeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  if (compact) {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className={`panel p-3 border-l-4 ${config.borderColor} ${config.bgColor} hover:opacity-90 transition-opacity`}
      >
        <div className="flex items-center gap-3">
          <Icon className={`w-4 h-4 flex-shrink-0 ${config.color}`} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold truncate">{alert.title}</h4>
              {alert.count && alert.count > 1 && (
                <span className="text-xs px-1.5 py-0.5 rounded-full bg-foreground/10">
                  ×{alert.count}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate">{alert.message}</p>
          </div>
          <span className="text-[10px] text-muted-foreground whitespace-nowrap">
            {timeAgo(alert.createdAt)}
          </span>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`panel border-l-4 ${config.borderColor} overflow-hidden`}
    >
      {/* Header */}
      <div className={`p-4 ${config.bgColor}`}>
        <div className="flex items-start gap-3">
          <Icon className={`w-6 h-6 flex-shrink-0 mt-0.5 ${config.color}`} />
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-base font-bold">{alert.title}</h3>
              {alert.count && alert.count > 1 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-foreground/20 font-medium">
                  {alert.count} instances
                </span>
              )}
              <span className={`text-xs px-2 py-0.5 rounded-full ${config.bgColor} ${config.color} font-medium`}>
                {config.label}
              </span>
              <StatusIcon className={`w-4 h-4 ${statusInfo.color}`} />
            </div>
            
            <p className="text-sm text-foreground/80 mb-2">{alert.message}</p>
            
            {/* Metadata */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{timeAgo(alert.createdAt)}</span>
              </div>
              
              {alert.category && (
                <span className="px-2 py-0.5 rounded bg-foreground/10">
                  {alert.category}
                </span>
              )}
              
              {alert.serviceName && (
                <span>Service: {alert.serviceName}</span>
              )}
              
              {alert.affectedResources && alert.affectedResources.length > 0 && (
                <span>{alert.affectedResources.length} affected</span>
              )}
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex items-start gap-1">
            {alert.status === 'active' && onDismiss && (
              <button
                onClick={() => onDismiss(alert.id)}
                className="p-1.5 hover:bg-foreground/10 rounded transition-colors"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1.5 hover:bg-foreground/10 rounded transition-colors"
              title={expanded ? "Collapse" : "Expand"}
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
      
      {/* Expandable Content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-border/50"
          >
            <div className="p-4 space-y-4">
              {/* Metrics */}
              {alert.metrics && Object.keys(alert.metrics).length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    Metrics
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {Object.entries(alert.metrics).map(([key, value]) => (
                      <div key={key} className="px-3 py-2 rounded bg-foreground/5">
                        <div className="text-xs text-muted-foreground capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </div>
                        <div className="font-mono font-semibold">{value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* AI Insights */}
              {alert.insight && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-yellow-500" />
                    AI DevOps Insights
                  </h4>
                  
                  <div className="space-y-2 text-sm">
                    <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                      <div className="font-semibold text-blue-400 mb-1">Why it happened:</div>
                      <p className="text-foreground/80">{alert.insight.why}</p>
                    </div>
                    
                    <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                      <div className="font-semibold text-orange-400 mb-1">Impact:</div>
                      <p className="text-foreground/80">{alert.insight.impact}</p>
                    </div>
                    
                    <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                      <div className="font-semibold text-green-400 mb-1">Recommendation:</div>
                      <p className="text-foreground/80">{alert.insight.recommendation}</p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Affected Resources */}
              {alert.affectedResources && alert.affectedResources.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">Affected Resources</h4>
                  <div className="flex flex-wrap gap-2">
                    {alert.affectedResources.map((resource, idx) => (
                      <span 
                        key={idx}
                        className="px-2 py-1 text-xs rounded bg-foreground/10 font-mono"
                      >
                        {resource}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 pt-2 border-t border-border/50">
                {alert.status === 'active' && onFixNow && (
                  <Button
                    onClick={() => onFixNow(alert)}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Zap className="w-4 h-4 mr-1" />
                    Fix Now
                  </Button>
                )}
                
                {alert.status === 'active' && onInvestigate && (
                  <Button
                    onClick={() => onInvestigate(alert.id)}
                    size="sm"
                    variant="outline"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Investigate
                  </Button>
                )}
                
                {(alert.status === 'active' || alert.status === 'investigating') && onResolve && (
                  <Button
                    onClick={() => onResolve(alert.id)}
                    size="sm"
                    variant="outline"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-1" />
                    Mark Resolved
                  </Button>
                )}
                
                {onLearnMore && (
                  <Button
                    onClick={() => onLearnMore(alert)}
                    size="sm"
                    variant="ghost"
                  >
                    <BookOpen className="w-4 h-4 mr-1" />
                    Learn More
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
