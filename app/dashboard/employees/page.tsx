"use client";

import { useState } from "react";
import { useEmployeeStore } from "@/lib/stores/employee-store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmployeeForm } from "@/components/employees/employee-form";
import { Trash2, Edit2, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function EmployeesPage() {
  // ✅ safer store usage
  const employees = useEmployeeStore((state) => state.employees);
  const deleteEmployee = useEmployeeStore((state) => state.deleteEmployee);

  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const editingEmployee = editingId
    ? employees.find((e) => e.id === editingId)
    : undefined;

  const deletingEmployee = deleteId
    ? employees.find((e) => e.id === deleteId)
    : undefined;

  const handleDelete = (id: string) => {
    deleteEmployee(id);
    toast.success("Employee removed successfully");
    setIsDeleteOpen(false);
    setDeleteId(null);
  };

  const handleSuccess = () => {
    setIsOpen(false);
    setEditingId(null);
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Employees</h1>
          <p className="mt-1 text-sm sm:text-base text-foreground/60">
            Manage your global team members
          </p>
        </div>

        {/* Add/Edit Dialog */}
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button
              className="gap-2 w-full sm:w-auto"
              onClick={() => setEditingId(null)}
            >
              <Plus className="h-4 w-4" />
              Add Employee
            </Button>
          </DialogTrigger>

          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingId ? "Edit Employee" : "Add New Employee"}
              </DialogTitle>
              <DialogDescription>
                {editingId
                  ? "Update employee information"
                  : "Add a new team member"}
              </DialogDescription>
            </DialogHeader>

            <EmployeeForm
              employee={editingEmployee}
              onSuccess={handleSuccess}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Table */}
      {employees.length === 0 ? (
        <Card className="p-6 sm:p-8 text-center">
          <p className="text-sm sm:text-base text-foreground/60">
            No employees yet. Add one to get started.
          </p>
        </Card>
      ) : (
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <table className="w-full text-sm sm:text-base">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">Name</th>
                <th className="text-left py-3 px-4 hidden sm:table-cell">
                  Email
                </th>
                <th className="text-left py-3 px-4 hidden md:table-cell">
                  Country
                </th>
                <th className="text-left py-3 px-4 hidden lg:table-cell">
                  Salary
                </th>
                <th className="text-left py-3 px-4">Status</th>
                <th className="text-right py-3 px-4">Actions</th>
              </tr>
            </thead>

            <tbody>
              {employees.map((employee) => (
                <tr
                  key={employee.id}
                  className="border-b hover:bg-background/50"
                >
                  <td className="py-3 px-4 font-medium">{employee.name}</td>

                  <td className="py-3 px-4 hidden sm:table-cell text-sm">
                    {employee.email}
                  </td>

                  <td className="py-3 px-4 hidden md:table-cell text-sm">
                    {employee.country}
                  </td>

                  <td className="py-3 px-4 hidden lg:table-cell text-sm">
                    {employee.salary} {employee.currency}
                  </td>

                  <td className="py-3 px-4">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                        employee.status === "active"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {employee.status.charAt(0).toUpperCase() +
                        employee.status.slice(1)}
                    </span>
                  </td>

                  <td className="py-3 px-4">
                    <div className="flex justify-end gap-2">
                      {/* Edit */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => {
                          setEditingId(employee.id);
                          setIsOpen(true);
                        }}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>

                      {/* Delete */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => {
                          setDeleteId(employee.id);
                          setIsDeleteOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ✅ Global Delete Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Employee</DialogTitle>
            <DialogDescription>
              {deletingEmployee
                ? `Are you sure you want to remove ${deletingEmployee.name}? This action cannot be undone.`
                : "Are you sure you want to delete this employee?"}
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Cancel
            </Button>

            <Button
              variant="destructive"
              onClick={() => {
                if (deleteId) handleDelete(deleteId);
              }}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
