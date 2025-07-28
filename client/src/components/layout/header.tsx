import { useQuery } from "@tanstack/react-query";
import { Bell, Heart, LogOut, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Header() {
  const { user, logoutMutation } = useAuth();
  const { data: stats } = useQuery<{
    totalPatients: number;
    todayConsultations: number;
    activeAlerts: number;
  }>({
    queryKey: ["/api/stats"]
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2 text-sm">
                  <div className="w-8 h-8 bg-medical-blue text-white rounded-full flex items-center justify-center text-sm font-semibold">
                    {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                  </div>
                  <div className="text-left">
                    <div className="font-medium">Dr. {user?.firstName} {user?.lastName}</div>
                    <div className="text-xs text-gray-500 capitalize">{user?.role}</div>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Mon Compte</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profil</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} disabled={logoutMutation.isPending}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Se déconnecter</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
