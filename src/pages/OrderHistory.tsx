import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/StatusBadge";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { History, CalendarIcon, FileDown, Loader2 } from "lucide-react";
import { useProfile, ProfileResponse } from "@/hooks/useProfile";
import { useAdminOrderHistory } from "@/hooks/useAdminOrders";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { authenticatedFetch } from "@/lib/api";

export default function OrderHistory() {
  const defaultFromDate = new Date();
  defaultFromDate.setDate(defaultFromDate.getDate() - 30);

  const navigate = useNavigate();
  const { toast } = useToast();
  const observer = useRef<IntersectionObserver>();

  const [dateFrom, setDateFrom] = useState<Date>(defaultFromDate);
  const [dateTo, setDateTo] = useState<Date>(new Date());
  const [allOrders, setAllOrders] = useState<any[]>([]);
  const [uniqueOrders, setUniqueOrders] = useState<any[]>([]);

  // You can adjust this limit as needed
  const ORDERS_PER_PAGE = 15;
  const { data: profile, isLoading: isLoadingProfile } = useProfile();
  const userProfile = (profile as ProfileResponse)?.data;
  const userId = userProfile?.id ?? null;

  const fromDate = dateFrom ? format(dateFrom, "yyyy-MM-dd") : "";
  const toDate = dateTo ? format(dateTo, "yyyy-MM-dd") : "";

  const {
    data: orderPages,
    isLoading: isLoadingOrderHistory,
    error: orderHistoryError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useAdminOrderHistory(fromDate, toDate, ORDERS_PER_PAGE);

  const baseUrl = import.meta.env.VITE_API_URL;
  const isLocalhost = window.location.hostname === "localhost";
  const API_BASE_URL = isLocalhost
      ? "http://localhost/vasfood/api"
      : `https://${baseUrl}/api`;

  // Last element ref for infinite scrolling
  const lastOrderElementRef = useCallback(
    (node: HTMLTableRowElement) => {
      if (isLoadingOrderHistory) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      });
      if (node) observer.current.observe(node);
    },
    [isLoadingOrderHistory, fetchNextPage, hasNextPage, isFetchingNextPage]
  );

  const handleRowClick = (date: string) => {
    navigate(`/orders/${date}`);
  };

  // Flatten all pages and extract unique orders
  useEffect(() => {
    console.log("orderPages changed:", orderPages);

    if (orderPages?.pages) {
      // Flatten all orders from all pages
      const flattenedOrders = orderPages.pages.reduce((acc, page) => {
        console.log("Processing page:", page);
        if (page?.status === "success" && page?.data) {
          console.log(`Adding ${page.data.length} orders from this page`);
          return [...acc, ...page.data];
        }
        return acc;
      }, []);

      console.log(`Total flattened orders: ${flattenedOrders.length}`);
      setAllOrders(flattenedOrders);

      // Extract unique orders by date
      const seenDates = new Set();
      const uniqueOrdersFiltered = flattenedOrders.filter((order) => {
        const dateOnly = format(new Date(order.ordered_at), "yyyy-MM-dd");
        if (seenDates.has(dateOnly)) {
          return false;
        }
        seenDates.add(dateOnly);
        return true;
      });

      console.log(`Unique orders by date: ${uniqueOrdersFiltered.length}`);
      setUniqueOrders(uniqueOrdersFiltered);
    } else {
      console.log("No orderPages data");
      setAllOrders([]);
      setUniqueOrders([]);
    }
  }, [orderPages]);

  // Refetch when date range changes
  useEffect(() => {
    if (fromDate && toDate) {
      refetch();
    }
  }, [fromDate, toDate, refetch]);

  useEffect(() => {
    if (orderHistoryError) {
      toast({
        title: "Failed to load order history",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  }, [orderHistoryError, toast]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);

    const day = date.getDate();
    const month = date.toLocaleString("en-US", { month: "long" });
    const year = date.getFullYear();
    const weekday = date.toLocaleString("en-US", { weekday: "long" });

    const getOrdinalSuffix = (n: number) => {
      if (n > 3 && n < 21) return "th";
      switch (n % 10) {
        case 1:
          return "st";
        case 2:
          return "nd";
        case 3:
          return "rd";
        default:
          return "th";
      }
    };

    return `${weekday} ${day}${getOrdinalSuffix(day)} of ${month}, ${year}`;
  };

  const handleExportCSV = async () => {
    const from = format(dateFrom, "yyyy-MM-dd");
    const to = format(dateTo, "yyyy-MM-dd");

    const apiUrl = `${API_BASE_URL}/admin/export?from=${from}&to=${to}`;

    try {
      const response = await authenticatedFetch(apiUrl, {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error("Failed to export CSV.");
      }

      const csvText = await response.text();

      const blob = new Blob([csvText], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `deductions_${from}_to_${to}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      window.URL.revokeObjectURL(url);

      toast({
        title: "Export Successful",
        description: `CSV file for ${from} to ${to} has been downloaded.`,
        variant: "neutral",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: (error as Error).message || "Unable to export data.",
        variant: "destructive",
      });
    }
  };

  if (isLoadingProfile) {
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
    <div className="space-y-6 max-4-xl mx-auto w-full overflow-x-hidden max-w-full px-4">
      <div className="flex items-center gap-3">
        <History className="h-6 w-6 md:h-8 md:w-8 text-primary" />
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Order History
          </h1>
          <p className="text-muted-foreground text-sm md:text-base">
            All orders across the organization
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

            <div className="w-full lg:w-auto">
              <Button
                onClick={handleExportCSV}
                variant="outline"
                className="w-full lg:w-auto"
              >
                <FileDown className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Order History Table */}
      <Card className="w-full max-w-full overflow-x-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Order History
            {isLoadingOrderHistory && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
          </CardTitle>
          <CardDescription>
            All orders in the selected date range
          </CardDescription>
        </CardHeader>
        <CardContent>
          {uniqueOrders.length === 0 && !isLoadingOrderHistory ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No orders found</p>
              <p className="text-sm text-muted-foreground">
                Orders in the selected date range will appear here
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[20%]">Date</TableHead>
                      <TableHead className="w-[10%]">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {uniqueOrders.map((order, index) => {
                      const orderDate = format(
                        new Date(order.ordered_at),
                        "yyyy-MM-dd"
                      );
                      const isLast = index === uniqueOrders.length - 1;

                      return (
                        <TableRow
                          key={`${order.id}-${index}`}
                          ref={isLast ? lastOrderElementRef : null}
                          onClick={() => handleRowClick(orderDate)}
                          className="cursor-pointer hover:bg-muted transition-colors"
                        >
                          <TableCell>{formatDate(order.ordered_at)}</TableCell>
                          <TableCell>
                            <span className="inline-block px-3 py-1 border border-red-500 text-red-500 rounded-md bg-white hover:bg-red-500 hover:text-white transition-colors text-sm cursor-pointer">
                              view
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Loading indicator for infinite scroll */}
              {isFetchingNextPage && (
                <div className="flex justify-center items-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  <span className="text-muted-foreground">
                    Loading more orders...
                  </span>
                </div>
              )}

              {/* No more data indicator */}
              {!hasNextPage && uniqueOrders.length > 0 && (
                <div className="text-center py-4">
                  <span className="text-muted-foreground text-sm">
                    No more orders to load
                  </span>
                </div>
              )}

              <div className="mt-4 p-4 bg-muted rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total Orders:</span>
                  <span className="text-lg font-bold text-primary">
                    {uniqueOrders.length} orders
                  </span>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
