'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PayrollGroupSchema, type PayrollGroupFormData } from '@/lib/schemas';
import { usePayrollStore, type PayrollGroup } from '@/lib/stores/payroll-store';
import { useEmployeeStore } from '@/lib/stores/employee-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';

interface PayrollFormProps {
  group?: PayrollGroup;
  onSuccess?: () => void;
}

export function PayrollForm({ group, onSuccess }: PayrollFormProps) {
  const employees = useEmployeeStore((state) => state.getEmployees());
  const addGroup = usePayrollStore((state) => state.addGroup);
  const updateGroup = usePayrollStore((state) => state.updateGroup);

  const [selectedEmployees, setSelectedEmployees] = useState<string[]>(
    group?.employees || []
  );

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<PayrollGroupFormData>({
    resolver: zodResolver(PayrollGroupSchema),
    defaultValues: {
      name: group?.name || '',
      description: group?.description || '',
      frequency: group?.frequency || 'monthly',
      currency: group?.currency || 'USD',
      dueDate: group?.dueDate
        ? new Date(group.dueDate).toISOString().split('T')[0]
        : '',
      employees: group?.employees || [],
    },
  });

  // ✅ Sync employees with form
  const handleEmployeeToggle = (empId: string) => {
    setSelectedEmployees((prev) => {
      const updated = prev.includes(empId)
        ? prev.filter((id) => id !== empId)
        : [...prev, empId];

      // ✅ update RHF immediately
      setValue('employees', updated, {
        shouldValidate: true,
        shouldDirty: true,
      });
      return updated;
    });
  };

  const onSubmit = async (data: PayrollGroupFormData) => {
    if (selectedEmployees.length === 0) {
      toast.error('Please select at least one employee');
      return;
    }

    try {
      const totalAmount = selectedEmployees.reduce((sum, empId) => {
        const emp = employees.find((e) => e.id === empId);
        return sum + (emp?.salary || 0);
      }, 0);

      if (group) {
        updateGroup(group.id, {
          ...data,
          employees: selectedEmployees,
          totalAmount,
        });
        toast.success('Payroll group updated successfully!');
      } else {
        addGroup({
          name: data.name,
          description: data.description || '',
          frequency: data.frequency,
          employees: selectedEmployees,
          dueDate: data.dueDate,
          status: 'draft',
          totalAmount,
          currency: data.currency,
        });
        toast.success('Payroll group created successfully!');
      }

      onSuccess?.();
    } catch (error) {
      toast.error('Failed to save payroll group');
    }
  };

  const totalCost = selectedEmployees.reduce((sum, empId) => {
    const emp = employees.find((e) => e.id === empId);
    return sum + (emp?.salary || 0);
  }, 0);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        {/* Name */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Payroll Group Name</label>
          <Input {...register('name')} placeholder="Engineering Team" />
          {errors.name && (
            <p className="text-xs text-red-500">{errors.name.message}</p>
          )}
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Description</label>
          <Input {...register('description')} placeholder="Optional" />
        </div>

        {/* Frequency + Date */}
        <div className="grid grid-cols-2 gap-4">
          {/* Frequency */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Payment Frequency</label>

            <Controller
              control={control}
              name="frequency"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="biweekly">Bi-weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />

            {errors.frequency && (
              <p className="text-xs text-red-500">
                {errors.frequency.message}
              </p>
            )}
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Due Date</label>
            <Input type="date" {...register('dueDate')} />
            {errors.dueDate && (
              <p className="text-xs text-red-500">
                {errors.dueDate.message}
              </p>
            )}
          </div>
        </div>

        {/* Currency */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Currency</label>
          <Input {...register('currency')} maxLength={3} />
          {errors.currency && (
            <p className="text-xs text-red-500">
              {errors.currency.message}
            </p>
          )}
        </div>

        {/* Employees */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Select Employees</label>

          <div className="max-h-64 overflow-y-auto border rounded-lg p-4">
            {employees.length === 0 ? (
              <p className="text-sm opacity-60">
                No employees available.
              </p>
            ) : (
              employees.map((employee) => (
                <label
                  key={employee.id}
                  className="flex items-center gap-3 p-2 cursor-pointer"
                >
                  <Checkbox
                    checked={selectedEmployees.includes(employee.id)}
                    onCheckedChange={() =>
                      handleEmployeeToggle(employee.id)
                    }
                  />
                  <div>
                    <p className="text-sm font-medium">
                      {employee.name}
                    </p>
                    <p className="text-xs opacity-60">
                      {employee.salary} {employee.currency}
                    </p>
                  </div>
                </label>
              ))
            )}
          </div>

          {errors.employees && (
            <p className="text-xs text-red-500">
              {errors.employees.message}
            </p>
          )}
        </div>

        {/* Total */}
        {selectedEmployees.length > 0 && (
          <div className="rounded-lg bg-muted p-4">
            <p className="text-sm">
              Total Cost:{' '}
              <span className="font-bold">
                {totalCost}{' '}
                {
                  employees.find(
                    (e) => e.id === selectedEmployees[0]
                  )?.currency
                }
              </span>
            </p>
          </div>
        )}
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting
          ? 'Saving...'
          : group
            ? 'Update Payroll Group'
            : 'Create Payroll Group'}
      </Button>
    </form>
  );
}