// Kept separate from paymentService.ts (which constructs a Razorpay client
// at module load time, and throws immediately without real credentials) so
// this pure business logic can be imported and tested without pulling in
// the Razorpay SDK at all.
export function getUsageLimits(isPro: boolean) {
  return {
    maxInstances: isPro ? Infinity : 1,
    maxApplications: isPro ? Infinity : 1,
    maxPipelines: isPro ? Infinity : 2,
    maxContainers: isPro ? Infinity : 3,
    maxScenarios: isPro ? Infinity : 1,
    maxTickets: isPro ? Infinity : 5,
    storageGB: isPro ? 100 : 5
  };
}
