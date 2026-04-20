import React, { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { Button } from '../ui/button';
import { Rocket, Zap } from 'lucide-react';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  resourceType?: string;
  current?: number;
  limit?: number;
  features?: string[];
  isLoading?: boolean;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({
  isOpen,
  onClose,
  onUpgrade,
  resourceType = 'resources',
  current = 0,
  limit = 1,
  features = [],
  isLoading = false,
}) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-md dark:bg-slate-900 dark:border-slate-700">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 dark:text-white">
            <Rocket className="w-5 h-5 text-blue-500" />
            Upgrade to Pro Plan
          </AlertDialogTitle>
          <AlertDialogDescription className="pt-4">
            <div className="space-y-4">
              <div>
                <p className="font-semibold text-gray-900 dark:text-white mb-2">
                  You've reached your limit for {resourceType}
                </p>
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-3 mb-4">
                  <p className="text-sm text-red-800 dark:text-red-300">
                    Current usage: <span className="font-bold">{current}</span> of{' '}
                    <span className="font-bold">{limit}</span> allowed
                  </p>
                </div>
              </div>

              <div>
                <p className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-500" />
                  Pro Plan Includes
                </p>
                <ul className="space-y-2">
                  {features.length > 0 ? (
                    features.map((feature, idx) => (
                      <li key={idx} className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <span className="text-green-500">✓</span>
                        {feature}
                      </li>
                    ))
                  ) : (
                    <>
                      <li className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <span className="text-green-500">✓</span>
                        Unlimited {resourceType}
                      </li>
                      <li className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <span className="text-green-500">✓</span>
                        Advanced monitoring
                      </li>
                      <li className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <span className="text-green-500">✓</span>
                        Priority support
                      </li>
                      <li className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <span className="text-green-500">✓</span>
                        Custom configurations
                      </li>
                    </>
                  )}
                </ul>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded p-3">
                <p className="text-sm font-semibold text-blue-900 dark:text-blue-200">
                  Only ₹99 for 30 days
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                  Cancel anytime, no commitment
                </p>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex gap-3 justify-end">
          <AlertDialogCancel className="dark:text-white dark:bg-slate-800 dark:hover:bg-slate-700">Maybe Later</AlertDialogCancel>
          <AlertDialogAction
            onClick={onUpgrade}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin">⏳</span>
                Processing...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Rocket className="w-4 h-4" />
                Upgrade Now
              </span>
            )}
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default UpgradeModal;
