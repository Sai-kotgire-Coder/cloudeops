import { useCICDStore, type PipelineStage, type StageStatus } from '@/store/cicdStore';
import { CheckCircle2, XCircle, Clock, Loader2, ChevronRight, ChevronDown, GitBranch, Package, TestTube, Container, Upload, Rocket } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';

const getStageIcon = (stageName: string) => {
  const icons: Record<string, any> = {
    'Checkout Code': GitBranch,
    'Build': Package,
    'Test': TestTube,
    'Dockerize': Container,
    'Push to Registry': Upload,
    'Deploy': Rocket,
  };
  return icons[stageName] || Package;
};

const getStatusIcon = (status: StageStatus) => {
  switch (status) {
    case 'success':
      return <CheckCircle2 className="w-5 h-5 text-green-400" />;
    case 'failed':
      return <XCircle className="w-5 h-5 text-red-400" />;
    case 'running':
      return <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />;
    case 'pending':
      return <Clock className="w-5 h-5 text-gray-500" />;
    default:
      return <Clock className="w-5 h-5 text-gray-500" />;
  }
};

const getStatusColor = (status: StageStatus) => {
  switch (status) {
    case 'success':
      return 'border-green-500 bg-green-500/10 shadow-green-500/20';
    case 'failed':
      return 'border-red-500 bg-red-500/10 shadow-red-500/20';
    case 'running':
      return 'border-blue-500 bg-blue-500/10 shadow-blue-500/20 animate-pulse';
    case 'pending':
      return 'border-gray-600 bg-gray-800/30';
    default:
      return 'border-gray-600 bg-gray-800/30';
  }
};

