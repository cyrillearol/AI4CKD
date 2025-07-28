import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  AlertTriangle, 
  FileText, 
  Settings 
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Patients", href: "/patients", icon: Users },
  { name: "Consultations", href: "/consultations", icon: Calendar },
  { name: "Alertes", href: "/alerts", icon: AlertTriangle },
  { name: "Rapports PDF", href: "/reports", icon: FileText },
  { name: "Paramètres", href: "/settings", icon: Settings },
];

export default function Sidebar() {
  const [location] = useLocation();
  
  const { data: stats } = useQuery<{
    totalPatients: number;
    todayConsultations: number;
    activeAlerts: number;
  }>({
    queryKey: ["/api/stats"]
  });

  return (
    <aside className="col-span-3 space-y-6">
      <Card>
        <CardContent className="p-4">
          <nav className="space-y-2">
            {navigation.map((item) => {
              const isActive = location === item.href;
              const Icon = item.icon;
              
              return (
                <Link key={item.name} href={item.href}>
                  <a className={cn(
                    "flex items-center space-x-3 px-3 py-2 rounded-md transition-colors",
                    isActive
                      ? "bg-medical-blue text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  )}>
                    <Icon className="h-5 w-5" />
                    <span>{item.name}</span>
                    {item.name === "Alertes" && stats?.activeAlerts && stats.activeAlerts > 0 && (
                      <Badge variant="destructive" className="ml-auto">
                        {stats.activeAlerts}
                      </Badge>
                    )}
                  </a>
                </Link>
              );
            })}
          </nav>
        </CardContent>
      </Card>

      {/* Quick Stats Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Statistiques Rapides</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Patients Total</span>
            <span className="font-semibold text-medical-blue">
              {stats?.totalPatients ?? 0}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Consultations Aujourd'hui</span>
            <span className="font-semibold text-medical-green">
              {stats?.todayConsultations ?? 0}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Alertes Actives</span>
            <span className="font-semibold text-alert-red">
              {stats?.activeAlerts ?? 0}
            </span>
          </div>
        </CardContent>
      </Card>
    </aside>
  );
}
