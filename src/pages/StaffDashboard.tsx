import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/StatusBadge";
import { useToast } from "@/hooks/use-toast";
import { ChefHat, Clock, CheckCircle, Plus } from "lucide-react";
import vasLogo from "@/assets/vasLogo.png";
import {  Pencil, Trash2 } from "lucide-react";
import foodIcon from "@/assets/food_icon-removebg-preview.png";
import DepartmentSelection from "@/components/DepartmentSelection";
import { updateProfile, placeOrder, collectOrder, getApiBaseUrl } from "@/lib/api";
import { useProfile } from "@/hooks/useProfile";
import { useTodayOrder } from "@/hooks/useOrders";
import * as Tooltip from "@radix-ui/react-tooltip";
import { editOrder, authenticatedFetch } from "@/lib/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import usePushNotifications from "@/hooks/usePushNotification";
import InstallBanner from "@/components/installBanner";



const branches = ["Ajao Estate", "Ikoyi"];

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

export default function StaffDashboard() {
    const [selectedMeal, setSelectedMeal] = useState("");
    const [fallbackMeal, setFallbackMeal] = useState("");
    const [customMeal, setCustomMeal] = useState("");
    const [selectedBranch, setSelectedBranch] = useState("");
    const [showDepartmentSelection, setShowDepartmentSelection] = useState(false);
    const [userDepartment, setUserDepartment] = useState("");
    const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
    const [isMarkingCollected, setIsMarkingCollected] = useState(false);
    const [isUpdatingDepartment, setIsUpdatingDepartment] = useState(false);
    const [isEditingOrder, setIsEditingOrder] = useState(false);

  // Use TanStack Query for profile data with caching
  const { data: profile, isLoading: isLoadingProfile, error } = useProfile();
  const userProfile = profile?.data;
  const userId = userProfile?.id || null;
  const requestPushPermission = usePushNotifications(userId);

  // Use TanStack Query for today's order with caching
  const { 
    data: todayOrderData, 
    isLoading: isLoadingTodayOrder, 
    refetch: refetchTodayOrder 
  } = useTodayOrder(userProfile?.id || 0);

  const [todaysOrder, setTodaysOrder] = useState<{
    meal: string;
    fallback_meal?: string;
    status: "ordered" | "collected";
    time: string;
    id: number;
  } | null>(null);
  const [todaysOrders, setTodaysOrders] = useState<any[]>([]);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);
  const [collectIndex, setCollectIndex] = useState<number | null>(null);
  const [menuItems, setMenuItems] = useState<string[]>([]);
  const [isMenuLoading, setIsMenuLoading] = useState(true);

  const { toast } = useToast();

    const API_BASE_URL = `${getApiBaseUrl()}/api/menu`;
    const url = `${getApiBaseUrl()}/api`;
    


  useEffect(() => {
  const fetchMenu = async () => {
    try {
      setIsMenuLoading(true);

      const res = await authenticatedFetch(API_BASE_URL, {
        method: "GET",
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to fetch menu items");
      }

      const data = await res.json();

      if (!Array.isArray(data.data)) {
        throw new Error("Unexpected response format: menu data is not an array");
      }

      const items = data.data.map((item: any) => item.meal);
      setMenuItems(items);

    } catch (error) {
      console.error(error);
      toast({
        title: "Error fetching menu",
        description: error instanceof Error ? error.message : "Could not load menu items.",
        variant: "destructive",
      });
    } finally {
      setIsMenuLoading(false);
    }
  };

  fetchMenu();
}, [API_BASE_URL, toast]);



  // Check if user has completed department selection
  useEffect(() => {
    if (!isLoadingProfile) {
      if (userProfile) {
        const { department, full_name, email } = userProfile;
        
        // Update display name from API if available
        if (full_name) {
          localStorage.setItem("vasfood_display_name", full_name);
        }
        
        // Update email in localStorage
        if (email) {
          localStorage.setItem("vasfood_email", email);
        }
        
        if (department) {
          // User already has a department set
          setUserDepartment(department);
          localStorage.setItem("vasfood_department", department);
          setShowDepartmentSelection(false);
        } else {
          // User doesn't have a department, show selection popup
          setShowDepartmentSelection(true);
        }
      } else if (error) {
        // If there's an error loading profile, don't show department selection
        console.error("Error loading profile:", error);
        setShowDepartmentSelection(false);
      }
    }
  }, [userProfile, isLoadingProfile, error]);

  // Update local state when cached data changes
  useEffect(() => {
    console.log('useEffect: todayOrderData:', todayOrderData);
    
    if (todayOrderData?.status === "success" && todayOrderData.data) {
      const orderData = {
        id: todayOrderData.data.id,
        meal: todayOrderData.data.meal,
        fallback_meal: todayOrderData.data.fallback_meal || undefined,
        status: (todayOrderData.data.collected ? "collected" : "ordered") as "ordered" | "collected",
        time: todayOrderData.data.ordered_at
      };
      console.log('useEffect: Setting todaysOrder:', orderData);
      setTodaysOrder(orderData);
    } else {
      console.log('useEffect: Setting todaysOrder to null');
      setTodaysOrder(null);
    }
  }, [todayOrderData]);

  // Monitor editIndex changes
  useEffect(() => {
    console.log('editIndex changed to:', editIndex);
  }, [editIndex]);

  // Prevent modal from being closed by user interaction
  const handleModalClose = () => {
    // Do nothing - modal cannot be closed until department is selected
  };

  const handleEditClick = () => {
    try {
      console.log('handleEditClick: todaysOrder:', todaysOrder);
      
      if (!todaysOrder) {
        console.log('handleEditClick: No today order found');
        toast({
          title: "No order to edit",
          description: "You don't have an order to edit.",
          variant: "destructive",
        });
        return;
      }

      // Populate the form fields with current order data
      setSelectedMeal(todaysOrder.meal || "");
      setFallbackMeal(todaysOrder.fallback_meal || undefined);

      // If it's a custom meal (not in the predefined menu), handle it
      if (todaysOrder.meal && !menuItems.includes(todaysOrder.meal)) {
        setSelectedMeal("Other");
        setCustomMeal(todaysOrder.meal);
      } else {
        setCustomMeal("");
      }

      // Open the edit dialog
      console.log('handleEditClick: Setting editIndex to 0');
      setEditIndex(0);
      
      console.log('handleEditClick: Edit dialog opened successfully');
    } catch (error) {
      console.error('handleEditClick: Error:', error);
      toast({
        title: "Error opening edit dialog",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDepartmentConfirm = async (department: string) => {
    try {
      setIsUpdatingDepartment(true);
      // API call to update user profile
      const updateResponse = await updateProfile(department);
      
      if (updateResponse.success) {
        setUserDepartment(department);
        localStorage.setItem("vasfood_department", department);
        setShowDepartmentSelection(false);
        
        toast({
          title: "Profile completed! 🎉"
          // description: `Welcome to ${department} department!`,
        });
      } else {
        toast({
          title: "Update failed",
          description: "Failed to update your department. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to update profile:", error);
      toast({
        title: "Network error",
        description: "Failed to update your department. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingDepartment(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const handleSubmitOrder = async () => {
    const mealName = selectedMeal === "Other" ? customMeal : selectedMeal;
    
    if (!mealName) {
      toast({
        title: "Please select a meal",
        description: "You need to choose something before placing your order.",
        variant: "destructive",
      });
      return;
    }

    // if (!selectedBranch) {
    //   toast({
    //     title: "Please select a branch",
    //     description: "You need to select your branch before placing your order.",
    //     variant: "destructive",
    //   });
    //   return;
    // }

    setIsSubmittingOrder(true);

    try {
      // Get user ID from profile
      const userId = userProfile?.id;
      if (!userId) {
        toast({
          title: "Error",
          description: "User profile not loaded. Please refresh the page.",
          variant: "destructive",
        });
        return;
      }

      // Prepare order data
      const orderData = {
        meal: mealName,
        fallback_meal: fallbackMeal || undefined,
      };

      // Call the API
      const response = await placeOrder(userId, orderData);

      if (response.status === "success") {
        // Refetch today's order from cache to get updated data
         const { data: refreshedData } = await refetchTodayOrder();
if (refreshedData?.status === "success" && refreshedData.data) {
  const orderData = {
    id: refreshedData.data.id,
    meal: refreshedData.data.meal,
    fallback_meal: refreshedData.data.fallback_meal || undefined,
    status: refreshedData.data.collected ? "collected" : "ordered",
    time: refreshedData.data.ordered_at,
  };
  setTodaysOrder(orderData);
}


    toast({
      title: "Order placed successfully! 🍽️",
      description: response.message || `You ordered: ${mealName}.`,
    });

    // Reset form
    setSelectedMeal("");
    setFallbackMeal("");
    setCustomMeal("");
    setSelectedBranch("");
              } else {
        toast({
          title: "Order failed",
          description: response.message || "Failed to place order. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error placing order:", error);
      const errorMessage = error instanceof Error ? error.message : "Network error. Please check your connection and try again.";
      toast({
        title: "Order failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  const handleMarkCollected = async () => {
    try {
      // Get user ID from profile
      const userId = userProfile?.id;
      if (!userId) {
        toast({
          title: "Error",
          description: "User profile not loaded. Please refresh the page.",
          variant: "destructive",
        });
        return;
      }

      setIsMarkingCollected(true);

      // Call the API
      const response = await collectOrder(userId);

      if (response.status === "success") {
        // Refetch today's order from cache to get updated status
        const { data: refreshedData } = await refetchTodayOrder();
if (refreshedData?.status === "success" && refreshedData.data) {
  setTodaysOrder({
    id: refreshedData.data.id,
    meal: refreshedData.data.meal,
    fallback_meal: refreshedData.data.fallback_meal || undefined,
    status: refreshedData.data.collected ? "collected" : "ordered",
    time: refreshedData.data.ordered_at,
  });
}

        
        toast({
          title: "Order marked as collected ✅",
          description: response.message || "Enjoy your meal!",
        });
      } else {
        toast({
          title: "Failed to mark as collected",
          description: response.message || "Failed to update order status. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Network error. Please check your connection and try again.";
      toast({
        title: "Failed to mark as collected",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsMarkingCollected(false);
    }
  };

  // const confirmDeleteOrder = () => {
  //   if (deleteIndex === null) return;
  //   setTodaysOrders((prev) => prev.filter((_, i) => i !== deleteIndex));
  //   toast({ title: "Order Deleted" });
  //   setDeleteIndex(null);
  // };

  // Fix 3: Update handleEditOrder to use loading state
  const handleEditOrder = async () => {
    if (editIndex === null) return;

    const mealName = selectedMeal === "Other" ? customMeal : selectedMeal;

    // Validation
    if (!mealName) {
      toast({
        title: "Please select a meal",
        description: "You need to choose something before updating your order.",
        variant: "destructive",
      });
      return;
    }

    // Get user ID from profile
    const userId = userProfile?.id;
    if (!userId) {
      toast({
        title: "Error",
        description: "User profile not loaded. Please refresh the page.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsEditingOrder(true); // Enable loading state

      // Prepare order data
      const orderData = {
        meal: mealName,
        fallback_meal: fallbackMeal || undefined,
      };

      // Call the edit order API
      const response = await editOrder(userId, orderData);

      if (response.status === "success") {
        // Refetch today's order from cache to get updated data
        refetchTodayOrder();

        toast({
          title: "Order updated successfully! ✏️",
          description: response.message || `Your order has been updated to: ${mealName}`,
        });

        // Close the edit dialog
        setEditIndex(null);

        // Reset form fields
        setSelectedMeal("");
        setFallbackMeal("");
        setCustomMeal("");
      } else {
        toast({
          title: "Update failed",
          description: response.message || "Failed to update order. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating order:", error);
      const errorMessage = error instanceof Error ? error.message : "Network error. Please check your connection and try again.";
      toast({
        title: "Update failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsEditingOrder(false); // Disable loading state
    }
  };
  const confirmMarkCollected = () => {
    if (collectIndex === null) return;
    setTodaysOrders((prev) => prev.map((o, i) => 
      i === collectIndex ? { ...o, status: "collected" } : o
    ));
    toast({ title: "Marked as Collected", description: "Enjoy your meal!" });
    setCollectIndex(null);
  };

  // Show loading state while fetching profile or today's order
  if (isLoadingProfile || isLoadingTodayOrder) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <InstallBanner />
      
      <DepartmentSelection
        isOpen={showDepartmentSelection}
        onClose={handleModalClose}
        onConfirm={handleDepartmentConfirm}
        displayName={userProfile?.full_name || localStorage.getItem("vasfood_display_name") || "User"}
        isLoading={isUpdatingDepartment}
      />
      
      {/* Welcome Header */}
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {getGreeting()}, {userProfile?.full_name || localStorage.getItem("vasfood_display_name") || "User"}!
          </h1>
          <p className="text-muted-foreground">Ready to order your lunch?</p>
          <div className="flex gap-2">
            <Button onClick={requestPushPermission} className="bg-gray-600">
              <Plus className="h-4 w-4 mr-2" />
              Enable Notification
            </Button>
          </div>
          {/*{userProfile?.email && (*/}
          {/*  <p className="text-sm text-gray-500">{userProfile.email}</p>*/}
          {/*)}*/}
          {/*{userDepartment && (*/}
          {/*  <p className="text-sm text-gray-600">{userDepartment} Department</p>*/}
          {/*)}*/}
          {/*{userProfile?.role && (*/}
          {/*  <p className="text-xs text-gray-400 capitalize">{userProfile.role}</p>*/}
          {/*)}*/}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Place Order Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <img src={foodIcon} alt="Food Icon" className="h-10 w-10" />
              Place Your Order
            </CardTitle>
            <CardDescription>Select from today's menu</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Today's Menu</Label>
              <Select value={selectedMeal} onValueChange={setSelectedMeal}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose your meal..." />
                </SelectTrigger>
                <SelectContent>
                  {menuItems.map((item) => (
                    <SelectItem key={item} value={item}>{item}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedMeal === "Other" && (
              <div className="space-y-2">
                <Label htmlFor="custom-meal">Custom Meal Request</Label>
                <Input
                  id="custom-meal"
                  placeholder="Describe your meal request..."
                  value={customMeal}
                  onChange={(e) => setCustomMeal(e.target.value)}
                />
              </div>
            )}

            {/*<div className="space-y-2">*/}
            {/*  <Label htmlFor="branch-select">Branch</Label>*/}
            {/*  <Select value={selectedBranch} onValueChange={setSelectedBranch}>*/}
            {/*    <SelectTrigger id="branch-select">*/}
            {/*      <SelectValue placeholder="Select your branch..." />*/}
            {/*    </SelectTrigger>*/}
            {/*    <SelectContent className="bg-popover">*/}
            {/*      {branches.map((branch) => (*/}
            {/*        <SelectItem key={branch} value={branch}>*/}
            {/*          {branch}*/}
            {/*        </SelectItem>*/}
            {/*      ))}*/}
            {/*    </SelectContent>*/}
            {/*  </Select>*/}
            {/*</div>*/}


            <div className="space-y-2">
              <Label htmlFor="fallback-select">Alternative Option (if first choice unavailable)</Label>
              <Select 
                value={fallbackMeal} 
                onValueChange={setFallbackMeal}
                disabled={!selectedMeal}
              >
                <SelectTrigger id="fallback-select">
                  <SelectValue placeholder="Choose alternative meal..." />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  {menuItems
                    .filter(item => item !== "Other" && item !== selectedMeal)
                    .map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

              <Button
                  onClick={handleSubmitOrder}
                  className="w-full bg-primary hover:bg-primary-hover text-primary-foreground"
                  disabled={!selectedMeal || (selectedMeal === "Other" && !customMeal) || isSubmittingOrder}
              >
                  {isSubmittingOrder ? (
                      <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Placing Order...
                      </>
                  ) : (
                      "Submit Order"
                  )}
              </Button>
          </CardContent>
        </Card>

        {/* Today's Order Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {todaysOrder ? (
                todaysOrder.status === "ordered" ? (
                  <img
                    src={foodIcon}
                    alt="Food Icon"
                    className="h-10 w-15 rounded-md"
                  />
                ) : (
                  <CheckCircle className="h-5 w-5 text-success" />
                )
              ) : (
                <img
                  src={foodIcon}
                  alt="Food Icon"
                  className="h-10 w-15 rounded-md"
                />
              )}
              Today's Order
            </CardTitle>
            <CardDescription>
              Your current order status
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {todaysOrder ? (
              <>
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div>
                <p className="font-medium text-foreground">{todaysOrder.meal}</p>
                    {todaysOrder.fallback_meal && (
                      <p className="text-sm text-muted-foreground">Fallback: {todaysOrder.fallback_meal}</p>
                    )}
                <p className="text-sm text-muted-foreground">Ordered at {todaysOrder.time}</p>
              </div>
              <StatusBadge status={todaysOrder.status} />
            </div>

            {todaysOrder.status === "ordered" && (
              <div className="flex gap-2">
                {/*<Button*/}
                {/*  variant="outline"*/}
                {/*  className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"*/}
                {/*  onClick={() => setEditIndex(0)}*/}
                {/*  type="button"*/}
                {/*>*/}
                {/*  <Pencil className="h-4 w-4 mr-1" /> Edit*/}
                {/*</Button>*/}
                {/*<Button*/}
                {/*  variant="outline"*/}
                {/*  className="border-muted text-muted hover:bg-muted hover:text-foreground"*/}
                {/*  onClick={() => {*/}
                {/*    setSelectedMeal(todaysOrder.meal);*/}
                {/*    setFallbackMeal(todaysOrder.fallback_meal || "");*/}
                {/*    setCustomMeal("");*/}
                {/*  }}*/}
                {/*  type="button"*/}
                {/*>*/}
                {/*  Cancel*/}
                {/*</Button>*/}
                  <Tooltip.Provider>
                      <Tooltip.Root>
                          <Tooltip.Trigger asChild>
                              <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-primary hover:bg-primary/10"
                                  onClick={handleEditClick}
                                  type="button"
                              >
                                  <Pencil className="h-5 w-5" />
                              </Button>
                          </Tooltip.Trigger>
                          <Tooltip.Content
                              side="top"
                              align="center"
                              className="bg-black text-white text-xs px-2 py-1 rounded shadow-md"
                          >
                              Edit
                          </Tooltip.Content>
                      </Tooltip.Root>
                  </Tooltip.Provider>

                  <Tooltip.Provider>
                      <Tooltip.Root>
                          <Tooltip.Trigger asChild>
       <Button
  variant="ghost"
  size="icon"
  className="text-destructive hover:bg-destructive/10"
  onClick={async () => {
    if (!todaysOrder?.id) {
      toast({
        title: 'No Order Selected',
        description: 'Please ensure that today\'s order is loaded before trying to cancel it.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const res = await authenticatedFetch(`${url}/order/cancel-order/${todaysOrder.id}`, {
        method: 'DELETE',
      });

      const result = await res.json();

      if (result.status === 'success') {
        toast({
          title: 'Order Cancelled',
          description: `Order with meal "${todaysOrder.meal}" has been successfully cancelled.`,
          variant: 'success',
        });

        setTodaysOrder(null); // Clear state
      } else {
        toast({
          title: 'Failed to Cancel Order',
          description: result.errors || result.message || 'An error occurred while cancelling the order.',
          variant: 'destructive',
        });
      }
    } catch (err: any) {
      console.error('Error cancelling order:', err);
      toast({
        title: 'Error cancelling order',
        description: err.message || 'Unexpected error occurred.',
        variant: 'destructive',
      });
    }
  }}
  type="button"
>
  <Trash2 className="h-5 w-5" />
</Button>



                          </Tooltip.Trigger>
                          <Tooltip.Content
                              side="top"
                              align="center"
                              className="bg-black text-white text-xs px-2 py-1 rounded shadow-md"
                          >
                              Delete
                          </Tooltip.Content>
                      </Tooltip.Root>
                  </Tooltip.Provider>

                  <Button
                  onClick={handleMarkCollected}
                  variant="outline"
                  className="w-full border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  disabled={isMarkingCollected}
                >
                  {isMarkingCollected ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-destructive mr-2"></div>
                      Marking as Collected...
                    </>
                  ) : (
                    "Mark as Collected"
                  )}
                </Button>
              </div>
            )}
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No order placed today</p>
                <p className="text-sm text-muted-foreground">Place your order above to get started!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Info */}
      <Card className="bg-accent">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-accent-foreground" />
            <div>
              <p className="font-medium text-accent-foreground">
                Order Deadline: 09:30 AM daily
              </p>
              <p className="text-sm text-accent-foreground/80">
                Don't forget to place your order before the deadline!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {editIndex !== null && (
        <Dialog open={true} onOpenChange={() => setEditIndex(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Your Order</DialogTitle>
              <DialogDescription>Update your meal selection</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Edit Meal</Label>
                <Select value={selectedMeal} onValueChange={setSelectedMeal}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose your meal..." />
                  </SelectTrigger>
                  <SelectContent>
                    {menuItems.map((item) => (
                      <SelectItem key={item} value={item}>{item}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {selectedMeal === "Other" && (
                <div className="space-y-2">
                  <Label htmlFor="custom-meal-edit">Custom Meal Request</Label>
                  <Input
                    id="custom-meal-edit"
                    placeholder="Describe your meal request..."
                    value={customMeal}
                    onChange={(e) => setCustomMeal(e.target.value)}
                  />
                </div>
              )}
              
              <div className="space-y-2">
                <Label>Edit Alternative (Optional)</Label>
                <Select value={fallbackMeal || ""} onValueChange={(value) => setFallbackMeal(value || undefined)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose fallback..." />
                  </SelectTrigger>
                  <SelectContent>
                    {menuItems.filter(item => item !== selectedMeal).map((item) => (
                      <SelectItem key={item} value={item}>{item}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Button
                onClick={handleEditOrder}
                className="w-full"
                disabled={isEditingOrder || !selectedMeal || (selectedMeal === "Other" && !customMeal)}
              >
                {isEditingOrder ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Updating Order...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/*{deleteIndex !== null && (*/}
      {/*  <Dialog open={true} onOpenChange={() => setDeleteIndex(null)}>*/}
      {/*    <DialogContent>*/}
      {/*      <CardTitle>Delete Order</CardTitle>*/}
      {/*      <CardDescription>Are you sure you want to delete this order? This action cannot be undone.</CardDescription>*/}
      {/*      <div className="flex justify-end gap-4 mt-4">*/}
      {/*        <Button variant="outline" onClick={() => setDeleteIndex(null)}>NO*/}
      {/*        <Button className="bg-red-600 text-white" onClick={confirmDeleteOrder}>OK*/}
      {/*      </div>*/}
      {/*    </DialogContent>*/}
      {/*  </Dialog>*/}
      {/*)}*/}

      {collectIndex !== null && (
        <Dialog open={true} onOpenChange={() => setCollectIndex(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Mark as Collected</DialogTitle>
              <DialogDescription>Are you sure you want to mark this order as collected?</DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-4 mt-4">
              <Button variant="outline" onClick={() => setCollectIndex(null)}>NO</Button>
              <Button className="bg-red-600 text-white" onClick={confirmMarkCollected}>OK</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
