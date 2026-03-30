import { useContainerStore } from '@/store/containerStore';
import { Package, Play, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export const ImageLibrary = () => {
  const { images, runContainer } = useContainerStore();

  const readyImages = images.filter((img) => img.status === 'ready');

  if (readyImages.length === 0) {
    return (
      <div className="panel p-6 text-center">
        <Package className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-30" />
        <p className="text-muted-foreground text-sm">No images built yet</p>
        <p className="text-xs text-muted-foreground mt-1">Build an image above to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-3">
        <Package className="w-5 h-5 text-primary" />
        <h3 className="font-bold">Docker Images ({readyImages.length})</h3>
      </div>

      <div className="space-y-2">
        {readyImages.map((img, idx) => (
          <motion.div
            key={img.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="panel p-4 hover:border-primary/50 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span className="font-bold font-mono text-sm">{img.name}</span>
              </div>
              <span className="text-xs text-muted-foreground">{img.size} MB</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground space-y-0.5">
                <div>Base: <span className="font-mono">{img.baseImage}</span></div>
                <div>Port: <span className="font-mono">{img.port}</span></div>
              </div>

              <Button
                size="sm"
                onClick={() => runContainer(img.id)}
                className="gap-2 opacity-70 group-hover:opacity-100 transition-opacity"
              >
                <Play className="w-3 h-3" />
                Run Container
              </Button>
            </div>

            <div className="text-[10px] text-muted-foreground font-mono mt-2 truncate">
              {img.id}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
