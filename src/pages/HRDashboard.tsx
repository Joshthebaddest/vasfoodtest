import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/StatusBadge";
import { useToast } from "@/hooks/use-toast";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Users,
  FileText,
  MessageSquare,
  Download,
  Check,
  Plus,
  Trash2,
  Utensils,
  Share2,
  Edit,
  X,
  Loader2,
} from "lucide-react";
import { BarChart3, ClipboardList, CheckCircle2 } from "lucide-react";
import { useTodaysOrders } from "@/hooks/useTodaysOrders";
import { useNavigate } from "react-router-dom";
import { adminCollectOrder, adminUncollectOrder } from "@/lib/api";
import {Tooltip} from "recharts";
import usePushNotifications from "@/hooks/usePushNotification";
import { useProfile } from "@/hooks/useProfile";
import{authenticatedFetch} from "@/lib/api";
import { useLocation } from "react-router-dom";
import { useQueryClient } from '@tanstack/react-query';
import InstallBanner from "@/components/installBanner";

type OrderStatus = "ordered" | "unordered" | "collected" | "unplaced";

interface Order {
  id?: number;
  userId?: number;
  staffName: string;
  meal: string;
  fallbackMeal: string;
  status: OrderStatus;
  time: string;
  branch?: string;
  department?: string;
  // Add optimistic state tracking
  isOptimistic?: boolean;
}

const calculateMealSummary = (orders: Order[]) => {
  const mealCounts: { [key: string]: number } = {};

  orders.forEach((order) => {
    mealCounts[order.meal] = (mealCounts[order.meal] || 0) + 1;
  });

  return Object.entries(mealCounts).map(([meal, count]) => ({
    meal,
    count,
  }));
};

