// Payment Components & Hooks
export { UpgradeModal } from './UpgradeModal';
export { PricingPage } from './PricingPage';
export { FeatureLock, ProBadge, UpgradeCTA } from './FeatureLock';
export { usePaymentHandler } from './usePaymentHandler';
export { usePlanCheck } from './usePlanCheck';

export default {
  UpgradeModal: require('./UpgradeModal').UpgradeModal,
  PricingPage: require('./PricingPage').PricingPage,
  FeatureLock: require('./FeatureLock').FeatureLock,
  ProBadge: require('./FeatureLock').ProBadge,
  UpgradeCTA: require('./FeatureLock').UpgradeCTA,
  usePaymentHandler: require('./usePaymentHandler').default,
  usePlanCheck: require('./usePlanCheck').default,
};
