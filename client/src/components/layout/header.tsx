import { useQuery } from "@tanstack/react-query";
import { Bell, Heart } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Header() {
  const { data: stats } = useQuery<{
    totalPatients: number;
    todayConsultations: number;
    activeAlerts: number;
  }>({
    queryKey: ["/api/stats"]
  });

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Heart className="h-8 w-8 text-medical-blue" />
              <h1 className="text-xl font-bold text-gray-900">AI4CKD</h1>
              <Badge variant="secondary" className="text-xs">
                MRC Management
              </Badge>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative cursor-pointer hover:text-medical-blue transition-colors">
              <Bell className="h-5 w-5 text-gray-500" />
              {stats?.activeAlerts && stats.activeAlerts > 0 && (
                <span className="absolute -top-2 -right-2 bg-alert-red text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                  {stats.activeAlerts}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <div className="w-8 h-8 bg-medical-blue text-white rounded-full flex items-center justify-center text-sm font-semibold">
                DK
              </div>
              <span className="font-medium">Dr. Kouakou</span>
              <span className="text-gray-400">|</span>
              <span className="text-gray-500">Néphrologue</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
