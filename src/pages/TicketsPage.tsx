import { useEffect, useState } from 'react';
import { useTicketStore, TicketStatus, TicketPriority } from '@/store/ticketStore';
import { useGameStore } from '@/store/gameStore';
import { useNetworkStore } from '@/store/networkStore';
import { useContainerStore } from '@/store/containerStore';
import { useCICDStore } from '@/store/cicdStore';
import { TopNavBar } from '@/components/game/TopNavBar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TicketCard } from '@/components/tickets/TicketCard';
import { TicketDetailPanel } from '@/components/tickets/TicketDetailPanel';
import {
  Ticket as TicketIcon,
  Flame,
  Clock,
  Zap,
  CheckCircle,
  Bell,
  BellOff,
} from 'lucide-react';

const TicketsPage = () => {
  const {
    tickets,
    selectedTicketId,
    selectTicket,
    getTicketsByStatus,
    getCriticalCount,
    getOpenCount,
    checkTriggers,
    autoGenerationEnabled,
    toggleAutoGeneration,
  } = useTicketStore();

  const gameStore = useGameStore();
  const networkStore = useNetworkStore();
  const containerStore = useContainerStore();
  const cicdStore = useCICDStore();

  const [filterStatus, setFilterStatus] = useState<TicketStatus | 'all'>('all');
  const [filterPriority, setFilterPriority] = useState<TicketPriority | 'all'>('all');

  const selectedTicket = tickets.find(t => t.id === selectedTicketId) || null;

  // Auto-check triggers every 5 seconds
  useEffect(() => {
    if (!autoGenerationEnabled) return;

    const interval = setInterval(() => {
      checkTriggers({
        gameStore: gameStore,
        networkStore: networkStore,
        containerStore: containerStore,
        cicdStore: cicdStore,
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [autoGenerationEnabled, checkTriggers, gameStore, networkStore, containerStore, cicdStore]);

  // Filter tickets
  const filteredTickets = tickets.filter(ticket => {
    if (filterStatus !== 'all' && ticket.status !== filterStatus) return false;
    if (filterPriority !== 'all' && ticket.priority !== filterPriority) return false;
    return true;
  });

  // Group by status
  const openTickets = getTicketsByStatus('open');
  const inProgressTickets = getTicketsByStatus('in_progress');
  const resolvedTickets = getTicketsByStatus('resolved');

  // Stats
  const criticalCount = getCriticalCount();
  const openCount = getOpenCount();
  const resolvedCount = resolvedTickets.length;
  const totalCount = tickets.length;

  return (
    <div className="min-h-screen bg-[#0B0F1A]">
      <TopNavBar />
      
      <div className="container mx-auto p-4 space-y-4 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-2">
              <TicketIcon className="w-8 h-8" />
              DevOps Tickets
            </h1>
            <p className="text-gray-300 mt-1">
              Incident management & system alerts
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant={autoGenerationEnabled ? 'default' : 'outline'}
              onClick={toggleAutoGeneration}
              className="gap-2"
            >
              {autoGenerationEnabled ? (
                <>
                  <Bell className="w-4 h-4" />
                  Auto-Gen ON
                </>
              ) : (
                <>
                  <BellOff className="w-4 h-4" />
                  Auto-Gen OFF
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400">Total Tickets</p>
                  <p className="text-2xl font-bold text-white">{totalCount}</p>
                </div>
                <TicketIcon className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-red-900/20 border-red-600">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-red-400">Critical</p>
                  <p className="text-2xl font-bold text-white">{criticalCount}</p>
                </div>
                <Flame className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-orange-900/20 border-orange-600">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-orange-400">Open</p>
                  <p className="text-2xl font-bold text-white">{openCount}</p>
                </div>
                <Clock className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-blue-900/20 border-blue-600">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-blue-400">In Progress</p>
                  <p className="text-2xl font-bold text-white">{inProgressTickets.length}</p>
                </div>
                <Zap className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-green-900/20 border-green-600">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-green-400">Resolved</p>
                  <p className="text-2xl font-bold text-white">{resolvedCount}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">Status:</span>
                <div className="flex gap-2">
                  {(['all', 'open', 'in_progress', 'resolved', 'closed'] as const).map(status => (
                    <Button
                      key={status}
                      size="sm"
                      variant={filterStatus === status ? 'default' : 'outline'}
                      onClick={() => setFilterStatus(status)}
                      className="text-xs"
                    >
                      {status === 'all' ? 'All' : status.replace('_', ' ')}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">Priority:</span>
                <div className="flex gap-2">
                  {(['all', 'critical', 'high', 'medium', 'low'] as const).map(priority => (
                    <Button
                      key={priority}
                      size="sm"
                      variant={filterPriority === priority ? 'default' : 'outline'}
                      onClick={() => setFilterPriority(priority)}
                      className="text-xs"
                    >
                      {priority}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tickets List */}
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">
              All ({filteredTickets.length})
            </TabsTrigger>
            <TabsTrigger value="open">
              Open ({openTickets.length})
            </TabsTrigger>
            <TabsTrigger value="in_progress">
              In Progress ({inProgressTickets.length})
            </TabsTrigger>
            <TabsTrigger value="resolved">
              Resolved ({resolvedTickets.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-3">
            {filteredTickets.length === 0 ? (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-8 text-center">
                  <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-400" />
                  <p className="text-white font-semibold">No tickets found</p>
                  <p className="text-gray-400 text-sm mt-1">
                    {autoGenerationEnabled
                      ? 'System is healthy! Tickets will appear when issues are detected.'
                      : 'Enable auto-generation to monitor for system issues.'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredTickets.map(ticket => (
                <TicketCard
                  key={ticket.id}
                  ticket={ticket}
                  onClick={() => selectTicket(ticket.id)}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="open" className="space-y-3">
            {openTickets.length === 0 ? (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-8 text-center">
                  <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-400" />
                  <p className="text-white font-semibold">No open tickets</p>
                  <p className="text-gray-400 text-sm mt-1">Great work! All issues are being addressed.</p>
                </CardContent>
              </Card>
            ) : (
              openTickets.map(ticket => (
                <TicketCard
                  key={ticket.id}
                  ticket={ticket}
                  onClick={() => selectTicket(ticket.id)}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="in_progress" className="space-y-3">
            {inProgressTickets.length === 0 ? (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-8 text-center">
                  <Clock className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p className="text-white font-semibold">No tickets in progress</p>
                  <p className="text-gray-400 text-sm mt-1">Start working on open tickets.</p>
                </CardContent>
              </Card>
            ) : (
              inProgressTickets.map(ticket => (
                <TicketCard
                  key={ticket.id}
                  ticket={ticket}
                  onClick={() => selectTicket(ticket.id)}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="resolved" className="space-y-3">
            {resolvedTickets.length === 0 ? (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-8 text-center">
                  <CheckCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p className="text-white font-semibold">No resolved tickets yet</p>
                  <p className="text-gray-400 text-sm mt-1">Resolved tickets will appear here.</p>
                </CardContent>
              </Card>
            ) : (
              resolvedTickets.map(ticket => (
                <TicketCard
                  key={ticket.id}
                  ticket={ticket}
                  onClick={() => selectTicket(ticket.id)}
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Ticket Detail Panel */}
      <TicketDetailPanel
        ticket={selectedTicket}
        isOpen={selectedTicketId !== null}
        onClose={() => selectTicket(null)}
      />
    </div>
  );
};

export default TicketsPage;
