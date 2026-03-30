import { HelpCircle, BookOpen } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useLearningStore } from '@/store/learningStore';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';

interface InfoTooltipProps {
  title: string;
  description: string;
  actionHint?: string;
  learnMoreTopic?: string;
  children?: React.ReactNode;
  iconOnly?: boolean;
}

export const InfoTooltip = ({ 
  title, 
  description, 
  actionHint, 
  learnMoreTopic,
  children,
  iconOnly = false
}: InfoTooltipProps) => {
  const openTopic = useLearningStore(s => s.openTopic);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Detect touch device
  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  const handleLearnMore = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (learnMoreTopic) {
      openTopic(learnMoreTopic as any);
    }
    setIsOpen(false);
  };

  const handleTriggerClick = (e: React.MouseEvent) => {
    if (isTouchDevice) {
      e.preventDefault();
      e.stopPropagation();
      setIsOpen(!isOpen);
    }
  };

  return (
    <TooltipProvider delayDuration={isTouchDevice ? 0 : 200}>
      <Tooltip open={isTouchDevice ? isOpen : undefined} onOpenChange={setIsOpen}>
        <TooltipTrigger asChild onClick={handleTriggerClick}>
          {children || (
            <button className="inline-flex items-center justify-center min-w-[44px] min-h-[44px]">
              <HelpCircle className="w-4 h-4 text-muted-foreground hover:text-primary active:text-primary transition-colors" />
            </button>
          )}
        </TooltipTrigger>
        <TooltipContent 
          side="top" 
          className="max-w-xs space-y-2 p-4 z-50"
          sideOffset={5}
          onPointerDownOutside={() => isTouchDevice && setIsOpen(false)}
        >
          <div className="space-y-2">
            <p className="font-semibold text-sm">{title}</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {description}
            </p>
            {actionHint && (
              <p className="text-xs text-primary font-medium italic">
                💡 {actionHint}
              </p>
            )}
            {learnMoreTopic && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleLearnMore}
                className="w-full gap-2 text-xs h-8 mt-2"
              >
                <BookOpen className="w-3 h-3" />
                Learn More →
              </Button>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
