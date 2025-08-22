import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Users, ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { getStaffList } from "@/lib/api";

interface Staff {
  id: number;
  full_name: string;
  department: string | null;
  meal: string;
  fallback_meal: string;
}

interface ApiResponse {
  data: Staff[];
}

// API function to fetch staff data
const fetchStaffList = async (): Promise<Staff[]> => {
  console.log('Fetching staff list...'); // Debug log
  
  try {
    const result = await getStaffList();
    return result.data;
  } catch (error) {
    console.error('Error fetching staff list:', error);
    throw error;
  }
};

export default function StaffList() {
  const navigate = useNavigate();
  const { toast } = useToast();

  // State for search input
  const [searchName, setSearchName] = useState("");

  // Fetch staff data using React Query
  const { data: staffList, isLoading, error, refetch } = useQuery({
    queryKey: ['staffList'],
    queryFn: fetchStaffList,
    staleTime: 60 * 60 * 1000, // 1 hour
    retry: 2,
  });

  // Filter staff list by searchName (case-insensitive)
  const filteredStaffList = useMemo(() => {
    if (!staffList) return [];
    return staffList.filter((staff) =>
      staff.full_name.toLowerCase().includes(searchName.trim().toLowerCase())
    );
  }, [staffList, searchName]);

  const handleCreateOrder = (staff: Staff) => {
    navigate(`/hr/new-order/${staff.id}`, {
      state: { staff }
    });
  };

  const handleRetry = () => {
    refetch();
  };

  if (isLoading) {
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
          <Users className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Staff List</h1>
            <p className="text-muted-foreground">Select a staff member to create an order</p>
          </div>
        </div>

        {/* Loading State */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-3">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="text-muted-foreground">Loading staff list...</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
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
          <Users className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Staff List</h1>
            <p className="text-muted-foreground">Select a staff member to create an order</p>
          </div>
        </div>

        {/* Error State */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Failed to load staff list</h3>
                <p className="text-muted-foreground mb-4">
                  {error instanceof Error ? error.message : 'An unexpected error occurred'}
                </p>
                <Button onClick={handleRetry} className="bg-primary hover:bg-primary-hover">
                  Try Again
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
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
        <Users className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold text-foreground">Staff List</h1>
          <p className="text-muted-foreground">Select a staff member to create an order</p>
        </div>
      </div>

      {/* Search Card */}
      <Card>
        <CardHeader>
          <CardTitle>Search Staff</CardTitle>
          <CardDescription>Search by staff name</CardDescription>
        </CardHeader>
        <CardContent>
          <input
            type="text"
            placeholder="Enter staff name..."
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </CardContent>
      </Card>

      {/* Staff List Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Staff Members ({filteredStaffList.length})</CardTitle>
          <CardDescription>
            Click the plus button to create an order for any staff member
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredStaffList.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Staff Name</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
            <TableBody>
  {filteredStaffList.map((staff, index) => (
    <TableRow
      key={`${staff.full_name}-${index}`}
      className="cursor-pointer hover:bg-muted"
      onClick={() => handleCreateOrder(staff)}
    >
      <TableCell className="font-medium">{staff.full_name}</TableCell>
      <TableCell>
        {staff.department || (
          <span className="text-muted-foreground italic">Not assigned</span>
        )}
      </TableCell>
     <TableCell>
  <Button
  size="sm"
  onClick={(e) => {
    e.stopPropagation();
    handleCreateOrder(staff);
  }}
  className="px-4 py-2 border border-red-500 text-red-500 rounded-md bg-white hover:bg-red-500 hover:text-white transition-colors font-medium"
>
    create order
</Button>

</TableCell>

    </TableRow>
  ))}
</TableBody>


            </Table>
          ) : (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No staff members found</h3>
              <p className="text-muted-foreground">Try adjusting your search criteria.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
