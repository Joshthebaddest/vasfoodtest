import {useEffect, useState} from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Utensils, Plus, Trash2, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { authenticatedFetch } from "@/lib/api";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface MenuItem {
  id: number;
  meal: string;
  day?: string;
}


export default function MenuManagement() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [newMenuItem, setNewMenuItem] = useState("");
  const {toast} = useToast();
  const navigate = useNavigate();
  const [itemToDelete, setItemToDelete] = useState<MenuItem | null>(null);

  const isLocalhost =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";

  const baseUrl = import.meta.env.VITE_API_URL;

  const API_BASE_URL = isLocalhost
      ? "http://localhost/vasfood/api/menu"
      : `https://${baseUrl}/api/menu`;

 // Fetch menu on page load
useEffect(() => {
  const fetchMenu = async () => {
    try {
      const res = await authenticatedFetch(API_BASE_URL, { method: "GET" });
      const data = await res.json();

      if (data?.status === "success" && Array.isArray(data.data)) {
        setMenuItems(data.data);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err) {
      toast({
        title: "Failed to load menu",
        description: "Unable to fetch menu items from the server.",
        variant: "destructive",
      });
    }
  };

  fetchMenu();
}, []);

const handleAddMenuItem = async () => {
  const trimmed = newMenuItem.trim();
  if (!trimmed) return;

  try {
    const res = await authenticatedFetch(API_BASE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ meal: trimmed }),
    });

    const result = await res.json();

    if (result.status === "success") {
      setMenuItems((prev) => [...prev, { ...result.data }]); // use returned item
      setNewMenuItem("");
      toast({
        title: "Menu item added! 🍽️",
        description: `"${trimmed}" has been added to the menu`,
      });
    } else {
      throw new Error(result.message || "Failed to add menu item");
    }
  } catch (err: any) {
    toast({
      title: "Error adding item",
      description: err.message || "Unexpected error occurred",
      variant: "destructive",
    });
  }
};

const handleRemoveMenuItem = async (id: number, meal: string) => {
  try {
    const res = await authenticatedFetch(`${API_BASE_URL}/${id}`, {
      method: "DELETE",
    });

    const result = await res.json();

    if (result.status === "success") {
      setMenuItems((prev) => prev.filter((item) => item.id !== id));
      toast({
        title: "Menu item removed! ❌",
        description: `"${meal}" has been removed from the menu`,
      });
    } else {
      throw new Error(result.message || "Failed to delete menu item");
    }
  } catch (err: any) {
    toast({
      title: "Error removing item",
      description: err.message || "Unexpected error occurred",
      variant: "destructive",
    });
  }
};




  return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button
              variant="ghost"
              onClick={() => navigate("/hr")}
              className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-2"/>
            Back to Dashboard
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <Utensils className="h-8 w-8 text-primary"/>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Menu Management</h1>
            <p className="text-muted-foreground">
              Add or remove menu items for daily orders
            </p>
          </div>
        </div>

        {/* Menu Management Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Utensils className="h-5 w-5 text-primary"/>
              Current Menu Items
            </CardTitle>
            <CardDescription>
              Manage the available meal options for staff orders
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Add New Item */}
            <div className="flex gap-2">
              <Input
                  placeholder="Enter new menu item"
                  value={newMenuItem}
                  onChange={(e) => setNewMenuItem(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleAddMenuItem()}
                  className="flex-1"
              />
              <Button
                  onClick={handleAddMenuItem}
                  disabled={!newMenuItem.trim()}
                  className="bg-primary hover:bg-primary-hover text-primary-foreground"
              >
                <Plus className="h-4 w-4 mr-2"/>
                Add Item
              </Button>
            </div>

            {/* Menu Items List */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-foreground">
                Menu Items ({menuItems.length})
              </h3>
              <div className="grid gap-2">
                {menuItems.map((item) => (
                    <div
                        key={item.id}
                        className="flex justify-between items-center p-3 bg-muted rounded-lg border"
                    >
                      <span className="font-medium text-foreground">{item.meal}</span>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setItemToDelete(item)}
                              className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                          >
                            <Trash2 className="h-3 w-3 mr-1"/>
                            Remove
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Menu Item?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to remove{" "}
                              <span className="font-semibold">{item.meal}</span> from the
                              menu? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setItemToDelete(null)}>
                              Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                                onClick={() => {
                                  if (itemToDelete) {
                                    handleRemoveMenuItem(
                                        itemToDelete.id,
                                        itemToDelete.meal
                                    );
                                    setItemToDelete(null);
                                  }
                                }}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Ok
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                ))}

                {menuItems.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Utensils className="h-12 w-12 mx-auto mb-4 opacity-50"/>
                      <p>No menu items available. Add some items to get started!</p>
                    </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

  );
}
