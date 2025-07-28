import { cn } from "@/lib/utils";
import { TrendingUp, Heart, Weight } from "lucide-react";

interface ClinicalChartProps {
  title: string;
  icon: "chart-line" | "heartbeat" | "weight";
  currentValue: string;
  unit: string;
  status: "critical" | "high" | "warning" | "normal";
  threshold?: string;
}

const statusConfig = {
  critical: {
    color: "text-alert-red",
    bgColor: "bg-red-50",
    icon: "⚠️",
  },
  high: {
    color: "text-alert-orange", 
    bgColor: "bg-orange-50",
    icon: "⚠️",
  },
  warning: {
    color: "text-alert-yellow",
    bgColor: "bg-yellow-50", 
    icon: "⚠️",
  },
  normal: {
    color: "text-medical-green",
    bgColor: "bg-green-50",
    icon: "✓",
  },
};

const iconMap = {
  "chart-line": TrendingUp,
  "heartbeat": Heart,
  "weight": Weight,
};

export default function ClinicalChart({ 
  title, 
  icon, 
  currentValue, 
  unit, 
  status, 
  threshold 
}: ClinicalChartProps) {
  const config = statusConfig[status];
  const IconComponent = iconMap[icon];

  return (
    <div className="p-4 border border-gray-200 rounded-lg">
      <h3 className="font-medium text-gray-900 mb-3 flex items-center">
        <IconComponent className="text-medical-blue mr-2 h-4 w-4" />
        {title}
      </h3>
      
      <div className={cn(
        "h-32 rounded flex items-center justify-center",
        config.bgColor
      )}>
        <div className="text-center">
          <div className={cn(
            "text-2xl font-bold mb-1",
            config.color
          )}>
            {currentValue}
          </div>
          <div className="text-sm text-gray-500 mb-2">
            {unit}
          </div>
          {threshold && status !== "normal" && (
            <div className="text-xs text-gray-600">
              {config.icon} Seuil: {threshold}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
