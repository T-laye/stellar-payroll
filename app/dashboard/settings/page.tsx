'use client';

import { useAuthStore } from '@/lib/stores/auth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function SettingsPage() {
  const user = useAuthStore((state) => state.user);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="mt-2 text-foreground/60">Manage your account settings</p>
      </div>

      {/* Account Information */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-foreground mb-6">Account Information</h2>
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-foreground/60">Full Name</p>
            <p className="text-foreground">{user?.name}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-foreground/60">Email Address</p>
            <p className="text-foreground">{user?.email}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-foreground/60">Company</p>
            <p className="text-foreground">{user?.company}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-foreground/60">Account Type</p>
            <p className="text-foreground capitalize">{user?.role}</p>
          </div>
        </div>
      </Card>

      {/* API Keys */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-foreground mb-6">API Keys</h2>
        <p className="text-sm text-foreground/60 mb-4">
          Manage your API keys for integrations and automations.
        </p>
        <Button variant="outline" disabled>
          Generate New Key
        </Button>
      </Card>

      {/* Webhooks */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-foreground mb-6">Webhooks</h2>
        <p className="text-sm text-foreground/60 mb-4">
          Configure webhooks to receive real-time payment updates.
        </p>
        <Button variant="outline" disabled>
          Add Webhook
        </Button>
      </Card>

      {/* Two-Factor Authentication */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-foreground mb-6">Security</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Two-Factor Authentication</p>
              <p className="text-sm text-foreground/60">Add an extra layer of security</p>
            </div>
            <Button variant="outline" disabled>
              Enable
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
