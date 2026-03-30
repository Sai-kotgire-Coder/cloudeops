import * as React from "react";
import { HelpCircle, BookOpen } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useLearningStore } from "@/store/learningStore";
import { cn } from "@/lib/utils";

export interface TooltipInfo {
  title: string;
  description: string;
  actionHint?: string;
  learnMoreTopic?: string;
}

interface ContextualTooltipProps {
  info: TooltipInfo;
  children: React.ReactNode;
  showIcon?: boolean;
  side?: "top" | "right" | "bottom" | "left";
  className?: string;
}

export function ContextualTooltip({
  info,
  children,
  showIcon = false,
  side = "top",
  className,
}: ContextualTooltipProps) {
  const openTopic = useLearningStore((s) => s.openTopic);

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn("inline-flex items-center gap-1.5", className)}>
            {children}
            {showIcon && (
              <HelpCircle className="w-3.5 h-3.5 text-muted-foreground/60 hover:text-muted-foreground transition-colors" />
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent
          side={side}
          className="max-w-xs p-3 space-y-2 bg-popover/95 backdrop-blur-sm border-2"
        >
          <div>
            <p className="font-semibold text-sm mb-1">{info.title}</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {info.description}
            </p>
          </div>

          {info.actionHint && (
            <div className="pt-1.5 border-t border-border/50">
              <p className="text-xs text-primary/90 font-medium">
                💡 {info.actionHint}
              </p>
            </div>
          )}

          {info.learnMoreTopic && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                openTopic(info.learnMoreTopic as any);
              }}
              className="flex items-center gap-1.5 text-xs text-blue-500 hover:text-blue-600 font-medium mt-2 transition-colors"
            >
              <BookOpen className="w-3 h-3" />
              Learn more →
            </button>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Standalone help icon version
interface HelpIconProps {
  info: TooltipInfo;
}

export function HelpIcon({ info }: HelpIconProps) {
  return (
    <ContextualTooltip info={info}>
      <HelpCircle className="w-4 h-4 text-muted-foreground/60 hover:text-muted-foreground transition-colors cursor-help" />
    </ContextualTooltip>
  );
}
