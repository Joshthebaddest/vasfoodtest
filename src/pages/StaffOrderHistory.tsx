import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Eye, Users } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { authenticatedFetch } from "@/lib/api";

interface DeductionData {
  user_id: number;
  full_name: string;
  collected_orders: number;
  amount: number;
}

export default function StaffOrderHistory() {
  const [searchName, setSearchName] = useState("");
  const [deductionData, setDeductionData] = useState<DeductionData[]>([]);
  const [filteredData, setFilteredData] = useState<DeductionData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Date state - default to last 30 days
  const defaultFromDate = new Date();
  defaultFromDate.setDate(defaultFromDate.getDate() - 30);

  const [dateFrom, setDateFrom] = useState<Date>(defaultFromDate);
  const [dateTo, setDateTo] = useState<Date>(new Date());

  const isLocalhost = window.location.hostname === "localhost";
  const baseUrl = import.meta.env.VITE_API_URL;
  const API_BASE_URL = isLocalhost
    ? "http://localhost/vasfood/api"
    : `https://${baseUrl}/api`;

  const fetchDeductionData = async () => {
    setIsLoading(true);

    try {
      const fromDate = format(dateFrom, "yyyy-MM-dd");
      const toDate = format(dateTo, "yyyy-MM-dd");

      const response = await authenticatedFetch(
        `${API_BASE_URL}/admin/deductions?from=${fromDate}&to=${toDate}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch deduction data.");
      }

      const data = await response.json();
      setDeductionData(data.data || []);
      setFilteredData(data.data || []);
    } catch (error) {
      console.error("Error fetching deduction data:", error);
      setDeductionData([]);
      setFilteredData([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDeductionData();
  }, [dateFrom, dateTo]);

  const handleFilter = () => {
    const filtered = deductionData.filter((item) =>
      item.full_name.toLowerCase().includes(searchName.trim().toLowerCase())
    );
    setFilteredData(filtered);
  };

  const totalAmount = filteredData.reduce((sum, item) => sum + item.amount, 0);
  const totalOrders = filteredData.reduce(
    (sum, item) => sum + item.collected_orders,
    0
  );

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
          <Users className="h-8 w-8 text-primary" />
          Staff Deduction Report
        </h1>
        <p className="text-muted-foreground text-base md:text-lg">
          View meal deductions for all staff members
        </p>
      </div>

      {/* Search and Date Filter Card */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Deductions</CardTitle>
          <CardDescription>
            Search by staff name and select date range
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            {/* Staff Name Search */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Staff Name</label>
              <Input
                placeholder="Enter staff name..."
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                className="w-full"
              />
            </div>

            {/* From Date */}
            <div className="space-y-2">
              <label className="text-sm font-medium">From Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateFrom && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFrom ? format(dateFrom, "dd/MM/yyyy") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateFrom}
                    onSelect={setDateFrom}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* To Date */}
            <div className="space-y-2">
              <label className="text-sm font-medium">To Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateTo && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateTo ? format(dateTo, "dd/MM/yyyy") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateTo}
                    onSelect={setDateTo}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Filter Button */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-transparent">
                Filter
              </label>
              <Button
                className="w-full bg-red-500 hover:bg-red-600 text-white"
                onClick={handleFilter}
                disabled={isLoading}
              >
                {isLoading ? "Loading..." : "Filter Results"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Staff
                </p>
                <p className="text-2xl font-bold">{filteredData.length}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Deductions
                </p>
                <p className="text-2xl font-bold text-red-600">
                  ₦{totalAmount.toLocaleString()}
                </p>
              </div>
              <div className="h-8 w-8 bg-emerald-100 rounded-full flex items-center justify-center">
                <span className="text-emerald-600 font-bold">₦</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Deduction Report */}
      <Card>
        <CardHeader>
          <CardTitle>
            <span className="flex items-center gap-2 text-red-600 text-xl font-semibold">
              <span>₦</span> Deduction Report
            </span>
          </CardTitle>
          <CardDescription>
            Staff members with collected orders to be deducted
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading deduction data...</p>
            </div>
          ) : (
            <div className="w-full overflow-x-auto rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow className="border-b">
                    <TableHead>Staff Name</TableHead>
                    {/* <TableHead>Orders Collected</TableHead> */}
                    <TableHead>Amount (₦) last 30 days</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.length > 0 ? (
                    filteredData.map((item) => (
                      <TableRow
                        key={item.user_id}
                        className="border-b cursor-pointer hover:bg-muted/50"
                        onClick={() => navigate(`/view/${item.user_id}`)}
                      >
                        <TableCell className="font-medium">
                          {item.full_name}
                        </TableCell>
                        {/* <TableCell className="text-center">{item.collected_orders}</TableCell> */}
                        <TableCell className="whitespace-nowrap font-semibold text-red-600">
                          ₦{item.amount.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Link
                            to={`/view/${item.user_id}`}
                            state={{
                              full_name: item.full_name,
                              user_id: item.user_id,
                            }}
                          >
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-sm whitespace-nowrap"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Eye className="w-4 h-4 mr-1" /> View Details
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-center py-8 text-muted-foreground"
                      >
                        {isLoading
                          ? "Loading..."
                          : "No deduction data found for the selected period."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
