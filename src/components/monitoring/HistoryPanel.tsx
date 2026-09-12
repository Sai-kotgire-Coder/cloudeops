import { History, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useMonitoringStore } from '@/store/monitoringStore';

function timeAgo(ts: number): string {
  const mins = Math.floor((Date.now() - ts) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
}

export const HistoryPanel = () => {
  const history = useMonitoringStore((s) => s.history);

  return (
    <div className="bg-[#0f172a] border-2 border-gray-700 rounded-xl p-6 space-y-4 shadow-lg">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
          <History className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-lg text-white">Alert History</h3>
          <p className="text-sm text-gray-400">Rule fires and resolutions, most recent first</p>
        </div>
      </div>

      {history.length === 0 ? (
        <p className="text-xs text-gray-500 italic">No events yet -- events appear here as your rules fire or resolve.</p>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {history.map((e) => (
            <div key={e.id} className="flex items-start gap-2 bg-[#1e293b] border border-gray-700 rounded-lg p-3">
              {e.kind === 'fired' ? (
                <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-300">{e.message}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">{timeAgo(e.timestamp)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
