import {useEffect, useState} from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, User, Save, Loader2 } from "lucide-react";
import { adminPlaceOrder, authenticatedFetch, getApiBaseUrl } from "@/lib/api";

interface Staff {
  id: number;
  full_name: string;
  department: string | null;
  meal: string;
  fallback_meal: string;
}

export default function NewOrder() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  const staff = location.state?.staff as Staff;
  console.log("staff:", staff);


  const [selectedMeal, setSelectedMeal] = useState("");
  const [fallbackMeal, setFallbackMeal] = useState("");
  const [customMeal, setCustomMeal] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [menuItems, setMenuItems] = useState<string[]>([]);
  const [isMenuLoading, setIsMenuLoading] = useState(true);

  if (!staff) {
    navigate("/hr/staff-list");
    return null;
  }

  const API_BASE_URL = `${getApiBaseUrl()}/api/menu`;

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



  const handleSaveOrder = async () => {
    const mealName = selectedMeal === "Other" ? customMeal : selectedMeal;
    const test = staff.meal;
    
    if (!mealName) {
      toast({
        title: "Please select a meal",
        description: "You need to choose a meal before saving the order.",
        variant: "destructive",
      });
      return;
    }
    setIsSubmitting(true);

      // Debug: Log the staff object to see what we're working with
    // console.log('NewOrder - staff object:', staff);
    // console.log('NewOrder - staff.id:', staff.id);
    // console.log('NewOrder - staff.id type:', typeof staff.id);


      try {
      const orderData = {
        meal: mealName,
        fallback_meal: fallbackMeal || "None"
      };

      await adminPlaceOrder(staff.id.toString(), orderData);

      toast({
        title: "Order created successfully! 🍽️",
        description: `Order for ${staff.full_name} has been added to today's orders.`,
      });

    navigate("/hr", { state: { refetch: true } });
    } catch (error) {
      console.error('Error placing order:', error);
      toast({
        title: "Failed to create order",
        description: error instanceof Error ? error.message : "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          onClick={() => navigate("/hr/staff-list")}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Staff List
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <User className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold text-foreground">Create Order</h1>
          <p className="text-muted-foreground">Creating order for {staff.full_name}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Staff Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Staff Information
            </CardTitle>
            <CardDescription>Details for the selected staff member</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">Full Name</Label>
              <Input value={staff.full_name} disabled className="font-medium" />
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">Department</Label>
              <Input value={staff.department || "Not assigned"} disabled />

            </div>

            {/*<div className="space-y-2">*/}
            {/*   <Label className="text-sm font-medium text-muted-foreground">Staff ID</Label>*/}
            {/*   <Input value={staff.id.toString()} disabled />*/}
            {/* </div>*/}

            <div className="pt-4 border-t">
              {/*<div className="flex items-center gap-2 text-sm text-muted-foreground">*/}
              {/*  <div className="w-2 h-2 bg-green-500 rounded-full"></div>*/}
              {/*  <span>Active staff member</span>*/}
              {/*</div>*/}
            </div>
          </CardContent>
        </Card>

        {/* Order Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Save className="h-5 w-5 text-primary" />
              Order Details
            </CardTitle>
            <CardDescription>Select meal options for this staff member</CardDescription>
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
              onClick={handleSaveOrder}
              className="w-full bg-primary hover:bg-primary-hover text-primary-foreground"
              disabled={!selectedMeal || (selectedMeal === "Other" && !customMeal) || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating Order...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Order
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}