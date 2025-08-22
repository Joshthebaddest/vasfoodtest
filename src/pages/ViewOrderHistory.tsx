import { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { format, parseISO, isWithinInterval } from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CalendarIcon, ArrowLeft, FileDown } from "lucide-react";
import { authenticatedFetch } from "@/lib/api";

interface OrderData {
  id: number;
  user_id: number;
  meal: string;
  fallback_meal: string;
  collected: number;
  ordered_at: string;
  updated_at: string;
  created_at: string;
  full_name: string;
  department: string;
}

export default function ViewOrderHistory() {
  const { userId } = useParams();
  const navigate = useNavigate();

  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [staffInfo, setStaffInfo] = useState({
    name: "Unknown Staff",
    department: "unknown department",
  });
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();

  const isLocalhost = window.location.hostname === "localhost";
  const baseUrl = import.meta.env.VITE_API_URL;
  const API_BASE_URL = isLocalhost
    ? "http://localhost/vasfood/api"
    : `https://${baseUrl}/api`;

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);

        const res = await authenticatedFetch(
          `${API_BASE_URL}/order/order-history/${userId}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (!res.ok) throw new Error(`Failed to fetch orders: ${res.status}`);
        const result = await res.json();
        const ordersData = result.data || [];

        setOrders(ordersData);

        if (ordersData.length > 0) {
          setStaffInfo({
            name: ordersData[0].full_name || "Unknown Staff",
            department:
              ordersData[0].department?.trim() || "unknown department",
          });
        }
      } catch (err) {
        console.error("Error fetching order history:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [userId]);

  // Filter orders
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const orderDate = parseISO(order.ordered_at);
      if (!dateFrom && !dateTo) return true;
      if (dateFrom && !dateTo) return orderDate >= dateFrom;
      if (!dateFrom && dateTo) return orderDate <= dateTo;
      return isWithinInterval(orderDate, { start: dateFrom!, end: dateTo! });
    });
  }, [orders, dateFrom, dateTo]);

  // Calculate total amount: ₦500 per order
  const totalCollectedOrders = filteredOrders.filter(
    (order) => order.collected === 1
  );
  const totalAmount = totalCollectedOrders.length * 500;

  return (
    <div className="p-6 space-y-6">
      {/* Back Button */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          onClick={() => navigate("/hr/staff-order-history")}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Staff Order History
        </Button>
      </div>

      {/* Page Title */}
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <CalendarIcon className="h-7 w-7 text-primary" />
          Order History
        </h1>
        <div className="text-muted-foreground text-lg mt-2">
          <p>
            View order history for:{" "}
            <strong className="text-foreground">{staffInfo.name}</strong>
          </p>
          <p>
            Department:{" "}
            <strong className="text-foreground">{staffInfo.department}</strong>
          </p>
        </div>
      </div>

      {/* Date Range Filter */}
      <Card className="w-full max-w-full overflow-x-auto">
        <CardHeader>
          <CardTitle>Filter Orders</CardTitle>
          <CardDescription>
            Select date range to filter order history
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row gap-4 items-end">
            <div className="space-y-2 w-full lg:w-auto">
              <label className="text-sm font-medium">From Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full lg:w-[180px] justify-start text-left font-normal",
                      !dateFrom && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFrom ? (
                      format(dateFrom, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateFrom}
                    onSelect={setDateFrom}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2 w-full lg:w-auto">
              <label className="text-sm font-medium">To Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full lg:w-[180px] justify-start text-left font-normal",
                      !dateTo && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateTo ? format(dateTo, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateTo}
                    onSelect={setDateTo}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Deduction Report */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600 text-xl font-semibold">
            <span>₦</span> Deduction Report
          </CardTitle>
          <CardDescription>
            Orders to be deducted from staff account:{" "}
            <strong>{staffInfo.name}</strong> ({staffInfo.department})
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading orders...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                No orders found for the selected date range.
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Meal</TableHead>
                    <TableHead>Fallback Meal</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        {format(new Date(order.ordered_at), "EEE, MMM d, yyyy")}
                      </TableCell>
                      <TableCell>{order.meal}</TableCell>
                      <TableCell>{order.fallback_meal || "None"}</TableCell>
                      <TableCell>
                        {order.collected === 1 ? (
                          <span className="bg-green-100 text-green-700 text-sm px-2 py-1 rounded-full">
                            ✓ Collected
                          </span>
                        ) : (
                          <span className="bg-gray-100 text-gray-700 text-sm px-2 py-1 rounded-full">
                            Ordered
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Total */}
              <div className="bg-muted text-lg mt-4 p-4 rounded-lg flex justify-between font-semibold text-red-600">
                <span>
                  Total Amount to be Deducted ({totalCollectedOrders.length}{" "}
                  orders × ₦500):
                </span>
                <span>₦{totalAmount.toLocaleString()}</span>
              </div>
              <div className="text-sm text-gray-500 mt-1">
                Please note: The total amount only includes orders staff has
                collected. Any orders not collected are not counted towards the
                deduction.
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
