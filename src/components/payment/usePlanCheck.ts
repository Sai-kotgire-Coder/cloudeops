import { useState, useEffect, useCallback } from 'react';
import { useToast } from '../../hooks/use-toast';

interface UserPlan {
  id: string;
  email: string;
  isPro: boolean;
  planType: 'free' | 'pro';
  planExpiry?: string;
  isExpired?: boolean;
  limits?: {
    maxInstances: number;
    maxApplications: number;
    maxPipelines: number;
    maxContainers: number;
    maxScenarios: number;
    maxTickets: number;
    storageGB: number;
  };
}

interface ResourceUsage {
  plan: string;
  usage: {
    instances: { current: number; limit: number };
    applications: { current: number; limit: number };
    pipelines: { current: number; limit: number };
    containers: { current: number; limit: number };
    tickets: { current: number; limit: number };
  };
}

export const usePlanCheck = () => {
  const [plan, setPlan] = useState<UserPlan | null>(null);
  const [usage, setUsage] = useState<ResourceUsage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchPlanDetails = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('authToken');

      if (!token) {
        setError('Not authenticated');
        return;
      }

      const response = await fetch('/api/payment/plan', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch plan');

      const data = await response.json();
      setPlan(data);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching plan:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchUsage = useCallback(async () => {
    try {
      const token = localStorage.getItem('authToken');

      if (!token) {
        setError('Not authenticated');
        return;
      }

      const response = await fetch('/api/payment/usage', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch usage');

      const data = await response.json();
      setUsage(data);
    } catch (err: any) {
      console.error('Error fetching usage:', err);
    }
  }, []);

  useEffect(() => {
    Promise.all([fetchPlanDetails(), fetchUsage()]);
  }, [fetchPlanDetails, fetchUsage]);

  /**
   * Check if user can create more of a resource
   */
  const canCreateResource = useCallback(
    (resourceType: 'instances' | 'applications' | 'pipelines' | 'containers' | 'tickets'): boolean => {
      if (!usage) return false;

      const resource = usage.usage[resourceType];
      return resource.current < resource.limit;
    },
    [usage]
  );

  /**
   * Get remaining count for a resource
   */
  const getRemainCount = useCallback(
    (resourceType: 'instances' | 'applications' | 'pipelines' | 'containers' | 'tickets'): number => {
      if (!usage) return 0;

      const resource = usage.usage[resourceType];
      return Math.max(0, resource.limit - resource.current);
    },
    [usage]
  );

  /**
   * Get usage percentage for a resource
   */
  const getUsagePercentage = useCallback(
    (resourceType: 'instances' | 'applications' | 'pipelines' | 'containers' | 'tickets'): number => {
      if (!usage) return 0;

      const resource = usage.usage[resourceType];
      if (resource.limit === Infinity) return 0;
      return (resource.current / resource.limit) * 100;
    },
    [usage]
  );

  /**
   * Check if user is approaching limit
   */
  const isApproachingLimit = useCallback(
    (resourceType: 'instances' | 'applications' | 'pipelines' | 'containers' | 'tickets',
     threshold: number = 80
    ): boolean => {
      const percentage = getUsagePercentage(resourceType);
      return percentage >= threshold;
    },
    [getUsagePercentage]
  );

  /**
   * Refresh both plan and usage data
   */
  const refresh = useCallback(async () => {
    await Promise.all([fetchPlanDetails(), fetchUsage()]);
  }, [fetchPlanDetails, fetchUsage]);

  return {
    plan,
    usage,
    isLoading,
    error,
    isPro: plan?.isPro || false,
    canCreateResource,
    getRemainCount,
    getUsagePercentage,
    isApproachingLimit,
    refresh,
  };
};

export default usePlanCheck;
