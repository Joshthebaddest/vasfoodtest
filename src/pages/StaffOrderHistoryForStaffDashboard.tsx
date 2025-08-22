import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { History, CalendarIcon, FileDown, Loader2 } from "lucide-react";
import { useProfile, ProfileResponse } from "@/hooks/useProfile";
import { useToast } from "@/hooks/use-toast";
import { authenticatedFetch } from "@/lib/api";

// PDF generation function using HTML to PDF conversion
const generatePDF = async (orders: any[], dateFrom: Date, dateTo: Date, userName?: string) => {
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "EEEE do 'of' MMMM, yyyy");
  };

  // Create HTML content for PDF
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; padding: 20px; background: white;">
      <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px;">
        <h1 style="color: #333; margin: 0; font-size: 24px;">Order History Report</h1>
        <p style="color: #666; margin: 5px 0;">${userName ? `Staff: ${userName}` : 'Staff Order History'}</p>
        <p style="color: #666; margin: 5px 0;">Period: ${format(dateFrom, "dd/MM/yyyy")} - ${format(dateTo, "dd/MM/yyyy")}</p>
        <p style="color: #666; margin: 5px 0;">Generated on: ${format(new Date(), "dd/MM/yyyy 'at' HH:mm")}</p>
      </div>

      <div style="margin-bottom: 20px;">
        <h3 style="color: #333; margin-bottom: 10px;">Report Summary</h3>
        <p><strong>Total Orders:</strong> ${orders.length}</p>
        <p><strong>Collected Orders:</strong> ${orders.filter(order => order.collected === 1).length}</p>
        <p><strong>Pending Orders:</strong> ${orders.filter(order => order.collected !== 1).length}</p>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <thead>
          <tr>
            <th style="border: 1px solid #ddd; padding: 12px; background-color: #f5f5f5; font-weight: bold; color: #333;">Date</th>
            <th style="border: 1px solid #ddd; padding: 12px; background-color: #f5f5f5; font-weight: bold; color: #333;">Meal</th>
            <th style="border: 1px solid #ddd; padding: 12px; background-color: #f5f5f5; font-weight: bold; color: #333;">Fallback Meal</th>
            <th style="border: 1px solid #ddd; padding: 12px; background-color: #f5f5f5; font-weight: bold; color: #333;">Status</th>
          </tr>
        </thead>
        <tbody>
          ${orders.map((order, index) => `
            <tr style="background-color: ${index % 2 === 0 ? '#ffffff' : '#f9f9f9'};">
              <td style="border: 1px solid #ddd; padding: 12px;">${formatDate(order.ordered_at)}</td>
              <td style="border: 1px solid #ddd; padding: 12px;">${order.meal}</td>
              <td style="border: 1px solid #ddd; padding: 12px;">${order.fallback_meal || "None"}</td>
              <td style="border: 1px solid #ddd; padding: 12px;">
                <span style="background-color: ${order.collected === 1 ? '#dcfce7' : '#f3f4f6'}; color: ${order.collected === 1 ? '#166534' : '#374151'}; padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: bold;">
                  ${order.collected === 1 ? '✓ Collected' : 'Ordered'}
                </span>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div style="margin-top: 30px; text-align: center; color: #666; font-size: 12px; border-top: 1px solid #ddd; padding-top: 15px;">
        <p>This report was generated automatically by the VAS Food System</p>
      </div>
    </div>
  `;

  // Create a hidden iframe for PDF generation
  const iframe = document.createElement('iframe');
  iframe.style.position = 'absolute';
  iframe.style.left = '-9999px';
  iframe.style.width = '210mm';
  iframe.style.height = '297mm';
  
  document.body.appendChild(iframe);
  
  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!iframeDoc) {
    throw new Error('Could not access iframe document');
  }

  iframeDoc.open();
  iframeDoc.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Order History Report</title>
      <style>
        @page {
          size: A4;
          margin: 20mm;
        }
        body {
          margin: 0;
          padding: 0;
          -webkit-print-color-adjust: exact;
          color-adjust: exact;
        }
      </style>
    </head>
    <body>
      ${htmlContent}
    </body>
    </html>
  `);
  iframeDoc.close();

  // Wait a bit for content to load, then print
  setTimeout(() => {
    if (iframe.contentWindow) {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    }
    
    // Clean up after printing
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 1000);
  }, 500);
};

export default function StaffOrderHistoryForStaffDashboard() {
  const defaultFromDate = new Date();
  defaultFromDate.setDate(defaultFromDate.getDate() - 30);

  const navigate = useNavigate();
  const [dateFrom, setDateFrom] = useState<Date>(defaultFromDate);
  const [dateTo, setDateTo] = useState<Date>(new Date());
  const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
  const [isLoadingOrderHistory, setIsLoadingOrderHistory] = useState(true);
  const [orderHistoryError, setOrderHistoryError] = useState(false);
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const LIMIT = 15;
  const observer = useRef<IntersectionObserver>();
  const lastOrderRef = useRef<HTMLTableRowElement>(null);

  const { data: profile, isLoading: isLoadingProfile } = useProfile();
  const userProfile = (profile as ProfileResponse)?.data;
  const userId = userProfile?.id ?? null;

  const { toast } = useToast();

  const baseUrl = import.meta.env.VITE_API_URL;
  const isLocalhost = window.location.hostname === "localhost";
  const API_BASE_URL = isLocalhost
    ? "http://localhost/vasfood/api"
    : `https://${baseUrl}/api`;

  const fromDate = dateFrom ? format(dateFrom, "yyyy-MM-dd") : "";
  const toDate = dateTo ? format(dateTo, "yyyy-MM-dd") : "";

  // Fetch orders function
  const fetchOrders = useCallback(async (page: number, reset: boolean = false) => {
    if (!userId) return;

    if (reset) {
      setIsLoadingOrderHistory(true);
      setIsInitialLoad(true);
    } else {
      setIsFetchingMore(true);
    }

    try {
      const url = `${API_BASE_URL}/order/order-history/${userId}?page=${page}&limit=${LIMIT}&from=${fromDate}&to=${toDate}`;
      const res = await authenticatedFetch(url);
      const data = await res.json();

      if (data.status === "success" && Array.isArray(data.data)) {
        if (reset) {
          setFilteredOrders(data.data);
          setCurrentPage(1);
        } else {
          setFilteredOrders(prev => [...prev, ...data.data]);
        }

        // Check if there are more pages
        setHasMore(data.data.length === LIMIT);
        setOrderHistoryError(false);
      } else {
        if (reset) {
          setFilteredOrders([]);
        }
        if (data.data && data.data.length === 0) {
          setHasMore(false);
        } else {
          setOrderHistoryError(true);
        }
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      if (reset) {
        setFilteredOrders([]);
      }
      setOrderHistoryError(true);
    } finally {
      setIsLoadingOrderHistory(false);
      setIsFetchingMore(false);
      setIsInitialLoad(false);
    }
  }, [userId, API_BASE_URL, fromDate, toDate]);

  // Intersection observer callback
  const lastOrderElementRef = useCallback((node: HTMLTableRowElement) => {
    if (isFetchingMore || isLoadingOrderHistory) return;
    
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isFetchingMore && !isLoadingOrderHistory) {
          setCurrentPage(prev => {
            const nextPage = prev + 1;
            fetchOrders(nextPage, false);
            return nextPage;
          });
        }
      },
      {
        root: null,
        rootMargin: '100px', // Trigger 100px before reaching the element
        threshold: 0.1
      }
    );
    
    if (node) observer.current.observe(node);
  }, [isFetchingMore, isLoadingOrderHistory, hasMore, fetchOrders]);

  // Initial load and date range changes
  useEffect(() => {
    if (userId) {
      setCurrentPage(1);
      setHasMore(true);
      fetchOrders(1, true);
    }
  }, [userId, fromDate, toDate, fetchOrders]);

  // Error handling
  useEffect(() => {
    if (orderHistoryError) {
      toast({
        title: "Failed to load order history",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  }, [orderHistoryError, toast]);

  // Cleanup observer on unmount
  useEffect(() => {
    return () => {
      if (observer.current) observer.current.disconnect();
    };
  }, []);

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "EEEE do 'of' MMMM, yyyy");
  };

  const handleExportPDF = async () => {
    try {
      if (filteredOrders.length === 0) {
        toast({
          title: "No data to export",
          description: "Please select a date range with orders to generate PDF.",
          variant: "destructive",
        });
        return;
      }

      setIsPdfGenerating(true);

      toast({
        title: "Generating PDF",
        description: "Please wait while we prepare your report...",
        variant: "default",
      });

      await generatePDF(filteredOrders, dateFrom, dateTo, userProfile?.name || userProfile?.email);

      toast({
        title: "PDF Ready",
        description: "Your order history PDF has been downloaded.",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsPdfGenerating(false);
    }
  };

  if (isLoadingProfile || isInitialLoad) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your order history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-4-xl mx-auto w-full overflow-x-hidden max-w-full px-4">
      <div className="flex items-center gap-3">
        <History className="h-6 w-6 md:h-8 md:w-8 text-primary" />
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Order History</h1>
          <p className="text-muted-foreground text-sm md:text-base">
            All your past meal orders
          </p>
        </div>
      </div>

      {/* Filter Card */}
      <Card className="w-full max-w-full overflow-x-auto">
        <CardHeader>
          <CardTitle>Filter Orders</CardTitle>
          <CardDescription>Select date range to filter order history</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row gap-4 items-end">
            {/* From Date */}
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
                    {dateFrom ? format(dateFrom, "PPP") : <span>Pick a date</span>}
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

            {/* To Date */}
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

            {/* Export Button */}
            <div className="w-full lg:w-auto">
              <Button 
                onClick={handleExportPDF} 
                variant="outline" 
                className="w-full lg:w-auto"
                disabled={isPdfGenerating}
              >
                {isPdfGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FileDown className="mr-2 h-4 w-4" />
                    Download PDF
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card className="w-full max-w-full overflow-x-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Order History
            {isLoadingOrderHistory && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
          </CardTitle>
          <CardDescription>All orders in the selected date range</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredOrders.length === 0 && !isLoadingOrderHistory ? (
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
                      <TableHead>Date</TableHead>
                      <TableHead>Meal</TableHead>
                      <TableHead>Fallback Meal</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.map((order, idx) => {
                      const isLastItem = idx === filteredOrders.length - 1;
                      
                      return (
                        <TableRow 
                          key={`${order.id}-${idx}`} 
                          ref={isLastItem ? lastOrderElementRef : null}
                        >
                          <TableCell>{formatDate(order.ordered_at)}</TableCell>
                          <TableCell>{order.meal}</TableCell>
                          <TableCell>{order.fallback_meal || "None"}</TableCell>
                          <TableCell>
                            <span className={cn(
                              "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                              order.collected === 1
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            )}>
                              {order.collected === 1 ? "✓ Collected" : "Ordered"}
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Loading indicator for infinite scroll */}
              {isFetchingMore && (
                <div className="flex justify-center items-center py-6">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  <span className="text-muted-foreground">Loading more orders...</span>
                </div>
              )}

              {/* No more data indicator */}
              {!hasMore && filteredOrders.length > 0 && !isFetchingMore && (
                <div className="text-center py-4">
                  <span className="text-muted-foreground text-sm">No more orders to load</span>
                </div>
              )}

              <div className="mt-4 p-4 bg-muted rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total Orders Loaded:</span>
                  <span className="text-lg font-bold text-primary">
                    {filteredOrders.length} orders
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