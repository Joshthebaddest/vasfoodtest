import { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Edit, Save, Loader2, User } from "lucide-react";
import { adminEditOrder, authenticatedFetch } from "@/lib/api";

const baseUrl = import.meta.env.VITE_API_URL;

const isLocalhost = window.location.hostname === "localhost";
const API_BASE_URL = isLocalhost
    ? "http://localhost/vasfood/api/menu"
    : `https://${baseUrl}/api/menu`;

interface OrderData {
  id: number;
  user_id: number;
  meal: string;
  fallback_meal: string;
  collected: number;
  ordered_at: string;
  updated_at: string;
  full_name?: string;
}

export default function EditOrder() {
  const navigate = useNavigate();
  const { userId } = useParams();
  const { toast } = useToast();

  const location = useLocation();
  const staff = location.state?.staff;

  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [selectedMeal, setSelectedMeal] = useState("");
  const [customMeal, setCustomMeal] = useState("");
  const [fallbackMeal, setFallbackMeal] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [menuItems, setMenuItems] = useState<string[]>([]);
  const [isMenuLoading, setIsMenuLoading] = useState(true);

  // Fetch menu items from API
  useEffect(() => {
    const fetchMenu = async () => {
      try {
        setIsMenuLoading(true);
        const res = await authenticatedFetch(API_BASE_URL);
        if (!res.ok) throw new Error("Failed to fetch menu items");
        const data = await res.json();
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
  }, [toast]);

  // Populate staff data from location state
  useEffect(() => {
      // console.log('Staff data:', staff); // Log the staff object
    if (staff) {
      setSelectedMeal(staff.meal);
      setFallbackMeal(staff.fallback_meal);
      setOrderData({
        id: staff.id,
        user_id: staff.id,
        meal: staff.meal,
        fallback_meal: staff.fallback_meal,
        collected: 0,
        ordered_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        full_name: staff.staffName || "Unknown",
      });
    }
    setIsLoading(false);
  }, [staff]);

  const handleSaveOrder = async () => {
    const mealName = selectedMeal === "Other" ? customMeal : selectedMeal;

    if (!mealName) {
      toast({
        title: "Please select a meal",
        description: "You need to choose a meal before saving the order.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const orderData = {
        meal: mealName,
        fallback_meal: fallbackMeal || "None",
      };

      await adminEditOrder(userId!, orderData);

      toast({
        title: "Order updated successfully! 🍽️",
        description: `Order has been updated successfully.`,
      });

    navigate("/hr", { state: { refetch: true } });
    } catch (error) {
      console.error("Error updating order:", error);
      toast({
        title: "Failed to update order",
        description: error instanceof Error ? error.message : "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || isMenuLoading) {
    return (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Button
                variant="ghost"
                onClick={() => navigate("/hr")}
                className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>

          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
            <span className="text-muted-foreground">Loading data...</span>
          </div>
        </div>
    );
  }

  if (!orderData) {
    return (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Button
                variant="ghost"
                onClick={() => navigate("/hr")}
                className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>

          <div className="text-center py-12">
            <p className="text-muted-foreground">Order not found</p>
          </div>
        </div>
    );
  }

  return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button
              variant="ghost"
              onClick={() => navigate("/hr")}
              className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <Edit className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Edit Order</h1>
            <p className="text-muted-foreground">Editing order for {orderData.full_name}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Order Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Order Information
              </CardTitle>
              <CardDescription>Details of the order being edited</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Order ID</Label>
                <Input value={orderData.id.toString()} disabled />
              </div> */}

              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Staff Name</Label>
                <Input value={orderData.full_name || "Unknown"} disabled />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Order Date</Label>
                <Input value={new Date(orderData.ordered_at).toLocaleString()} disabled />
              </div>
            </CardContent>
          </Card>

          {/* Edit Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Save className="h-5 w-5 text-primary" />
                Edit Order Details
              </CardTitle>
              <CardDescription>Update meal options for this order</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="meal-select">Meal Selection</Label>
                <Select value={selectedMeal} onValueChange={setSelectedMeal}>
                  <SelectTrigger id="meal-select">
                    <SelectValue placeholder="Choose meal..." />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    {menuItems.map((item) => (
                        <SelectItem key={item} value={item}>
                          {item}
                        </SelectItem>
                    ))}
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {selectedMeal === "Other" && (
                  <div className="space-y-2">
                    <Label htmlFor="custom-meal">Custom Meal Request</Label>
                    <Input
                        id="custom-meal"
                        placeholder="Describe the meal..."
                        value={customMeal}
                        onChange={(e) => setCustomMeal(e.target.value)}
                    />
                  </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="fallback-select">Alternative Option</Label>
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
                        .filter((item) => item !== selectedMeal)
                        .map((item) => (
                            <SelectItem key={item} value={item}>
                              {item}
                            </SelectItem>
                        ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                  onClick={handleSaveOrder}
                  className="w-full bg-primary hover:bg-primary-hover text-primary-foreground"
                  disabled={!selectedMeal || (selectedMeal === "Other" && !customMeal) || isSubmitting}
              >
                {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Updating Order...
                    </>
                ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Update Order
                    </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
  );
}
