import { useState } from 'react';
import { FileText, Plus, Trash2, BookOpen, Bell, BellRing } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAnsibleStore, ANSIBLE_MODULE_CATALOG, getModuleDef } from '@/store/ansibleStore';
import { getAnsibleSnippet } from '@/data/ansibleSnippets';
import { HclCodeBlock } from '@/components/terraform/HclCodeBlock';
import type { LearningSectionId } from '@/data/dockerLearningContent';

interface PlaybookEditorProps {
  onLearnMore: (sectionId: LearningSectionId) => void;
}

export const PlaybookEditor = ({ onLearnMore }: PlaybookEditorProps) => {
  const { playbook, addTask, updateTaskParam, removeTask } = useAnsibleStore();
  const [moduleId, setModuleId] = useState('apt');
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [isHandler, setIsHandler] = useState(false);
  const [notifyNames, setNotifyNames] = useState<string[]>([]);

  const selectedDef = getModuleDef(moduleId);
  const snippet = getAnsibleSnippet(moduleId);
  const handlerNames = playbook.filter((t) => t.isHandler).map((t) => t.name);
  const regularTasks = playbook.filter((t) => !t.isHandler);
  const handlerTasks = playbook.filter((t) => t.isHandler);

  const toggleNotify = (handlerName: string) => {
    setNotifyNames((prev) => (prev.includes(handlerName) ? prev.filter((n) => n !== handlerName) : [...prev, handlerName]));
  };

  const handleAdd = () => {
    addTask(moduleId, name, role, isHandler, isHandler ? undefined : notifyNames);
    setName('');
    setRole('');
    setIsHandler(false);
    setNotifyNames([]);
  };

  return (
    <div className="bg-[#0f172a] border-2 border-gray-700 rounded-xl p-6 space-y-5 shadow-lg">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-lg text-white">Playbook</h3>
            <p className="text-sm text-gray-400">The tasks you want to run (site.yml)</p>
          </div>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onLearnMore('ansiblePlaybook')}
          className="gap-2 text-gray-300 hover:text-white hover:bg-gray-800"
        >
          <BookOpen className="w-4 h-4" />
          Learn More
        </Button>
      </div>

      <div className="space-y-3 bg-[#1e293b]/60 border border-gray-700 rounded-lg p-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
          Pick a module for the next task
        </p>
        <Select value={moduleId} onValueChange={setModuleId}>
          <SelectTrigger className="bg-[#1e293b] border-gray-700 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            {ANSIBLE_MODULE_CATALOG.map((m) => (
              <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedDef && (
          <p className="text-xs text-gray-400 leading-relaxed">{selectedDef.description}</p>
        )}

        {snippet && (
          <div className="space-y-1.5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
              Real Ansible task for {selectedDef?.label} — this is what you'd write in a real playbook
            </p>
            <HclCodeBlock code={snippet} filename="playbook.yml" />
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            placeholder="task name (e.g. Install nginx)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            className="bg-[#1e293b] border-gray-700 text-white flex-1"
          />
          <Input
            placeholder="role (optional, e.g. webserver)"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="bg-[#1e293b] border-gray-700 text-white sm:w-48"
          />
        </div>

        <label className="flex items-center gap-2 text-xs text-gray-400">
          <Checkbox checked={isHandler} onCheckedChange={(v) => setIsHandler(!!v)} />
          This is a handler (only runs when notified, not in the main sequence)
        </label>

        {!isHandler && handlerNames.length > 0 && (
          <div className="space-y-1.5">
            <Label className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
              Notify these handlers when this task changes something
            </Label>
            <div className="flex flex-wrap gap-1.5">
              {handlerNames.map((hn) => (
                <button
                  key={hn}
                  type="button"
                  onClick={() => toggleNotify(hn)}
                  className={`text-xs px-2 py-1 rounded-full border transition-colors flex items-center gap-1 ${
                    notifyNames.includes(hn)
                      ? 'border-amber-500/50 bg-amber-500/10 text-amber-300'
                      : 'border-gray-700 text-gray-400 hover:border-gray-500'
                  }`}
                >
                  {notifyNames.includes(hn) ? <BellRing className="w-3 h-3" /> : <Bell className="w-3 h-3" />}
                  {hn}
                </button>
              ))}
            </div>
          </div>
        )}

        <Button onClick={handleAdd} className="gap-2 w-full">
          <Plus className="w-4 h-4" />
          {isHandler ? 'Add Handler' : 'Add Task'}
        </Button>
      </div>

      <div className="space-y-2">
        {playbook.length === 0 && (
          <p className="text-sm text-gray-500 italic py-4 text-center">
            No tasks yet — add one above to start writing your playbook.
          </p>
        )}
        {regularTasks.map((task, index) => {
          const def = getModuleDef(task.moduleId);
          return (
            <div key={task.id} className="bg-[#1e293b] border border-gray-700 rounded-lg p-3 font-mono text-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-500 text-xs">{index + 1}.</span>
                <span className="text-cyan-400 flex-1 pl-2">- name: {task.name}</span>
                {task.role && (
                  <span className="text-[10px] font-sans font-semibold uppercase tracking-wider text-purple-300 bg-purple-500/10 border border-purple-500/30 rounded px-1.5 py-0.5 mr-2 shrink-0">
                    {task.role}
                  </span>
                )}
                <button
                  onClick={() => removeTask(task.id)}
                  className="text-gray-500 hover:text-red-400 transition-colors"
                  aria-label={`Remove ${task.name}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              {def && (
                <p className="text-[11px] font-sans text-gray-500 pl-4 mb-1.5">{def.module}</p>
              )}
              <div className="pl-4 space-y-1">
                {Object.entries(task.params).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-2 text-gray-300">
                    <span className="text-gray-500">{key}:</span>
                    <Input
                      value={value}
                      onChange={(e) => updateTaskParam(task.id, key, e.target.value)}
                      className="h-7 bg-[#0f172a] border-gray-700 text-green-400 font-mono text-sm w-48"
                    />
                  </div>
                ))}
              </div>
              {task.notify && task.notify.length > 0 && (
                <p className="text-[11px] font-sans text-gray-500 pl-4 mt-1.5 flex items-center gap-1">
                  <Bell className="w-3 h-3" /> notifies: {task.notify.join(', ')}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {handlerTasks.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-gray-800">
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
            <BellRing className="w-3.5 h-3.5" /> Handlers (run only when notified)
          </p>
          {handlerTasks.map((task) => {
            const def = getModuleDef(task.moduleId);
            return (
              <div key={task.id} className="bg-[#1e293b] border border-amber-500/20 rounded-lg p-3 font-mono text-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-amber-300 flex-1">- name: {task.name}</span>
                  <button
                    onClick={() => removeTask(task.id)}
                    className="text-gray-500 hover:text-red-400 transition-colors"
                    aria-label={`Remove ${task.name}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                {def && <p className="text-[11px] font-sans text-gray-500 pl-4 mb-1.5">{def.module}</p>}
                <div className="pl-4 space-y-1">
                  {Object.entries(task.params).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2 text-gray-300">
                      <span className="text-gray-500">{key}:</span>
                      <Input
                        value={value}
                        onChange={(e) => updateTaskParam(task.id, key, e.target.value)}
                        className="h-7 bg-[#0f172a] border-gray-700 text-green-400 font-mono text-sm w-48"
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
