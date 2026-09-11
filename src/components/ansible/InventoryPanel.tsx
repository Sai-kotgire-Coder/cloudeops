import { useState } from 'react';
import { Server, Plus, Trash2, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAnsibleStore } from '@/store/ansibleStore';
import type { LearningSectionId } from '@/data/dockerLearningContent';

interface InventoryPanelProps {
  onLearnMore: (sectionId: LearningSectionId) => void;
}

export const InventoryPanel = ({ onLearnMore }: InventoryPanelProps) => {
  const { inventory, addHost, removeHost } = useAnsibleStore();
  const [hostname, setHostname] = useState('');
  const [group, setGroup] = useState('webservers');

  const handleAdd = () => {
    addHost(hostname, group);
    setHostname('');
  };

  const groups = Array.from(new Set(inventory.map((h) => h.group)));

  return (
    <div className="bg-[#0f172a] border-2 border-gray-700 rounded-xl p-6 space-y-4 shadow-lg">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <Server className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-lg text-white">Inventory</h3>
            <p className="text-sm text-gray-400">The hosts your playbook targets</p>
          </div>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onLearnMore('ansibleInventory')}
          className="gap-2 text-gray-300 hover:text-white hover:bg-gray-800"
        >
          <BookOpen className="w-4 h-4" />
          Learn More
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <Input
          placeholder="hostname (e.g. web-01)"
          value={hostname}
          onChange={(e) => setHostname(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          className="bg-[#1e293b] border-gray-700 text-white flex-1"
        />
        <Input
          placeholder="group (e.g. webservers)"
          value={group}
          onChange={(e) => setGroup(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          className="bg-[#1e293b] border-gray-700 text-white sm:w-48"
        />
        <Button onClick={handleAdd} className="gap-2 shrink-0">
          <Plus className="w-4 h-4" />
          Add Host
        </Button>
      </div>

      {inventory.length === 0 ? (
        <p className="text-sm text-gray-500 italic py-2 text-center">
          No hosts yet — add one to build your inventory.
        </p>
      ) : (
        <div className="space-y-3">
          {groups.map((groupName) => (
            <div key={groupName} className="bg-[#1e293b] border border-gray-700 rounded-lg p-3">
              <p className="text-xs font-mono text-cyan-400 mb-2">[{groupName}]</p>
              <div className="space-y-1">
                {inventory.filter((h) => h.group === groupName).map((host) => (
                  <div key={host.id} className="flex items-center justify-between font-mono text-sm text-gray-300 pl-2">
                    <span>{host.hostname}</span>
                    <button
                      onClick={() => removeHost(host.id)}
                      className="text-gray-500 hover:text-red-400 transition-colors"
                      aria-label={`Remove ${host.hostname}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
