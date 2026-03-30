import { AlertSeverity } from '@/store/alertStore';
import { AlertOctagon, AlertTriangle, Info } from 'lucide-react';

interface SeverityBadgeProps {
  severity: AlertSeverity;
  count?: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const severityConfig = {
  critical: {
    icon: AlertOctagon,
    color: 'text-red-500',
    bgColor: 'bg-red-500/20',
    borderColor: 'border-red-500/50',
    label: 'Critical',
    emoji: '🔴',
  },
  high: {
    icon: AlertTriangle,
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/20',
    borderColor: 'border-orange-500/50',
    label: 'High',
    emoji: '🟠',
  },
  medium: {
    icon: Info,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/20',
    borderColor: 'border-yellow-500/50',
    label: 'Medium',
    emoji: '🟡',
  },
  low: {
    icon: Info,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/20',
    borderColor: 'border-blue-500/50',
    label: 'Low',
    emoji: '⚪',
  },
};

const sizeConfig = {
  sm: {
    text: 'text-xs',
    icon: 'w-3 h-3',
    padding: 'px-2 py-0.5',
  },
  md: {
    text: 'text-sm',
    icon: 'w-4 h-4',
    padding: 'px-3 py-1',
  },
  lg: {
    text: 'text-base',
    icon: 'w-5 h-5',
    padding: 'px-4 py-1.5',
  },
};

export function SeverityBadge({ 
  severity, 
  count, 
  showLabel = true,
  size = 'md' 
}: SeverityBadgeProps) {
  const config = severityConfig[severity];
  const sizeClass = sizeConfig[size];
  const Icon = config.icon;

  return (
    <div className={`inline-flex items-center gap-1.5 rounded-full ${config.bgColor} ${config.borderColor} border ${sizeClass.padding}`}>
      <Icon className={`${sizeClass.icon} ${config.color}`} />
      {showLabel && (
        <span className={`${sizeClass.text} ${config.color} font-medium`}>
          {config.label}
        </span>
      )}
      {count !== undefined && count > 0 && (
        <span className={`${sizeClass.text} ${config.color} font-bold`}>
          {count}
        </span>
      )}
    </div>
  );
}

interface AlertStatsProps {
  critical: number;
  high: number;
  medium: number;
  low: number;
  compact?: boolean;
}

export function AlertStats({ critical, high, medium, low, compact = false }: AlertStatsProps) {
  const total = critical + high + medium + low;
  
  if (total === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="text-lg">✅</span>
        <span>No active alerts</span>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {critical > 0 && (
          <span className="flex items-center gap-1 text-xs text-red-500">
            🔴 {critical}
          </span>
        )}
        {high > 0 && (
          <span className="flex items-center gap-1 text-xs text-orange-500">
            🟠 {high}
          </span>
        )}
        {medium > 0 && (
          <span className="flex items-center gap-1 text-xs text-yellow-500">
            🟡 {medium}
          </span>
        )}
        {low > 0 && (
          <span className="flex items-center gap-1 text-xs text-blue-500">
            ⚪ {low}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {critical > 0 && <SeverityBadge severity="critical" count={critical} size="sm" />}
      {high > 0 && <SeverityBadge severity="high" count={high} size="sm" />}
      {medium > 0 && <SeverityBadge severity="medium" count={medium} size="sm" />}
      {low > 0 && <SeverityBadge severity="low" count={low} size="sm" />}
    </div>
  );
}
