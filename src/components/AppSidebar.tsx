import {
  Home,
  Menu,
  History,
  Users,
  LogOut,
  MessageSquare,
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { logout, getApiBaseUrl, authenticatedFetch } from "@/lib/api";
import vasLogo from "@/assets/vasLogo.png";
import { useProfile } from "@/hooks/useProfile";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

type UserRole = "user" | "super_admin";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

const staffItems = [
  { title: "Dashboard", url: "/staff", icon: Home },
  {
    title: "Order History",
    url: "/staffOrderHistoryForDashboard",
    icon: History,
  },
];

const hrItems = [
  { title: "HR Dashboard", url: "/hr", icon: Users },
  { title: "Staff List", url: "/hr/staff-list", icon: Users },
  { title: "Order History", url: "/history", icon: History },
  {
    title: "Staff Order History",
    url: "/hr/staff-order-history",
    icon: History,
  },
  { title: "Menu Management", url: "/hr/menu-management", icon: Menu },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  // const currentPath = location.pathname;
  const { toast } = useToast();

  // Use TanStack Query for profile fetching with caching
  const { data: profile, isLoading, error } = useProfile();
  const userRole = (profile?.data?.role as UserRole) || "user";

  const getItems = () => {
    if (userRole === "super_admin") {
      return hrItems;
    }
    return staffItems;
  };

  const items = getItems();
  const isCollapsed = state === "collapsed";

  const handleNotifyStaff = async () => {
    try {
      const response = await authenticatedFetch(
        `${getApiBaseUrl()}/api/notification/push/notify`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: "Order Reminder 🍽️",
            message: "Hi there! Don’t forget to place your meal order today.",
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Staff notified! 📱",
          description:
            data.message || "WhatsApp reminder sent to all staff members",
        });
      } else {
        toast({
          title: "Notification failed ❌",
          description: data.message || "Something went wrong",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error ❌",
        description: "Could not send notification",
        variant: "destructive",
      });
      console.error("Notify staff error:", error);
    }
  };

  const handleShareWithVendor = () => {
    toast({
      title: "Shared with vendor! 🍽️",
      description: "Order summary sent to vendor via WhatsApp",
    });
  };

  const handleExportCSV = () => {
    toast({
      title: "Export started! 📊",
      description: "Daily report will download shortly",
    });
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <Sidebar
      className={`${
        isCollapsed ? "w-14" : "w-60"
      } bg-sidebar border-r border-sidebar-border flex flex-col`}
    >
      <SidebarContent className="bg-sidebar flex-1">
        <div className="px-4 py-6">
          <div className="flex items-center gap-3 mb-8">
            <img src={vasLogo} alt="vas logo" className="h-8 w-8 rounded-md" />
            {!isCollapsed && (
              <span className="text-3xl font-bold text-red-700 tracking-tight">
                VAS<span className="text-black">food</span>
              </span>
            )}
          </div>

          <SidebarGroup>
            <SidebarGroupLabel className="text-sidebar-foreground/70 font-semibold text-lg mb-4">
              {userRole === "super_admin" ? "HR Dashboard" : "Staff Dashboard"}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        end
                        className={({ isActive }) =>
                          isActive
                            ? "bg-sidebar-accent text-sidebar-accent-foreground font-bold text-lg px-4 py-3 rounded-lg shadow-sm border border-sidebar-border"
                            : "hover:bg-sidebar-accent/50 text-sidebar-foreground text-lg px-4 py-3 rounded-lg"
                        }
                      >
                        <item.icon className="h-6 w-6" />
                        {!isCollapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {userRole === "super_admin" && (
            <SidebarGroup className="mt-6">
              {/* <SidebarGroupLabel className="text-sidebar-foreground/70 font-semibold text-lg mb-4">
                Quick Actions
              </SidebarGroupLabel> */}
              <SidebarGroupContent>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNotifyStaff}
                    className="w-full justify-start text-lg py-3 border-sidebar-border hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  >
                    <MessageSquare className="h-6 w-6" />
                    {!isCollapsed && <span className="ml-2">Notify Staff</span>}
                  </Button>

                  {/*<Button*/}
                  {/*  variant="outline"*/}
                  {/*  size="sm"*/}
                  {/*  onClick={handleShareWithVendor}*/}
                  {/*  className="w-full justify-start text-lg py-3 border-sidebar-border hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"*/}
                  {/*>*/}
                  {/*  <MessageSquare className="h-6 w-6" />*/}
                  {/*  {!isCollapsed && <span className="ml-2">Share with Vendor</span>}*/}
                  {/*</Button>*/}

                  {/* <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportCSV}
                    className="w-full justify-start text-lg py-3 border-sidebar-border hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  >
                    <Download className="h-6 w-6" />
                    {!isCollapsed && <span className="ml-2">Export CSV</span>}
                  </Button> */}
                </div>
              </SidebarGroupContent>
            </SidebarGroup>
          )}
        </div>
      </SidebarContent>

      <div className="p-4 border-t border-sidebar-border bg-sidebar">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button className="w-full flex items-center gap-3 bg-red-500 text-white hover:bg-red-600 text-lg py-3">
              <LogOut className="h-6 w-6" />
              {!isCollapsed && <span>Logout</span>}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="w-[90%] max-w-sm rounded-xl">
            <AlertDialogHeader>
              <AlertDialogTitle>
                Are you sure you want to logout?
              </AlertDialogTitle>
              <AlertDialogDescription>
                This will end your current session.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>No</AlertDialogCancel>
              <AlertDialogAction onClick={handleLogout}>OK</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Sidebar>
  );
}
