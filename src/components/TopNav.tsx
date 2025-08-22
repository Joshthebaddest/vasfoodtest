import { useState } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogOut, Settings, User, X, Lock, Building2, Mail, UserCircle, Shield } from "lucide-react";
import { logout } from "@/lib/api";
import vasLogo from "@/assets/vasLogo.png";
import { useProfile } from "@/hooks/useProfile";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";


const departments = [
  "Human Resources",
  "Finance",
  "Marketing",
  "Sales",
  "Operations",
  "IT",
  "Customer Service",
  "Legal",
  "Administration"
];

export function TopNav() {
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newDepartment, setNewDepartment] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Use TanStack Query for profile fetching with caching
  const { data: profile, isLoading: profileLoading, error } = useProfile();
  const { toast } = useToast();

  const user = {
    name: profile?.data?.full_name || localStorage.getItem("vasfood_display_name") || "User",
    email: profile?.data?.email || localStorage.getItem("vasfood_email") || "user@example.com",
    role: profile?.data?.role || "user",
    department: profile?.data?.department || "General",
    avatar: ""
  };

  const baseUrl = import.meta.env.VITE_API_URL;
  const isLocalhost =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";
  const apiBaseUrl = isLocalhost
    ? "http://localhost/vasfood"
    : `https://${baseUrl}`;

  const handleLogoutClick = () => {
    setShowLogoutDialog(true);
  };

  const handleLogoutConfirm = () => {
    logout();
  };

  const handleSettingsClick = () => {
  setNewDepartment(user.department || "");
  setShowSettingsModal(true);
};


  const handleCloseSettingsModal = () => {
    setShowSettingsModal(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setNewDepartment("");
  };

  const handleSaveSettings = async () => {
    // Validation checks
    if (newPassword && newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword && !currentPassword) {
      toast({
        title: "Error",
        description: "Current password is required to change password.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword && newPassword.length < 8) {
      toast({
        title: "Error",
        description: "New password must be at least 8 characters long.",
        variant: "destructive",
      });
      return;
    }

    // If no changes are made
    if (!newPassword && newDepartment === user.department) {
      toast({
        title: "Info",
        description: "No changes to save.",
        variant: "default",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Only update password if new password is provided
      if (newPassword) {
        const response = await fetch(`${apiBaseUrl}/auth/reset-password`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            email: user.email,
            current_password: currentPassword,
            new_password: newPassword,
          }),
        });

        const data = await response.json();

        if (!response.ok || data.status === "fail") {
          throw new Error(data.message || "Password reset failed");
        }

        toast({
          title: "Success",
          description: data.message || "Password updated successfully.",
        });
      }

      // Handle department update if needed (you might need a separate API endpoint for this)
      if (newDepartment !== user.department) {
  const response = await fetch(`${apiBaseUrl}/auth/profile`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
      department: newDepartment,
    }),
  });

  const data = await response.json();

  if (!response.ok || data.message !== "successful") {
    throw new Error(data.message || "Department update failed");
  }

  toast({
    title: "Success",
    description: data.message || "Department updated successfully.",
  });
}


      handleCloseSettingsModal();
    } catch (err: any) {
      console.error("Settings update error:", err);
      toast({
        title: "Error",
        description: err.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name.split(" ").map((n) => n[0]).join("").toUpperCase();
  };

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin': return 'text-red-600 bg-red-50';
      case 'manager': return 'text-blue-600 bg-blue-50';
      case 'staff': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <header className="h-16 border-b border-border bg-card flex items-center justify-between px-4 md:px-6 overflow-x-hidden">
      <div className="flex items-center gap-4">
        <SidebarTrigger />
        <div className="flex items-center gap-x-2 font-semibold text-lg text-foreground">
          <img src={vasLogo} alt="VAS Logo" className="h-8 w-8 rounded-md" />
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-10 w-10 rounded-full">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56 max-w-[calc(100vw-2rem)] bg-popover" align="end" forceMount>
          <div className="flex items-center justify-start gap-2 p-2">
            <div className="flex flex-col space-y-1 leading-none">
              <p className="font-medium text-sm">{user.name}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
              <p className="text-xs text-primary font-medium">{user.role}</p>
            </div>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="cursor-pointer" onClick={handleSettingsClick}>
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="cursor-pointer text-destructive" onClick={handleLogoutClick}>
            <LogOut className="mr-2 h-4 w-4" />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent className="w-[90%] max-w-sm rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>
              Are you sure you want to logout?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will end your current session.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="sm:flex-1">No</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogoutConfirm} className="sm:flex-1">
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={handleCloseSettingsModal}
          />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md transform transition-all">
            <div className="bg-white rounded-t-xl p-6 border-b border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Settings className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-black">Account Settings</h3>
                    <p className="text-sm text-muted-foreground">Manage your preferences</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCloseSettingsModal}
                  className="text-muted-foreground hover:bg-muted h-8 w-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16 border-4 border-gray-100">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-lg font-semibold">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{user.name}</h4>
                  <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                    <Mail className="w-3 h-3" />
                    {user.email}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                      <Shield className="w-3 h-3" />
                      {user.role}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Password Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-gray-700">
                  <Lock className="w-4 h-4" />
                  <h5 className="font-medium">Security</h5>
                </div>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="current-password">Current Password</Label>
                    <Input
                      id="current-password"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                    />
                  </div>
                  <div>
                    <Label htmlFor="new-password">New Password</Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                    />
                  </div>
                  <div>
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                    />
                  </div>
                </div>
              </div>

              {/* Department Section */}
              <div className="space-y-4">
  <div className="flex items-center gap-2 text-gray-700">
    <Building2 className="w-4 h-4" />
    <h5 className="font-medium">Department</h5>
  </div>
  <div>
    <Label htmlFor="department">Change Department</Label>
    <select
      id="department"
      value={newDepartment}
      onChange={(e) => setNewDepartment(e.target.value)}
      className="w-full mt-1 p-2 border border-gray-300 rounded-md text-sm"
    >
      <option value="" disabled>
        Select a department
      </option>
      {departments.map((dept) => (
        <option key={dept} value={dept}>
          {dept}
        </option>
      ))}
    </select>
  </div>
</div>

            </div>

            {/* Footer */}
            <div className="p-6 bg-gray-50 rounded-b-xl flex gap-3">
              <Button variant="outline" onClick={handleCloseSettingsModal} className="flex-1" disabled={isLoading}>
                Cancel
              </Button>
              <Button
                onClick={handleSaveSettings}
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={isLoading || (newPassword && newPassword !== confirmPassword)}
              >
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </div>

            {/* Password mismatch warning */}
            {newPassword && newPassword !== confirmPassword && (
              <div className="px-6 pb-2">
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <X className="w-3 h-3" />
                  Passwords do not match
                </p>
              </div>
            )}

            {/* Password requirements hint */}
            {newPassword && (
              <div className="px-6 pb-4">
                <p className="text-xs text-gray-500">
                  Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}