import { useCICDStore } from '@/store/cicdStore';
import { History, CheckCircle2, XCircle,  Clock, Trash2, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export const PipelineHistory = () => {
  const { pipelineRuns, deployedVersions, rollbackToPrevious, clearHistory } = useCICDStore();

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Deployed Versions */}
      {deployedVersions.size > 0 && (
        <div className="bg-[#0f172a] border-2 border-gray-700 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Current Deployments</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {Array.from(deployedVersions.entries()).map(([env, version]) => (
              <div key={env} className="bg-[#1e293b] border border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-400 uppercase">{env}</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                    env === 'production' ? 'bg-green-500/20 text-green-400' :
                    env === 'staging' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-blue-500/20 text-blue-400'
                  }`}>
                    LIVE
                  </span>
                </div>
                <p className="text-lg font-mono font-bold text-white">{version}</p>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => rollbackToPrevious(env)}
                  className="mt-2 w-full text-xs gap-1 text-gray-400 hover:text-white"
                >
                  <RotateCcw className="w-3 h-3" />
                  Rollback
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pipeline History */}
      <div className="bg-[#0f172a] border-2 border-gray-700 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-white">Pipeline History</h3>
          </div>
          {pipelineRuns.length > 0 && (
            <Button
              size="sm"
              variant="ghost"
              onClick={clearHistory}
              className="gap-2 text-gray-400 hover:text-white"
            >
              <Trash2 className="w-4 h-4" />
              Clear
            </Button>
          )}
        </div>

        {pipelineRuns.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="w-12 h-12 text-gray-600 mx-auto mb-3 opacity-30" />
            <p className="text-gray-400">No pipeline runs yet</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {pipelineRuns.map((run, idx) => (
              <motion.div
                key={run.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-[#1e293b] border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-colors"
              >
                <div className="flex items-start gap-3">
                  {/* Status Icon */}
                  <div className="shrink-0 mt-1">
                    {run.status === 'success' ? (
                      <CheckCircle2 className="w-5 h-5 text-green-400" />
                    ) : run.status === 'failed' ? (
                      <XCircle className="w-5 h-5 text-red-400" />
                    ) : (
                      <Clock className="w-5 h-5 text-blue-400" />
                    )}
                  </div>

                  {/* Run Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono font-bold text-white">{run.version}</span>
                      <span className="text-gray-500">→</span>
                      <span className={`text-xs px-2 py-0.5 rounded font-semibold ${
                        run.environment === 'production' ? 'bg-green-500/20 text-green-400' :
                        run.environment === 'staging' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-blue-500/20 text-blue-400'
                      }`}>
                        {run.environment}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded font-semibold ${
                        run.status === 'success' ? 'bg-green-500/20 text-green-400' :
                        run.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {run.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-300 truncate font-mono mb-1">{run.commitMessage}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span>{run.branch}</span>
                      <span>•</span>
                      <span>{formatTime(run.startTime)}</span>
                      {run.endTime && (
                        <>
                          <span>•</span>
                          <span>{Math.floor((run.endTime - run.startTime) / 1000)}s</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
