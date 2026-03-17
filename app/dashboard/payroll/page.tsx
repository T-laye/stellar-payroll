"use client";

import { useState } from "react";
import { usePayrollStore } from "@/lib/stores/payroll-store";
import { useEmployeeStore } from "@/lib/stores/employee-store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PayrollForm } from "@/components/payroll/payroll-form";
import { Trash2, Edit2, Plus, Send } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function PayrollPage() {
  const groups = usePayrollStore((state) => state.getGroups());
  const deleteGroup = usePayrollStore((state) => state.deleteGroup);
  const addPayment = usePayrollStore((state) => state.addPayment);
  const updateGroup = usePayrollStore((state) => state.updateGroup);
  const employees = useEmployeeStore((state) => state.getEmployees());

  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const editingGroup = editingId
    ? groups.find((g) => g.id === editingId)
    : undefined;

  const handleDelete = (id: string) => {
    deleteGroup(id);
    toast.success("Payroll group removed successfully");
    setIsDeleteOpen(false);
  };

  const handleProcessPayroll = async (groupId: string) => {
    setIsProcessing(true);
    try {
      const group = groups.find((g) => g.id === groupId);
      if (!group) return;

      // Simulate processing payments
      await new Promise((resolve) => setTimeout(resolve, 1000));

      group.employees.forEach((empId) => {
        const employee = employees.find((e) => e.id === empId);
        if (employee) {
          addPayment({
            groupId,
            employeeId: empId,
            amount: employee.salary,
            currency: employee.currency,
            status: "pending",
          });
        }
      });

      updateGroup(groupId, { status: "approved" });
      toast.success(`Processing ${group.employees.length} payments...`);
      setIsOpen(false);
      setEditingId(null);
    } catch (error) {
      toast.error("Failed to process payroll");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSuccess = () => {
    setIsOpen(false);
    setEditingId(null);
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Payroll Groups
          </h1>
          <p className="mt-1 sm:mt-2 text-sm sm:text-base text-foreground/60">
            Manage your payment schedules
          </p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button
              className="gap-2 w-full sm:w-auto"
              onClick={() => setEditingId(null)}
            >
              <Plus className="h-4 w-4" />
              Create Group
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingId ? "Edit Payroll Group" : "Create New Payroll Group"}
              </DialogTitle>
              <DialogDescription>
                {editingId
                  ? "Update payroll group details"
                  : "Create a new payroll group to manage recurring payments"}
              </DialogDescription>
            </DialogHeader>
            <PayrollForm group={editingGroup} onSuccess={handleSuccess} />
          </DialogContent>
        </Dialog>
      </div>

      {groups.length === 0 ? (
        <Card className="p-8 sm:p-12 text-center">
          <p className="text-sm sm:text-base text-foreground/60">
            No payroll groups yet. Create one to start managing payments.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:gap-6">
          {groups.map((group) => (
            <Card key={group.id} className="p-4 sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-3 flex-1 min-w-0">
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-foreground wrap-break-words">
                      {group.name}
                    </h3>
                    {group.description && (
                      <p className="text-xs sm:text-sm text-foreground/60 mt-1">
                        {group.description}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
                    <div>
                      <p className="text-xs text-foreground/60">Employees</p>
                      <p className="text-lg sm:text-xl font-bold text-foreground">
                        {group.employees.length}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-foreground/60">Total Cost</p>
                      <p className="text-lg sm:text-xl font-bold text-foreground wrap-break-words">
                        {group.totalAmount} {group.currency}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-foreground/60">Frequency</p>
                      <p className="text-lg sm:text-xl font-bold text-foreground capitalize">
                        {group.frequency}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-foreground/60">Status</p>
                      <p className="text-lg sm:text-xl font-bold text-foreground capitalize">
                        {group.status}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs sm:text-sm font-medium text-foreground">
                      Employees:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {group.employees.map((empId) => {
                        const emp = employees.find((e) => e.id === empId);
                        return emp ? (
                          <span
                            key={empId}
                            className="inline-block rounded-full bg-primary/10 px-2 sm:px-3 py-1 text-xs text-primary"
                          >
                            {emp.name}
                          </span>
                        ) : null;
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 w-full sm:w-auto sm:min-w-30">
                  <Button
                    className="gap-2 text-xs sm:text-sm"
                    size="sm"
                    onClick={() => handleProcessPayroll(group.id)}
                    disabled={isProcessing}
                  >
                    <Send className="h-4 w-4" />
                    <span className="hidden sm:inline">Process</span>
                    <span className="sm:hidden">Send</span>
                  </Button>
                  <Dialog
                    open={isOpen && editingId === group.id}
                    onOpenChange={setIsOpen}
                  >
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 text-xs sm:text-sm"
                        onClick={() => setEditingId(group.id)}
                      >
                        <Edit2 className="h-4 w-4" />
                        <span className="hidden sm:inline">Edit</span>
                      </Button>
                    </DialogTrigger>
                    {editingId === group.id && (
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit Payroll Group</DialogTitle>
                          <DialogDescription>
                            Update payroll group details
                          </DialogDescription>
                        </DialogHeader>
                        <PayrollForm
                          group={editingGroup}
                          onSuccess={handleSuccess}
                        />
                      </DialogContent>
                    )}
                  </Dialog>
                  <Dialog
                    open={isDeleteOpen && deleteId === group.id}
                    onOpenChange={setIsDeleteOpen}
                  >
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 text-destructive hover:text-destructive text-xs sm:text-sm"
                        onClick={() => setDeleteId(group.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="hidden sm:inline">Delete</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Delete Payroll Group</DialogTitle>
                        <DialogDescription>
                          Are you sure you want to remove {group.name}? This
                          action cannot be undone.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="flex gap-3 justify-end">
                        <Button
                          variant="outline"
                          onClick={() => setIsDeleteOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => handleDelete(group.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
