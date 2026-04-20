/**
 * EXAMPLE: How to Integrate Payment Components with Your UI
 * 
 * This file shows examples of integrating the payment system
 * with various components. Copy and adapt these patterns to your components.
 */

import React, { useState } from 'react';
import { usePaymentHandler, usePlanCheck, UpgradeModal, UpgradeCTA } from '@/components/payment';
import { FeatureLock, ProBadge } from '@/components/payment';

/**
 * EXAMPLE 1: Instances List with Feature Gating
 */
export function InstancesListExample() {
  const { isPro, usage, canCreateResource } = usePlanCheck();
  const { initializePayment, isLoading: isPaymentLoading } = usePaymentHandler({
    onPaymentSuccess: () => {
      // Refresh the instances list after successful upgrade
      window.location.reload();
    },
  });

  const [showUpgrade, setShowUpgrade] = useState(false);

  const handleCreateInstance = () => {
    if (!canCreateResource('instances')) {
      setShowUpgrade(true);
      return;
    }

    // Proceed with instance creation
    // Your existing logic here
  };

  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <div className="flex justify-between items-center">
        <h1>Cloud Instances</h1>
        <button
          onClick={handleCreateInstance}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          + Create Instance
        </button>
      </div>

      {/* Show usage warning for free users */}
      {!isPro && usage && (
        <div className="bg-orange-50 border border-orange-200 rounded p-4">
          <p className="text-sm text-orange-800">
            Free Plan: {usage.usage.instances.current} of{' '}
            {usage.usage.instances.limit} instances used
          </p>
        </div>
      )}

      {/* Instances List */}
      <div className="grid gap-4">
        {/* Your instances would render here */}
      </div>

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        onUpgrade={initializePayment}
        resourceType="instances"
        current={usage?.usage.instances.current || 0}
        limit={usage?.usage.instances.limit || 1}
        features={[
          'Unlimited cloud instances',
          'Advanced monitoring & analytics',
          'Auto-scaling capabilities',
          'Priority technical support',
          'Custom security policies',
        ]}
        isLoading={isPaymentLoading}
      />
    </div>
  );
}

/**
 * EXAMPLE 2: Applications with Pro Banner
 */
export function ApplicationsListExample() {
  const { isPro, usage } = usePlanCheck();
  const { initializePayment } = usePaymentHandler();

  return (
    <div>
      {/* Show banner for free users */}
      {!isPro && usage && (
        <UpgradeCTA
          resourceType="Applications"
          current={usage.usage.applications.current}
          limit={usage.usage.applications.limit}
          onUpgradeClick={initializePayment}
        />
      )}

      <div className="grid gap-4 mt-6">
        {/* Applications list */}
      </div>
    </div>
  );
}

/**
 * EXAMPLE 3: Advanced Dashboard Features (Pro-only)
 */
export function DashboardAdvancedFeaturesExample() {
  const { isPro } = usePlanCheck();

  return (
    <div className="space-y-4">
      {/* Regular feature available to all */}
      <div className="border rounded p-4">
        <h3>Basic Monitoring</h3>
        <p>Server health status and basic metrics</p>
      </div>

      {/* Pro-only feature with lock */}
      <FeatureLock
        isLocked={!isPro}
        featureName="Advanced Analytics"
        onUpgradeClick={() => window.location.href = '/pricing'}
      >
        <div className="border-2 border-purple-200 rounded p-4 bg-purple-50">
          <h3 className="flex items-center gap-2">
            Advanced Analytics Dashboard
            <ProBadge size="sm" />
          </h3>
          <p>Real-time metrics, custom dashboards, and predictive analytics</p>
          <div className="mt-4 space-y-2">
            <div className="h-20 bg-purple-100 rounded animate-pulse" />
            <div className="h-20 bg-purple-100 rounded animate-pulse" />
          </div>
        </div>
      </FeatureLock>

      {/* Another pro feature */}
      <FeatureLock
        isLocked={!isPro}
        featureName="Custom Reports"
      >
        <div className="border-2 border-blue-200 rounded p-4 bg-blue-50">
          <h3 className="flex items-center gap-2">
            Custom Reports
            <ProBadge size="sm" />
          </h3>
          <p>Generate custom reports with your own metrics and filters</p>
        </div>
      </FeatureLock>
    </div>
  );
}

/**
 * EXAMPLE 4: Pipelines with Usage Stats
 */