export const PipelineVisualization = () => {
  const { currentRun, selectedStage, selectStage } = useCICDStore();

  if (!currentRun) {
    return (
      <div className="bg-[#0f172a] border-2 border-gray-700 rounded-2xl p-12 text-center">
        <GitBranch className="w-16 h-16 text-gray-600 mx-auto mb-4 opacity-30" />
        <h3 className="text-xl font-semibold text-white mb-2">No Active Pipeline</h3>
        <p className="text-gray-400">
          Trigger a pipeline above to see the CI/CD flow visualization
        </p>
      </div>
    );
  }

  const formatDuration = (ms?: number) => {
    if (!ms) return '---';
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <div className="space-y-6">
      {/* Pipeline Header */}
      <div className="bg-[#0f172a] border-2 border-gray-700 rounded-2xl p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                currentRun.status === 'success' 
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : currentRun.status === 'failed'
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                  : currentRun.status === 'running'
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
              }`}>
                {currentRun.status.toUpperCase()}
              </div>
              <span className="text-xl font-bold text-white">{currentRun.version}</span>
              <span className="text-gray-500">→</span>
              <span className="text-base text-gray-400">{currentRun.environment}</span>
            </div>
            <p className="text-base text-white font-mono mb-2">{currentRun.commitMessage}</p>
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <span className="flex items-center gap-1">
                <GitBranch className="w-4 h-4" />
                {currentRun.branch}
              </span>
              <span>•</span>
              <span>Started {new Date(currentRun.startTime).toLocaleTimeString()}</span>
              {currentRun.endTime && (
                <>
                  <span>•</span>
                  <span>Duration: {formatDuration(currentRun.endTime - currentRun.startTime)}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Pipeline Progress Bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
            <span>Overall Progress</span>
            <span>
              {currentRun.stages.filter(s => s.status === 'success').length} / {currentRun.stages.length} stages completed
            </span>
          </div>
          <div className="w-full h-2 bg-[#1e293b] rounded-full overflow-hidden">
            <motion.div
              className={`h-full ${
                currentRun.status === 'failed' 
                  ? 'bg-gradient-to-r from-red-500 to-red-600'
                  : currentRun.status === 'success'
                  ? 'bg-gradient-to-r from-green-500 to-green-600'
                  : 'bg-gradient-to-r from-blue-500 to-purple-500'
              }`}
              animate={{ 
                width: `${(currentRun.stages.filter(s => s.status === 'success' || s.status === 'failed').length / currentRun.stages.length) * 100}%` 
              }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      </div>

      {/* Stages */}
      <div className="space-y-4">
        {currentRun.stages.map((stage, index) => (
          <StageCard
            key={stage.id}
            stage={stage}
            isSelected={selectedStage === stage.id}
            onSelect={() => selectStage(selectedStage === stage.id ? null : stage.id)}
            isLast={index === currentRun.stages.length - 1}
          />
        ))}
      </div>
    </div>
  );
};

interface StageCardProps {
  stage: PipelineStage;
  isSelected: boolean;
  onSelect: () => void;
  isLast: boolean;
}

const StageCard = ({ stage, isSelected, onSelect, isLast }: StageCardProps) => {
  const Icon = getStageIcon(stage.name);

  const formatDuration = (ms?: number) => {
    if (!ms) return '';
    const seconds = (ms / 1000).toFixed(1);
    return `${seconds}s`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`bg-[#0f172a] border-2 rounded-xl overflow-hidden transition-all ${getStatusColor(stage.status)} ${
        isSelected ? 'ring-2 ring-blue-500' : ''
      }`}
    >
      {/* Stage Header */}
      <Button
        onClick={onSelect}
        variant="ghost"
        className="w-full p-5 justify-start hover:bg-white/5"
      >
        <div className="flex items-center gap-4 flex-1">
          {/* Status Icon */}
          <div className="shrink-0">{getStatusIcon(stage.status)}</div>

          {/* Stage Icon */}
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            stage.status === 'success' ? 'bg-green-500/20' :
            stage.status === 'failed' ? 'bg-red-500/20' :
            stage.status === 'running' ? 'bg-blue-500/20' :
            'bg-gray-700/20'
          }`}>
            <Icon className={`w-5 h-5 ${
              stage.status === 'success' ? 'text-green-400' :
              stage.status === 'failed' ? 'text-red-400' :
              stage.status === 'running' ? 'text-blue-400' :
              'text-gray-500'
            }`} />
          </div>

          {/* Stage Info */}
          <div className="flex-1 text-left">
            <h3 className="font-semibold text-base text-white">{stage.name}</h3>
            <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
              {stage.status === 'running' && (
                <span className="text-blue-400">Running...</span>
              )}
              {stage.status === 'success' && stage.duration && (
                <span className="text-green-400">✓ Completed in {formatDuration(stage.duration)}</span>
              )}
              {stage.status === 'failed' && (
                <span className="text-red-400">✗ Failed</span>
              )}
              {stage.status === 'pending' && (
                <span className="text-gray-500">Waiting...</span>
              )}
              {stage.logs.length > 0 && (
                <>
                  <span>•</span>
                  <span>{stage.logs.length} log entries</span>
                </>
              )}
            </div>
          </div>

          {/* Expand Icon */}
          <motion.div
            animate={{ rotate: isSelected ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            {isSelected ? (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-400" />
            )}
          </motion.div>
        </div>
      </Button>

      {/* Stage Logs */}
      <AnimatePresence>
        {isSelected && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="border-t border-gray-700 bg-[#1e293b]/50"
          >
            <div className="p-5 space-y-2 max-h-96 overflow-y-auto">
              {stage.logs.length === 0 ? (
                <p className="text-sm text-gray-500 italic">No logs yet...</p>
              ) : (
                stage.logs.map((log, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className={`text-sm font-mono flex items-start gap-2 ${
                      log.level === 'error' ? 'text-red-400' :
                      log.level === 'success' ? 'text-green-400' :
                      log.level === 'warning' ? 'text-yellow-400' :
                      'text-gray-300'
                    }`}
                  >
                    <span className="text-gray-600 text-xs shrink-0 mt-0.5">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                    <span className="flex-1">{log.message}</span>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Connector Line */}
      {!isLast && (
        <div className="flex justify-center py-2">
          <div className="w-0.5 h-4 bg-gray-700" />
        </div>
      )}
    </motion.div>
  );
};
