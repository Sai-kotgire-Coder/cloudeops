import { useState } from 'react';
import { useContainerStore } from '@/store/containerStore';
import { Package, Play, Loader2, BookOpen, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion, AnimatePresence } from 'framer-motion';
import type { LearningSectionId } from '@/data/dockerLearningContent';

const BASE_IMAGES = [
  { value: 'nginx', label: 'nginx', icon: '🌐', description: 'Web server', capacity: 100 },
  { value: 'node', label: 'Node.js', icon: '🟢', description: 'JavaScript runtime', capacity: 80 },
  { value: 'python', label: 'Python', icon: '🐍', description: 'Python runtime', capacity: 60 },
  { value: 'redis', label: 'Redis', icon: '🔴', description: 'In-memory cache', capacity: 150 },
] as const;

interface ImageBuilderProps {
  onLearnMore: (sectionId: LearningSectionId) => void;
}

export const ImageBuilder = ({ onLearnMore }: ImageBuilderProps) => {
  const { buildImage, images } = useContainerStore();
  const [name, setName] = useState('');
  const [baseImage, setBaseImage] = useState<'nginx' | 'node' | 'python' | 'redis'>('nginx');
  const [port, setPort] = useState('3000');

  const handleBuild = () => {
    if (!name.trim()) {
      return;
    }

    buildImage(name, baseImage, parseInt(port));
    setName('');
    setPort('3000');
  };

  return (
    <div className="space-y-4">
      <div className="bg-[#0f172a] border-2 border-gray-700 rounded-xl p-6 space-y-5 shadow-lg">
        {/* Header with Learn More */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Package className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-white">Build Docker Image</h3>
              <p className="text-sm text-gray-400">Create a blueprint for your containers</p>
            </div>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onLearnMore('dockerImage')}
            className="gap-2 text-gray-300 hover:text-white hover:bg-gray-800"
          >
            <BookOpen className="w-4 h-4" />
            Learn More
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="app-name" className="text-gray-300 font-medium text-sm">
              Application Name
            </Label>
            <Input
              id="app-name"
              placeholder="my-web-app"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="font-mono bg-[#1e293b] border-gray-600 text-white placeholder:text-gray-500 focus:border-primary h-11 text-base"
            />
            <p className="text-xs text-gray-500">💡 Choose a descriptive name for your app</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="base-image" className="text-gray-300 font-medium text-sm">
              Base Image
            </Label>
            <Select value={baseImage} onValueChange={(v: any) => setBaseImage(v)}>
              <SelectTrigger id="base-image" className="h-11 bg-[#1e293b] border-gray-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BASE_IMAGES.map((img) => (
                  <SelectItem key={img.value} value={img.value}>
                    <div className="flex items-center gap-2">
                      <span>{img.icon}</span>
                      <span className="font-mono text-white">{img.label}</span>
                      <span className="text-xs text-gray-400">({img.description})</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              variant="link"
              onClick={() => onLearnMore('baseImages')}
              className="h-auto p-0 text-xs text-primary hover:text-primary/80"
            >
              What's a base image?
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="port" className="text-gray-300 font-medium text-sm">
              Port
            </Label>
            <Input
              id="port"
              type="number"
              placeholder="3000"
              value={port}
              onChange={(e) => setPort(e.target.value)}
              className="font-mono bg-[#1e293b] border-gray-600 text-white placeholder:text-gray-500 focus:border-primary h-11 text-base"
            />
            <p className="text-xs text-gray-500">💡 This is where your app runs inside the container</p>
          </div>

          <div className="flex items-end">
            <Button 
              onClick={handleBuild} 
              className="w-full gap-2 h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base transition-colors" 
              disabled={!name.trim()}
            >
              <Play className="w-4 h-4" />
              Build Image
            </Button>
          </div>
        </div>

        {/* Dockerfile Preview */}
        <div className="bg-[#1e293b] p-4 rounded-lg border border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-300 font-semibold">Preview Dockerfile:</p>
            <Button
              size="sm"
              variant="link"
              onClick={() => onLearnMore('buildProcess')}
              className="h-auto p-0 text-xs text-primary hover:text-primary/80"
            >
              How does this work?
            </Button>
          </div>
          <pre className="text-xs font-mono text-gray-400 leading-relaxed">
            <code>{`FROM ${baseImage}
WORKDIR /app
COPY . .
RUN npm install
EXPOSE ${port}
CMD ["npm", "start"]`}</code>
          </pre>
        </div>
      </div>

      {/* Building Images */}
      <AnimatePresence>
        {images.filter((img) => img.status === 'building').map((img) => (
          <motion.div
            key={img.id}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-[#0f172a] border-2 border-primary/50 rounded-xl p-4 shadow-lg"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-primary animate-spin" />
                <div>
                  <span className="font-semibold text-white text-base">{img.name}</span>
                  <p className="text-xs text-gray-400">Building from {img.baseImage}</p>
                </div>
              </div>
              <span className="text-sm font-mono text-primary font-bold">{img.buildProgress}%</span>
            </div>
            <div className="w-full h-3 bg-[#1e293b] rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-blue-600"
                initial={{ width: 0 }}
                animate={{ width: `${img.buildProgress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