export function PipelinesListExample() {
  const { isPro, usage, getUsagePercentage, isApproachingLimit } = usePlanCheck();
  const { initializePayment } = usePaymentHandler();

  const pipelineUsagePercent = getUsagePercentage('pipelines');
  const isNearLimit = isApproachingLimit('pipelines', 75);

  return (
    <div className="space-y-6">
      <h1>CI/CD Pipelines</h1>

      {/* Usage bar for free users */}
      {!isPro && usage && (
        <div>
          <div className="flex justify-between mb-2">
            <p className="text-sm font-medium">Pipeline Usage</p>
            <p className="text-sm text-gray-600">
              {usage.usage.pipelines.current} / {usage.usage.pipelines.limit}
            </p>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                isNearLimit ? 'bg-red-500' : 'bg-blue-500'
              }`}
              style={{ width: `${Math.min(pipelineUsagePercent, 100)}%` }}
            />
          </div>
          {isNearLimit && (
            <p className="text-sm text-red-600 mt-2">
              ⚠️ You're approaching your pipeline limit
            </p>
          )}
        </div>
      )}

      {/* Upgrade CTA if at limit */}
      {!isPro && usage && usage.usage.pipelines.current >= usage.usage.pipelines.limit && (
        <button
          onClick={initializePayment}
          className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition"
        >
          🚀 Upgrade to Pro to Create More Pipelines
        </button>
      )}

      {/* Pipelines list */}
      <div className="grid gap-4">
        {/* Pipeline items */}
      </div>
    </div>
  );
}

/**
 * EXAMPLE 5: Resource Creation with Pre-check
 */
export function CreateResourceExample() {
  const { isPro, canCreateResource } = usePlanCheck();
  const { initializePayment } = usePaymentHandler();
  const [canProceed, setCanProceed] = useState(true);

  const handleCreate = async () => {
    // Check if user can create this resource
    if (!canCreateResource('containers')) {
      // Show upgrade modal or redirect
      initializePayment();
      return;
    }

    // Proceed with creation
    // Your API call here
  };

  return (
    <form onSubmit={handleCreate} className="space-y-4">
      <input
        type="text"
        placeholder="Resource name"
        className="w-full border rounded px-3 py-2"
      />

      {!canProceed && (
        <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
          <p className="text-sm text-yellow-800">
            You've reached your resource limit on the Free plan. Upgrade to Pro to continue.
          </p>
        </div>
      )}

      <button
        type="submit"
        disabled={!canProceed}
        className="w-full bg-blue-600 text-white py-2 rounded disabled:opacity-50"
      >
        Create
      </button>
    </form>
  );
}

/**
 * EXAMPLE 6: Header Component with Plan Status
 */
export function HeaderWithPlanExample() {
  const { plan, usage, isPro } = usePlanCheck();
  const { initializePayment } = usePaymentHandler();

  return (
    <header className="bg-white border-b p-4 flex justify-between items-center">
      <h1>CloudOps Simulator</h1>

      <div className="flex items-center gap-4">
        {/* Plan Badge */}
        {plan && (
          <div
            className={`px-4 py-2 rounded-full text-sm font-semibold ${
              isPro
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                : 'bg-gray-200 text-gray-800'
            }`}
          >
            {isPro ? '✨ Pro User' : '📝 Free Plan'}
          </div>
        )}

        {/* Usage popover (available in free tier) */}
        {usage && !isPro && (
          <div
            className="relative group"
            title="Click to see detailed usage"
          >
            <div className="cursor-pointer text-sm text-gray-600 hover:text-gray-900">
              📊 {Object.values(usage.usage).reduce((acc, r) => acc + r.current, 0)}/
              {Object.values(usage.usage).reduce((acc, r) => acc + r.limit, 0)} Resources
            </div>
            {/* Tooltip on hover */}
            <div className="hidden group-hover:block absolute right-0 mt-2 bg-gray-900 text-white p-4 rounded shadow-lg z-10 w-max">
              <p className="text-xs">Instances: {usage.usage.instances.current}/{usage.usage.instances.limit}</p>
              <p className="text-xs">Applications: {usage.usage.applications.current}/{usage.usage.applications.limit}</p>
              <p className="text-xs">Pipelines: {usage.usage.pipelines.current}/{usage.usage.pipelines.limit}</p>
            </div>
          </div>
        )}

        {/* Upgrade button for free users */}
        {!isPro && (
          <button
            onClick={initializePayment}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-semibold flex items-center gap-2"
          >
            🚀 Upgrade
          </button>
        )}

        {/* User menu */}
        <div className="text-right">
          <p className="text-sm font-medium">{plan?.email}</p>
          <p className="text-xs text-gray-500">{plan?.planType === 'pro' ? 'Pro' : 'Free'}</p>
        </div>
      </div>
    </header>
  );
}

export default {
  InstancesListExample,
  ApplicationsListExample,
  DashboardAdvancedFeaturesExample,
  PipelinesListExample,
  CreateResourceExample,
  HeaderWithPlanExample,
};
