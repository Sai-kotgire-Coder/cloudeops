import React, { useEffect, useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Rocket, Check } from 'lucide-react';
import { usePaymentHandler } from './usePaymentHandler';
import { useToast } from '../../hooks/use-toast';

interface PricingPlan {
  name: string;
  price: number;
  currency: string;
  duration: string;
  features: string[];
  limits: any;
  buttonText?: string;
}

interface PricingData {
  free: PricingPlan;
  pro: PricingPlan;
}

export const PricingPage: React.FC = () => {
  const [pricing, setPricing] = useState<PricingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userPlan, setUserPlan] = useState<any>(null);
  const { toast } = useToast();
  const { initializePayment, isLoading: isPaymentLoading } = usePaymentHandler({
    onPaymentSuccess: (details) => {
      // Refresh user plan after successful payment
      fetchUserPlan();
    },
    onPaymentError: (error) => {
      console.error('Payment error:', error);
    },
  });

  const fetchPricingData = async () => {
    try {
      const response = await fetch('/api/payment/pricing');
      if (!response.ok) throw new Error('Failed to fetch pricing');
      const data = await response.json();
      setPricing(data);
    } catch (error: any) {
      console.error('Error fetching pricing:', error);
      toast({
        title: 'Error',
        description: 'Failed to load pricing information',
        variant: 'destructive',
      });
    }
  };

  const fetchUserPlan = async () => {
    try {
      const response = await fetch('/api/payment/plan', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setUserPlan(data);
      }
    } catch (error) {
      console.error('Error fetching user plan:', error);
    }
  };

  useEffect(() => {
    Promise.all([fetchPricingData(), fetchUserPlan()]).finally(() => {
      setIsLoading(false);
    });
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-950 dark:to-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading pricing information...</p>
        </div>
      </div>
    );
  }

  if (!pricing) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-950 dark:to-slate-900">
        <p className="text-red-500 dark:text-red-400">Failed to load pricing information</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-950 dark:to-slate-900 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Choose the plan that fits your needs
          </p>
          {userPlan && (
            <div className="mt-4 inline-block bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg px-4 py-2">
              <p className="text-sm font-semibold text-blue-900 dark:text-blue-200">
                Current Plan: <span className="uppercase">{userPlan.planType}</span>
              </p>
            </div>
          )}
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Free Plan */}
          <Card className="flex flex-col border-2 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition bg-white dark:bg-slate-900">
            <div className="p-8 flex-1 flex flex-col">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {pricing.free.name}
              </h3>
              <div className="mb-6">
                <span className="text-5xl font-bold text-gray-900 dark:text-white">
                  ₹{pricing.free.price}
                </span>
                <span className="text-gray-600 dark:text-gray-400 ml-2">{pricing.free.duration}</span>
              </div>

              <p className="text-gray-600 dark:text-gray-400 mb-8">
                Perfect for learning and experimentation
              </p>

              <Button
                disabled={userPlan?.planType === 'free'}
                className="w-full mb-8 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                {userPlan?.planType === 'free' ? 'Current Plan' : 'Get Started'}
              </Button>

              <div className="space-y-4">
                <p className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                  What's included:
                </p>
                {pricing.free.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                  Limits:
                </p>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li>
                    Instances: <span className="font-semibold text-gray-900 dark:text-gray-200">{pricing.free.limits.maxInstances}</span>
                  </li>
                  <li>
                    Applications: <span className="font-semibold text-gray-900 dark:text-gray-200">{pricing.free.limits.maxApplications}</span>
                  </li>
                  <li>
                    Pipelines: <span className="font-semibold text-gray-900 dark:text-gray-200">{pricing.free.limits.maxPipelines}</span>
                  </li>
                  <li>
                    Containers: <span className="font-semibold text-gray-900 dark:text-gray-200">{pricing.free.limits.maxContainers}</span>
                  </li>
                </ul>
              </div>
            </div>
          </Card>

          {/* Pro Plan */}
          <Card className="flex flex-col border-2 border-blue-500 dark:border-blue-500 shadow-lg hover:shadow-xl transition transform hover:scale-105 bg-white dark:bg-slate-900">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 text-white px-8 py-4 rounded-t-lg">
              <div className="flex items-center gap-2">
                <Rocket className="w-6 h-6" />
                <span className="text-sm font-semibold">MOST POPULAR</span>
              </div>
            </div>

            <div className="p-8 flex-1 flex flex-col">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {pricing.pro.name}
              </h3>
              <div className="mb-6">
                <span className="text-5xl font-bold text-blue-600 dark:text-blue-400">
                  ₹{pricing.pro.price}
                </span>
                <span className="text-gray-600 dark:text-gray-400 ml-2">{pricing.pro.duration}</span>
              </div>

              <p className="text-gray-600 dark:text-gray-400 mb-8">
                Everything you need to master DevOps
              </p>

              <Button
                onClick={initializePayment}
                disabled={
                  isPaymentLoading ||
                  userPlan?.planType === 'pro'
                }
                className="w-full mb-8 bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2"
              >
                <Rocket className="w-4 h-4" />
                {isPaymentLoading
                  ? 'Processing...'
                  : userPlan?.planType === 'pro'
                  ? 'Current Plan'
                  : pricing.pro.buttonText || 'Upgrade Now'}
              </Button>

              <div className="space-y-4">
                <p className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                  What's included:
                </p>
                {pricing.pro.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                  Limits:
                </p>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li>
                    Instances: <span className="font-semibold text-green-600 dark:text-green-400">Unlimited</span>
                  </li>
                  <li>
                    Applications: <span className="font-semibold text-green-600 dark:text-green-400">Unlimited</span>
                  </li>
                  <li>
                    Pipelines: <span className="font-semibold text-green-600 dark:text-green-400">Unlimited</span>
                  </li>
                  <li>
                    Containers: <span className="font-semibold text-green-600 dark:text-green-400">Unlimited</span>
                  </li>
                </ul>
              </div>
            </div>
          </Card>
        </div>

        {/* FAQ Section */}
        <div className="mt-16 bg-white dark:bg-slate-900 rounded-lg p-8 shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">
            Frequently Asked Questions
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Can I cancel anytime?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Yes! The Pro plan is on a 30-day subscription. You can cancel anytime without any charges.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Is there a trial?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Start with the Free plan to explore all features. Upgrade to Pro anytime you're ready.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                What if I need more help?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Pro users get priority support. Contact us anytime for assistance.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Can I upgrade from Free?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Absolutely! You can upgrade to Pro anytime from the pricing page or when hitting a limit.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center">
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
            Ready to take your skills to the next level?
          </p>
          <Button
            onClick={initializePayment}
            disabled={isPaymentLoading || userPlan?.planType === 'pro'}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Rocket className="w-5 h-5 mr-2" />
            {userPlan?.planType === 'pro' ? 'Already Pro!' : 'Upgrade Now - ₹99'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;
