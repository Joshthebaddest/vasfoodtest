import { useState } from "react";
import { Dialog, DialogDescription, DialogHeader, DialogTitle, DialogPortal, DialogOverlay } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import vasLogo from "@/assets/vasLogo.png";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";

const departments = [
  "Technical",
  "Vas & Infrastructure", 
  "Project Management",
  "Business",
  "Internal Audit & Control",
  "Account & Finance",
  "HR & Admin",
  "Compliance",
  "ED's P.A",
  "Intern"
];

interface DepartmentSelectionProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (department: string) => void;
  displayName: string;
  isLoading?: boolean;
}

export default function DepartmentSelection({ isOpen, onClose, onConfirm, displayName, isLoading = false }: DepartmentSelectionProps) {
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const { toast } = useToast();

  const handleContinue = () => {
    if (!selectedDepartment) {
      toast({
        title: "Please select a department",
        description: "You must select your department to continue.",
        variant: "destructive",
      });
      return;
    }
    setShowPreview(true);
  };

  const handleConfirm = () => {
    onConfirm(selectedDepartment);
    setShowPreview(false);
    setSelectedDepartment("");
  };

  const handleBack = () => {
    setShowPreview(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogPortal>
        <DialogOverlay />
        <DialogPrimitive.Content
          className={cn(
            "fixed left-[50%] top-[50%] z-50 grid w-[95%] max-w-md translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] rounded-xl",
            "mx-auto"
          )}
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <div className="flex items-center gap-2 mb-2">
              <img src={vasLogo} alt="VasFood Logo" className="h-8 w-auto" />
              <DialogTitle className="text-xl font-bold text-gray-900">
                Welcome to VasFood!
              </DialogTitle>
            </div>
            <DialogDescription className="text-gray-600">
              Please select your department to complete your profile setup.
            </DialogDescription>
          </DialogHeader>

        {!showPreview ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Select your department
              </label>
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose your department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

                         <div className="flex justify-end space-x-2 pt-4">
               <Button
                 onClick={handleContinue}
                 disabled={!selectedDepartment}
                 className="bg-red-900 hover:bg-red-800 rounded-lg"
               >
                 Continue
               </Button>
             </div>
          </div>
        ) : (
          <div className="space-y-4">
                         <div className="bg-gray-50 p-4 rounded-xl">
               <h3 className="font-semibold text-gray-900 mb-2">Please confirm your details:</h3>
              <div className="space-y-2 text-sm">
                <p><span className="font-medium">Name:</span> {displayName}</p>
                <p><span className="font-medium">Department:</span> {selectedDepartment}</p>
              </div>
              <p className="text-xs text-gray-600 mt-3">
                This is to confirm you are <span className="font-semibold">{displayName}</span> and you belong to <span className="font-semibold">{selectedDepartment}</span> department.
              </p>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
               <Button
                 variant="outline"
                 onClick={handleBack}
                 className="border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg"
               >
                 Back
               </Button>
               <Button
                 onClick={handleConfirm}
                 className="bg-red-900 hover:bg-red-800 rounded-lg"
                 disabled={isLoading}
               >
                 {isLoading ? (
                   <>
                     <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                     Updating...
                   </>
                 ) : (
                   "Confirm"
                 )}
               </Button>
             </div>
          </div>
        )}
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
} 