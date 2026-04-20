import React from 'react';
import { Lock, Rocket } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';
import { Button } from '../ui/button';

interface FeatureLockProps {
  isLocked: boolean;
  featureName: string;
  onUpgradeClick?: () => void;
  children?: React.ReactNode;
  className?: string;
}

export const FeatureLock: React.FC<FeatureLockProps> = ({
  isLocked,
  featureName,
  onUpgradeClick,
  children,
  className = '',
}) => {
  if (!isLocked) {
    return <>{children}</>;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={`relative opacity-60 pointer-events-none transition ${className}`}
          >
            <div className="absolute inset-0 bg-black/5 rounded-lg z-10" />
            <div className="absolute inset-0 flex items-center justify-center z-20">
              <div className="bg-white rounded-lg shadow-lg p-3 flex items-center gap-2">
                <Lock className="w-4 h-4 text-orange-500" />
                <span className="text-sm font-semibold text-gray-700">
                  Pro Only
                </span>
              </div>
            </div>
            <div className="pointer-events-auto">
              {children}
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-2">
            <p className="text-sm font-semibold">{featureName} available in Pro Plan</p>
            <Button
              size="sm"
              variant="outline"
              onClick={onUpgradeClick}
              className="w-full text-xs flex items-center justify-center gap-1"
              disabled={!onUpgradeClick}
            >
              <Rocket className="w-3 h-3" />
              Upgrade
            </Button>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

/**
 * Pro Badge - Display on Pro-only features
 */
export const ProBadge: React.FC<{ size?: 'sm' | 'md' }> = ({ size = 'sm' }) => {
  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1';
  
  return (
    <span
      className={`inline-flex items-center gap-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-full ${sizeClass}`}
    >
      <Rocket className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />
      Pro
    </span>
  );
};

/**
 * Upgrade CTA Card - Used when users hit a limit
 */
interface UpgradeCTAProps {
  resourceType: string;
  current: number;
  limit: number;
  onUpgradeClick?: () => void;
}

export const UpgradeCTA: React.FC<UpgradeCTAProps> = ({
  resourceType,
  current,
  limit,
  onUpgradeClick,
}) => {
  return (
    <div className="border-2 border-orange-200 bg-orange-50 rounded-lg p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-semibold text-gray-900 mb-1">
            {resourceType} Limit Reached
          </p>
          <p className="text-sm text-gray-600 mb-3">
            You're using {current} of {limit} allowed {resourceType.toLowerCase()}
          </p>
          <p className="text-sm text-orange-700 font-medium">
            Upgrade to Pro to get unlimited {resourceType.toLowerCase()}
          </p>
        </div>
      </div>
      {onUpgradeClick && (
        <Button
          onClick={onUpgradeClick}
          size="sm"
          className="mt-4 bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto flex items-center justify-center gap-2"
        >
          <Rocket className="w-4 h-4" />
          Upgrade Now
        </Button>
      )}
    </div>
  );
};

export default FeatureLock;
