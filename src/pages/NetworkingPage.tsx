import { useState, useEffect } from 'react';
import { useNetworkStore } from '@/store/networkStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TopNavBar } from '@/components/game/TopNavBar';
import { Play, Pause, RotateCcw, Plus, Network, Server, Globe, Activity } from 'lucide-react';
import { IngressPanel } from '@/components/networking/IngressPanel';
import { ServicePanel } from '@/components/networking/ServicePanel';
import { LoadBalancerPanel } from '@/components/networking/LoadBalancerPanel';
import { PodPanel } from '@/components/networking/PodPanel';
import { TrafficVisualization } from '@/components/networking/TrafficVisualization';
import { NetworkAlerts } from '@/components/networking/NetworkAlerts';
import { NetworkingTutorial } from '@/components/networking/NetworkingTutorial';

const NetworkingPage = () => {
  const {
    pods,
    services,
    loadBalancers,
    ingresses,
    isSimulationRunning,
    globalTraffic,
    setGlobalTraffic,
    startSimulation,
    stopSimulation,
    simulationTick,
    resetSimulation,
    alerts,
  } = useNetworkStore();

  // Simulation loop
  useEffect(() => {
    if (!isSimulationRunning) return;

    const interval = setInterval(() => {
      simulationTick();
    }, 1000); // Tick every second

    return () => clearInterval(interval);
  }, [isSimulationRunning, simulationTick]);

  const handleTrafficChange = (value: number[]) => {
    setGlobalTraffic(value[0]);
  };

  const toggleSimulation = () => {
    if (isSimulationRunning) {
      stopSimulation();
    } else {
      startSimulation();
    }
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset the simulation? All data will be lost.')) {
      resetSimulation();
    }
  };

  // Stats
  const totalPods = pods.length;
  const runningPods = pods.filter(p => p.status === 'running').length;
  const totalServices = services.length;
  const activeIngresses = ingresses.filter(i => i.status === 'active').length;
  const activeAlerts = alerts.filter(a => !a.dismissed).length;

  return (
    <div className="min-h-screen bg-[#0B0F1A]">
      <TopNavBar />
      
      <div className="container mx-auto p-4 space-y-4 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-2">
              <Network className="w-8 h-8" />
              Networking Simulator
            </h1>
            <p className="text-gray-300 mt-1">
              Learn how traffic flows through Ingress → Service → Pods
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              onClick={toggleSimulation}
              variant={isSimulationRunning ? 'destructive' : 'default'}
              className="gap-2"
            >
              {isSimulationRunning ? (
                <>
                  <Pause className="w-4 h-4" />
                  Stop
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Start
                </>
              )}
            </Button>

            <Button onClick={handleReset} variant="outline" className="gap-2">
              <RotateCcw className="w-4 h-4" />
              Reset
            </Button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400">Traffic (RPS)</p>
                  <p className="text-2xl font-bold text-white">{globalTraffic}</p>
                </div>
                <Activity className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400">Ingresses</p>
                  <p className="text-2xl font-bold text-white">
                    {activeIngresses}/{ingresses.length}
                  </p>
                </div>
                <Globe className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400">Services</p>
                  <p className="text-2xl font-bold text-white">{totalServices}</p>
                </div>
                <Network className="w-8 h-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400">Pods</p>
                  <p className="text-2xl font-bold text-white">
                    {runningPods}/{totalPods}
                  </p>
                </div>
                <Server className="w-8 h-8 text-orange-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400">Alerts</p>
                  <p className="text-2xl font-bold text-white">{activeAlerts}</p>
                </div>
                <Badge variant={activeAlerts > 0 ? 'destructive' : 'default'}>
                  {activeAlerts > 0 ? 'Active' : 'Clear'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Traffic Control */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Traffic Control
            </CardTitle>
            <CardDescription>
              Simulate incoming traffic to test your networking setup
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-400 min-w-[80px]">0 RPS</span>
                <Slider
                  value={[globalTraffic]}
                  onValueChange={handleTrafficChange}
                  max={1000}
                  step={10}
                  className="flex-1"
                />
                <span className="text-sm text-gray-400 min-w-[80px] text-right">1000 RPS</span>
              </div>
              <div className="text-center">
                <span className="text-3xl font-bold text-white">{globalTraffic}</span>
                <span className="text-gray-400 ml-2">requests per second</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs defaultValue="visualization" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-5">
            <TabsTrigger value="visualization">Visualization</TabsTrigger>
            <TabsTrigger value="ingress">Ingress</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="pods">Pods</TabsTrigger>
            <TabsTrigger value="tutorial">Tutorial</TabsTrigger>
          </TabsList>

          <TabsContent value="visualization" className="space-y-4">
            <TrafficVisualization />
            <NetworkAlerts />
          </TabsContent>

          <TabsContent value="ingress" className="space-y-4">
            <IngressPanel />
          </TabsContent>

          <TabsContent value="services" className="space-y-4">
            <ServicePanel />
            <LoadBalancerPanel />
          </TabsContent>

          <TabsContent value="pods" className="space-y-4">
            <PodPanel />
          </TabsContent>

          <TabsContent value="tutorial" className="space-y-4">
            <NetworkingTutorial />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default NetworkingPage;
