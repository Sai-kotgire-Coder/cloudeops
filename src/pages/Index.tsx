import { useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import { TopNavBar } from '@/components/game/TopNavBar';
import { MetricsPanel } from '@/components/game/MetricsPanel';
import { AlertOverlay } from '@/components/game/AlertOverlay';
import { TutorialOverlay } from '@/components/game/TutorialOverlay';
import { ScenarioBanner } from '@/components/game/ScenarioBanner';
import { HintDisplay } from '@/components/scenario/HintDisplay';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Server, GitBranch, Terminal, Ticket, AlertTriangle, Zap, Target, Layers, Container, Network } from 'lucide-react';

// Enhanced Dashboard Components
import { GlobalControlPanel } from '@/components/dashboard/GlobalControlPanel';
import { SmartHealthScore } from '@/components/dashboard/SmartHealthScore';
import { ActiveAlertsPreview } from '@/components/dashboard/ActiveAlertsPreview';
import { QuickActionsPanel } from '@/components/dashboard/QuickActionsPanel';
import { EnhancedAIMentor } from '@/components/dashboard/EnhancedAIMentor';
import { CostTrackingPanel } from '@/components/dashboard/CostTrackingPanel';
import { MiniLogPanel } from '@/components/dashboard/MiniLogPanel';
import { VisualTrafficFlow } from '@/components/dashboard/VisualTrafficFlow';

const modules = [
  { title: 'Scenarios', url: '/scenarios', icon: Target, desc: 'Guided learning challenges', color: 'text-orange-500', bgColor: 'bg-orange-500/10' },
  { title: 'Applications', url: '/apps', icon: Layers, desc: 'Manage deployed applications', color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
  { title: 'Container Lab', url: '/containers', icon: Container, desc: 'Docker playground', color: 'text-purple-500', bgColor: 'bg-purple-500/10' },
  { title: 'Networking', url: '/networking', icon: Network, desc: 'Virtual network lab', color: 'text-cyan-500', bgColor: 'bg-cyan-500/10' },
  { title: 'Instances', url: '/instances', icon: Server, desc: 'Manage compute instances', color: 'text-green-500', bgColor: 'bg-green-500/10' },
  { title: 'CI/CD', url: '/cicd', icon: GitBranch, desc: 'Monitor deployment pipelines', color: 'text-pink-500', bgColor: 'bg-pink-500/10' },
  { title: 'Live Instances', url: '/live', icon: Zap, desc: 'Real-time server monitoring', color: 'text-yellow-500', bgColor: 'bg-yellow-500/10' },
  { title: 'AWS CLI', url: '/cli', icon: Terminal, desc: 'Command line interface', color: 'text-indigo-500', bgColor: 'bg-indigo-500/10' },
  { title: 'Tickets', url: '/tickets', icon: Ticket, desc: 'Support and operations tickets', color: 'text-teal-500', bgColor: 'bg-teal-500/10' },
  { title: 'Issues', url: '/issues', icon: AlertTriangle, desc: 'System alerts and issues', color: 'text-red-500', bgColor: 'bg-red-500/10' },
];

const Index = () => {
  const simulationTick = useGameStore(s => s.simulationTick);
  const isRunning = useGameStore(s => s.isRunning);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(simulationTick, 1000);
    return () => clearInterval(interval);
  }, [isRunning, simulationTick]);

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden relative">
      <TopNavBar />
      
      <div className="flex-1 overflow-auto p-3 sm:p-4 md:p-6">
        <div className="max-w-[1800px] mx-auto space-y-4 sm:space-y-6">
          
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-2xl md:text-3xl font-semibold text-foreground tracking-wide">
              DevOps Control Center
            </h1>
            <p className="text-muted-foreground mt-1.5 text-sm">
              Real-time infrastructure monitoring & management
            </p>
          </motion.div>

          {/* Global Control Panel - Top Bar */}
          <GlobalControlPanel />

          {/* Main Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
            
            {/* Left Column - Primary Panels */}
            <div className="lg:col-span-8 space-y-4 sm:space-y-6">
              
              {/* Top Row - Health & Alerts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SmartHealthScore />
                <ActiveAlertsPreview />
              </div>

              {/* Visual Traffic Flow */}
              <div className="h-[400px]">
                <VisualTrafficFlow />
              </div>

              {/* Metrics & AI Mentor */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="h-[450px]">
                  <MetricsPanel />
                </div>
                <div className="space-y-4">
                  <EnhancedAIMentor />
                  <CostTrackingPanel />
                </div>
              </div>

              {/* Module Cards */}
              <div>
                <h2 className="text-lg sm:text-xl font-semibold mb-4">Quick Navigation</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                  {modules.map((mod, i) => {
                    const Icon = mod.icon;
                    return (
                      <motion.div
                        key={mod.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        whileHover={{ 
                          scale: 1.05,
                          transition: { duration: 0.2 }
                        }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigate(mod.url)}
                        className="panel p-4 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all group"
                      >
                        <div className={`w-10 h-10 rounded-lg ${mod.bgColor} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                          <Icon className={`w-5 h-5 ${mod.color}`} />
                        </div>
                        <h3 className="font-semibold text-sm truncate">{mod.title}</h3>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{mod.desc}</p>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Column - Quick Actions & Logs */}
            <div className="lg:col-span-4 space-y-4">
              <QuickActionsPanel />
              <div className="h-[500px]">
                <MiniLogPanel />
              </div>
            </div>

          </div>

        </div>
      </div>
      
      <ScenarioBanner />
      <HintDisplay />
      <AlertOverlay />
      <TutorialOverlay />
    </div>
  );
};

export default Index;