export default function HRDashboard() {
  // Use TanStack Query for profile data with caching
  const { data: profile, isLoading: isLoadingProfile, error } = useProfile();
  const userProfile = profile?.data;
  const userId = userProfile?.id || null;
  const requestPushPermission = usePushNotifications(userId);


  const navigate = useNavigate();
  const location = useLocation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [editOrderMeal, setEditOrderMeal] = useState("");
  const [editOrderFallback, setEditOrderFallback] = useState("");
  const { toast } = useToast();
  const [showAllStats, setShowAllStats] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const queryClient = useQueryClient();

  // Track pending operations to prevent double-clicks
  const [pendingToggles, setPendingToggles] = useState<Set<number>>(new Set());

  // Handle responsive behavior
  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 640; // sm breakpoint
      setIsMobile(mobile);

      // Reset showAllStats when switching to desktop
      if (!mobile) {
        setShowAllStats(false);
      }
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  const baseUrl = import.meta.env.VITE_API_URL;
  // Determine API URL based on environment
  const isLocalhost = window.location.hostname === "localhost";
  const apiBaseUrl = isLocalhost
    ? "http://localhost/vasfood/auth"
    : `https://${baseUrl}/auth`;

  // Fetch today's orders using TanStack Query with better caching strategy
  const {
    data: todaysOrdersData,
    isLoading: isLoadingOrders,
    error: ordersError,
    refetch: refetchOrders,
  } = useTodaysOrders();

  useEffect(() => {
    if (todaysOrdersData?.status === "success") {
      const transformedOrders: Order[] = todaysOrdersData.data.map((order) => ({
        id: order.id,
        userId: order.user_id,
        staffName: order.full_name,
        meal: order.meal,
        fallbackMeal: order.fallback_meal,
        status: (order.collected === 1
          ? "collected"
          : "ordered") as OrderStatus,
        time: new Date(order.ordered_at).toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        branch: "Main Office",
        department: order.department,
        isOptimistic: false,
      }));
      setOrders(transformedOrders);
    } else {
      setOrders([]);
    }
  }, [todaysOrdersData]);

  // Better handling of navigation state with proper cleanup
  useEffect(() => {
    if (location.state?.refetch) {
      // Force refresh the query cache to avoid stale data
      queryClient.invalidateQueries({
        queryKey: ["todaysOrders"],
        exact: true,
        refetchType: "active", // Only refetch if the query is currently active
      });

      // Also force a refetch to ensure we get fresh data
      refetchOrders();

      // Clear the state after refetching to prevent it from refiring
      navigate("/hr", { replace: true, state: {} });
    }
  }, [location.state?.refetch, navigate, refetchOrders, queryClient]);

  useEffect(() => {
    if (ordersError) {
      toast({
        title: "Failed to load today's orders",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  }, [ordersError, toast]);

  // Optimistic update function with rollback capability
  const handleToggleStatus = async (orderId: number) => {
    // Prevent double-clicks
    if (pendingToggles.has(orderId)) {
      return;
    }

    const currentOrder = orders.find((order) => order.id === orderId);
    if (!currentOrder) {
      toast({
        title: "Order not found",
        description: "Could not find the order to update.",
        variant: "destructive",
      });
      return;
    }

    // Add to pending toggles
    setPendingToggles((prev) => new Set([...prev, orderId]));

    // Calculate new status
    const newStatus: OrderStatus =
      currentOrder.status === "ordered" ? "collected" : "ordered";

    // Optimistic update - update UI immediately
    const optimisticOrders = orders.map((order) =>
      order.id === orderId
        ? {
            ...order,
            status: newStatus,
            isOptimistic: true,
          }
        : order
    );
    setOrders(optimisticOrders);

    // Show optimistic toast
    toast({
      title:
        newStatus === "collected"
          ? "Collecting order... ⏳"
          : "Uncollecting order... ⏳",
      description: "Updating order status...",
    });

    try {
      // Perform API call in background
      if (newStatus === "collected") {
        await adminCollectOrder(currentOrder.id.toString());
      } else {
        await adminUncollectOrder(currentOrder.id.toString());
      }

      // Success - update with final state and remove optimistic flag
      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId
            ? {
                ...order,
                status: newStatus,
                isOptimistic: false,
              }
            : order
        )
      );

      // Invalidate and refetch to ensure consistency
      queryClient.invalidateQueries({
        queryKey: ["todaysOrders"],
        refetchType: "active",
      });

      // Success toast
      toast({
        title:
          newStatus === "collected"
            ? "Order collected! ✅"
            : "Order uncollected! 🔄",
        description: `Order has been marked as ${newStatus}`,
      });
    } catch (error) {
      console.error("Error toggling order status:", error);

      // Rollback optimistic update
      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId
            ? {
                ...order,
                status: currentOrder.status, // Revert to original status
                isOptimistic: false,
              }
            : order
        )
      );

      // Error toast
      toast({
        title: "Failed to update order status",
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      // Remove from pending toggles
      setPendingToggles((prev) => {
        const newSet = new Set(prev);
        newSet.delete(orderId);
        return newSet;
      });
    }
  };

  const handleDeleteOrder = async (orderId: number) => {
    // Optimistic removal
    const orderToDelete = orders.find((order) => order.id === orderId);
    if (!orderToDelete) return;

    // Remove from UI immediately
    setOrders((prev) => prev.filter((order) => order.id !== orderId));

    // Show optimistic toast
    toast({
      title: "Deleting order... ⏳",
      description: "Removing order from system...",
    });

    try {
      const response = await authenticatedFetch(`${apiBaseUrl}${orderId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.status === "success") {
        // Invalidate queries to ensure consistency
        queryClient.invalidateQueries({
          queryKey: ["todaysOrders"],
          refetchType: "active",
        });

        toast({
          title: "Order Cancelled ✅",
          description:
            result.message || "The order was cancelled successfully.",
          variant: "destructive",
        });
      } else {
        // Rollback - add the order back
        setOrders((prev) => [...prev, orderToDelete]);

        toast({
          title: "Failed to cancel order",
          description: result.message || "Failed to cancel order.",
          variant: "destructive",
        });
      }
    } catch (error) {
      // Rollback - add the order back
      setOrders((prev) => [...prev, orderToDelete]);

      toast({
        title: "Error cancelling order",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };

  const handleShareToVendor = () => {
    toast({
      title: "Sharing to vendor! 📤",
      description: "Order summary has been sent to the vendor",
    });
  };

  const handleEditOrder = (order: Order) => {
    navigate(`/hr/edit-order/${order.userId}`, {
      state: { staff: order },
    });
  };

  const handleSaveEdit = () => {
    if (editingOrder) {
      setOrders((prev) =>
        prev.map((order) =>
          order.id === editingOrder.id
            ? { ...order, meal: editOrderMeal, fallbackMeal: editOrderFallback }
            : order
        )
      );
      setEditingOrder(null);
      setEditOrderMeal("");
      setEditOrderFallback("");
      toast({
        title: "Order updated",
        description: "Order has been updated successfully",
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingOrder(null);
    setEditOrderMeal("");
    setEditOrderFallback("");
  };

  const totalOrders = orders.length;
  const orderedCount = orders.filter((o) => o.status === "ordered").length;
  const collectedCount = orders.filter((o) => o.status === "collected").length;

  // Determine whether to show all stats
  const shouldShowAllStats = !isMobile || showAllStats;

  return (
    <div className="space-y-6">
      <InstallBanner />
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">HR Dashboard</h1>
            <p className="text-muted-foreground">Manage daily food orders</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => navigate("/hr/staff-list")}>
            <Plus className="h-4 w-4 mr-2" />
            Create Order
          </Button>
        </div>
        <div className="flex gap-2">
          <Button onClick={requestPushPermission} className="bg-gray-600">
            <Plus className="h-4 w-4 mr-2" />
            Enable Notification
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Always show first card */}
          <Card className="shadow-md border border-primary/20">
            <CardContent className="flex flex-col items-center gap-2 py-6">
              <BarChart3 className="h-10 w-10 text-blue-500 bg-blue-100 p-2 rounded-full" />
              <p className="text-2xl font-bold text-primary">{totalOrders}</p>
              <p className="text-sm text-muted-foreground">Total Orders</p>
            </CardContent>
          </Card>

          {/* Show others based on responsive logic */}
          {shouldShowAllStats && (
            <>
              <Card className="shadow-md border border-yellow-400/30">
                <CardContent className="flex flex-col items-center gap-2 py-6">
                  <ClipboardList className="h-10 w-10 text-yellow-600 bg-yellow-100 p-2 rounded-full" />
                  <p className="text-2xl font-bold text-yellow-600">
                    {orderedCount}
                  </p>
                  <p className="text-sm text-muted-foreground">Ordered</p>
                </CardContent>
              </Card>

              <Card className="shadow-md border border-green-500/30">
                <CardContent className="flex flex-col items-center gap-2 py-6">
                  <CheckCircle2 className="h-10 w-10 text-green-600 bg-green-100 p-2 rounded-full" />
                  <p className="text-2xl font-bold text-green-600">
                    {collectedCount}
                  </p>
                  <p className="text-sm text-muted-foreground">Collected</p>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Toggle button (only visible on mobile) */}
        {isMobile && (
          <div className="flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAllStats(!showAllStats)}
            >
              {showAllStats ? "View Less" : "View More"}
            </Button>
          </div>
        )}
      </div>

      {/* Today's Orders & Meal Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Orders */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Today's Orders
              </CardTitle>
              <CardDescription>
                All orders placed today ({new Date().toLocaleDateString()})
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingOrders ? (
                <div className="flex items-center justify-center py-12">
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span className="text-muted-foreground">
                      Loading today's orders...
                    </span>
                  </div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Toggle</TableHead>
                      <TableHead>Staff Name</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Meal</TableHead>
                      <TableHead>Fallback Meal</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8">
                          <p className="text-muted-foreground">
                            No orders found for today
                          </p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      orders.map((order) => (
                        <TableRow
                          key={order.id}
                          className={
                            order.isOptimistic
                              ? "opacity-70 transition-opacity"
                              : ""
                          }
                        >
                          <TableCell>
                            {/* Mobile/Tablet: Checkbox */}
                            <div className="md:hidden">
                              <div className="relative">
                                <Checkbox
                                  checked={order.status === "collected"}
                                  onCheckedChange={() =>
                                    handleToggleStatus(order.id)
                                  }
                                  disabled={pendingToggles.has(order.id)}
                                />
                                {pendingToggles.has(order.id) && (
                                  <Loader2 className="h-3 w-3 animate-spin absolute -top-1 -right-1 text-primary" />
                                )}
                              </div>
                            </div>
                            {/* Desktop: Switch */}
                            <div className="hidden md:block">
                              <div className="relative">
                                <Switch
                                  checked={order.status === "collected"}
                                  onCheckedChange={() =>
                                    handleToggleStatus(order.id)
                                  }
                                  disabled={pendingToggles.has(order.id)}
                                />
                                {pendingToggles.has(order.id) && (
                                  <Loader2 className="h-3 w-3 animate-spin absolute -top-1 -right-1 text-primary" />
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            {order.staffName}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {order.department}
                          </TableCell>
                          <TableCell>{order.meal}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {order.fallbackMeal}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {order.time}
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={order.status} />
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <div
                                    title={
                                      order.status === "collected"
                                        ? "Cannot edit collected orders"
                                        : ""
                                    }
                                  >
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleEditOrder(order)}
                                      className={`${
                                        order.status === "collected"
                                          ? "text-muted-foreground border-muted-foreground cursor-not-allowed opacity-50"
                                          : "text-primary border-primary hover:bg-primary hover:text-primary-foreground"
                                      }`}
                                      disabled={order.status === "collected"}
                                    >
                                      <Edit className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[425px]">
                                  <DialogHeader>
                                    <DialogTitle>
                                      Edit Order - {order.staffName}
                                    </DialogTitle>
                                    <DialogDescription>
                                      Make changes to the order details here.
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="grid gap-4 py-4">
                                    <div className="grid grid-cols-4 items-center gap-4">
                                      <label
                                        htmlFor="meal"
                                        className="text-right text-sm font-medium"
                                      >
                                        Meal
                                      </label>
                                      <Input
                                        id="meal"
                                        value={editOrderMeal}
                                        onChange={(e) =>
                                          setEditOrderMeal(e.target.value)
                                        }
                                        className="col-span-3"
                                      />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                      <label
                                        htmlFor="fallback"
                                        className="text-right text-sm font-medium"
                                      >
                                        Fallback
                                      </label>
                                      <Input
                                        id="fallback"
                                        value={editOrderFallback}
                                        onChange={(e) =>
                                          setEditOrderFallback(e.target.value)
                                        }
                                        className="col-span-3"
                                      />
                                    </div>
                                  </div>
                                  <DialogFooter>
                                    <Button
                                      variant="outline"
                                      onClick={handleCancelEdit}
                                    >
                                      Cancel
                                    </Button>
                                    <Button onClick={handleSaveEdit}>
                                      Save Changes
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>

                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      Delete Order
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete{" "}
                                      {order.staffName}'s order? This action
                                      cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>NO</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() =>
                                        handleDeleteOrder(order.id)
                                      }
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      OK
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Meal Summary */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Meal Summary</CardTitle>
              <CardDescription>Today's order breakdown</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoadingOrders ? (
                <div className="flex items-center justify-center py-8">
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span className="text-muted-foreground">
                      Loading meal summary...
                    </span>
                  </div>
                </div>
              ) : (
                <>
                  {calculateMealSummary(orders).map((item, index) => (
                    <div
                      key={index}
                      className="flex justify-between p-3 bg-muted rounded-lg"
                    >
                      <span className="font-medium">{item.meal}</span>
                      <span className="text-primary font-bold">
                        {item.count}
                      </span>
                    </div>
                  ))}
                </>
              )}

              {/* Quick Action: Copy to Clipboard */}
              <div className="pt-4 border-t">
                <Button
                  className="w-full"
                  onClick={() => {
                    const summaryText = calculateMealSummary(orders)
                      .map((item) => `${item.meal}: ${item.count}`)
                      .join("\n");

                    navigator.clipboard
                      .writeText(summaryText)
                      .then(() => {
                        toast({
                          title: "Copied!",
                          description: "Meal summary copied to clipboard.",
                        });
                      })
                      .catch(() => {
                        toast({
                          title: "Failed to copy",
                          description: "Please try again.",
                          variant: "destructive",
                        });
                      });
                  }}
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  Copy to Clipboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
