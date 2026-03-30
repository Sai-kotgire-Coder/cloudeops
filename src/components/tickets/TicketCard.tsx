import { useTicketStore, Ticket } from '@/store/ticketStore';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Clock,
  Flame,
  Info,
  Zap,
  ChevronRight,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface TicketCardProps {
  ticket: Ticket;
  onClick: () => void;
}

export const TicketCard = ({ ticket, onClick }: TicketCardProps) => {
  const getPriorityIcon = () => {
    switch (ticket.priority) {
      case 'critical':
        return <Flame className="w-4 h-4 text-red-500" />;
      case 'high':
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case 'medium':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'low':
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const getPriorityBadge = () => {
    const colors = {
      critical: 'bg-red-500 hover:bg-red-600',
      high: 'bg-orange-500 hover:bg-orange-600',
      medium: 'bg-yellow-500 hover:bg-yellow-600',
      low: 'bg-blue-500 hover:bg-blue-600',
    };

    return (
      <Badge className={`${colors[ticket.priority]} text-white uppercase text-xs`}>
        {ticket.priority}
      </Badge>
    );
  };

  const getStatusIcon = () => {
    switch (ticket.status) {
      case 'open':
        return <Clock className="w-4 h-4 text-gray-400" />;
      case 'in_progress':
        return <Zap className="w-4 h-4 text-blue-400 animate-pulse" />;
      case 'resolved':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'closed':
        return <CheckCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBadge = () => {
    const colors = {
      open: 'bg-gray-700 text-gray-200',
      in_progress: 'bg-blue-600 text-white',
      resolved: 'bg-green-600 text-white',
      closed: 'bg-gray-600 text-gray-300',
    };

    const labels = {
      open: 'Open',
      in_progress: 'In Progress',
      resolved: 'Resolved',
      closed: 'Closed',
    };

    return (
      <Badge variant="outline" className={colors[ticket.status]}>
        {labels[ticket.status]}
      </Badge>
    );
  };

  const getTypeIcon = () => {
    switch (ticket.type) {
      case 'incident':
        return '🔴';
      case 'alert':
        return '⚠️';
      case 'task':
        return '📋';
      case 'change_request':
        return '🔄';
    }
  };

  const isActive = ticket.status === 'open' || ticket.status === 'in_progress';

  return (
    <Card
      className={`
        cursor-pointer transition-all hover:shadow-lg
        ${isActive ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-900/30 border-slate-800 opacity-70'}
        ${ticket.priority === 'critical' && isActive ? 'border-l-4 border-l-red-500' : ''}
        ${ticket.priority === 'high' && isActive ? 'border-l-4 border-l-orange-500' : ''}
      `}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Priority Icon */}
          <div className="mt-1 flex-shrink-0">
            {getPriorityIcon()}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono text-gray-500">
                    {ticket.ticketNumber}
                  </span>
                  <span className="text-xs">{getTypeIcon()}</span>
                  {getPriorityBadge()}
                  {getStatusBadge()}
                </div>
                <h3 className="text-sm font-semibold text-white line-clamp-2">
                  {ticket.title}
                </h3>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-500 flex-shrink-0" />
            </div>

            {/* Description Preview */}
            <p className="text-xs text-gray-400 line-clamp-2 mb-2">
              {ticket.description}
            </p>

            {/* Footer */}
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  {getStatusIcon()}
                  <span>{formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}</span>
                </div>
                {ticket.category && (
                  <Badge variant="outline" className="text-xs">
                    {ticket.category}
                  </Badge>
                )}
              </div>
              {ticket.assignedTo && (
                <span className="text-gray-400">→ {ticket.assignedTo}</span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
