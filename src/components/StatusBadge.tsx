import { Badge } from "@/components/ui/badge";
import { Check, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

type Status = "ordered" | "collected" | "unordered";

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const getStatusStyles = () => {
    switch (status) {
      case "ordered":
        return "bg-black text-white hover:bg-black/80";
      case "unordered":
        return "bg-red-500 text-white hover:bg-red-500/80";
      case "collected":
        return "bg-status-collected text-status-collected-foreground hover:bg-status-collected/80";
      default:
        return "bg-status-ordered text-status-ordered-foreground hover:bg-status-ordered/80";
    }
  };

  const getIcon = () => {
    switch (status) {
      case "collected":
        return <Check className="h-3 w-3" />;
      default:
        return <Clock className="h-3 w-3" />;
    }
  };

  const getLabel = () => {
    switch (status) {
      case "ordered":
        return "Ordered";
      case "unordered":
        return "Unordered";
      case "collected":
        return "Collected";
      default:
        return "Ordered";
    }
  };
  
  return (
    <Badge
      className={cn(
        "flex items-center gap-1.5 font-medium",
        getStatusStyles(),
        className
      )}
    >
      {getIcon()}
      {getLabel()}
    </Badge>
  );
}