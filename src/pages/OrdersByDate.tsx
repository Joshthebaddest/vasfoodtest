import React, { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authenticatedFetch } from "@/lib/api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const OrdersByDate: React.FC = () => {
  const { date } = useParams<{ date: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const isLocalhost = window.location.hostname === "localhost";
  const baseUrl = import.meta.env.VITE_API_URL;
  const API_BASE_URL = isLocalhost
      ? "http://localhost/vasfood/api"
      : `https://${baseUrl}/api`;

  const formatDate = (dateString: string) => {
    const parsedDate = new Date(dateString);
    if (isNaN(parsedDate.getTime())) return dateString;

    const day = parsedDate.getDate();
    const month = parsedDate.toLocaleString("en-US", { month: "long" });
    const year = parsedDate.getFullYear();

    const getDaySuffix = (d: number) => {
      if (d > 3 && d < 21) return "th"; // handles 11th–13th
      switch (d % 10) {
        case 1: return "st";
        case 2: return "nd";
        case 3: return "rd";
        default: return "th";
      }
    };

    return `${day}${getDaySuffix(day)} of ${month}, ${year}`;
  };


  useEffect(() => {
    // Try to get data from location.state first
    if (location.state?.orderDetails) {
      setOrders(location.state.orderDetails);
      setLoading(false);
      return;
    }

    // If not available, fetch from API
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const res = await authenticatedFetch(`${API_BASE_URL}/admin/by-date?date=${date}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ date }),
        });

        const result = await res.json();

        if (result.status === "success") {
          setOrders(result.data);
        } else {
          throw new Error(result.message || "Failed to load orders");
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load orders");
      } finally {
        setLoading(false);
      }
    };

    if (date) fetchOrders();
  }, [date, location.state]);

  const filteredOrders = orders;

  return (
      <div className="p-4 md:p-6 space-y-6">
        {/* Back button */}
        <div className="flex items-center gap-3">
          <Button
              variant="ghost"
              onClick={() => navigate("/history")}
              className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Order History
          </Button>
        </div>

        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">
            Orders for {formatDate(date || "")}
          </h1>
          <p className="text-muted-foreground">
            View all orders placed on {formatDate(date || "")}
          </p>
        </div>

        {/* Orders Table */}
        <Card>
          <CardHeader>
            <CardTitle>Orders</CardTitle>
            <CardDescription>
              List of all staff orders for {formatDate(date || "")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground px-4 py-6">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500"></div>
                  Loading orders...
                </div>            ) : error ? (
                <p className="text-red-500">{error}</p>
            ) : filteredOrders.length === 0 ? (
                <p className="text-gray-500">
                  No collected orders found for this date.
                </p>
            ) : (
                <div className="w-full overflow-x-auto rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b">
                        <TableHead>Staff Name</TableHead>
                        <TableHead>Meal</TableHead>
                        <TableHead>Fallback Meal</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredOrders.map((order, index) => (
                          <TableRow key={index} className="border-b">
                            <TableCell>{order.full_name}</TableCell>
                            <TableCell>{order.meal || "N/A"}</TableCell>
                            <TableCell>{order.fallback_meal || "N/A"}</TableCell>
                            <TableCell>
                               {order.collected === 1 ? (
                             <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium">
                                <span className="hidden md:inline">✓ </span>
                                Collected
                              </span>
                            ) : (
                              <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full font-medium">
                                Ordered
                              </span>
                          )}
                            </TableCell>

                          </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
            )}
          </CardContent>
        </Card>
      </div>
  );
};

export default OrdersByDate;
