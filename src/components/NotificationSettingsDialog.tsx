import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Bell, Check, Info } from '@phosphor-icons/react';
import type { NotificationSettings } from '@/lib/notifications';

interface NotificationSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: NotificationSettings;
  onSave: (settings: NotificationSettings) => void;
  onTest: () => void;
}

export function NotificationSettingsDialog({
  open,
  onOpenChange,
  settings,
  onSave,
  onTest,
}: NotificationSettingsDialogProps) {
  const [localSettings, setLocalSettings] = useState<NotificationSettings>(settings);
  const [testSent, setTestSent] = useState(false);

  // Sync localSettings with settings prop when it changes (e.g., after Firebase load)
  useEffect(() => {
    console.log('[NotificationSettingsDialog] Props settings changed:', settings)
    setLocalSettings(settings);
  }, [settings]);

  const handleSave = () => {
    onSave(localSettings);
    onOpenChange(false);
  };

  const handleTest = () => {
    onTest();
    setTestSent(true);
    setTimeout(() => setTestSent(false), 3000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Settings
          </DialogTitle>
          <DialogDescription>
            Configure webhook notifications for domain status changes
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Enable/Disable */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="enabled">Enable Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Send alerts via Slack webhook
              </p>
            </div>
            <Switch
              id="enabled"
              checked={localSettings.enabled}
              onCheckedChange={(checked) =>
                setLocalSettings({ ...localSettings, enabled: checked })
              }
            />
          </div>

          {/* Webhook URL */}
          <div className="space-y-2">
            <Label htmlFor="webhookUrl">Slack Webhook URL</Label>
            <Input
              id="webhookUrl"
              type="url"
              placeholder="https://hooks.slack.com/services/..."
              value={localSettings.webhookUrl}
              onChange={(e) =>
                setLocalSettings({ ...localSettings, webhookUrl: e.target.value })
              }
              disabled={!localSettings.enabled}
            />
            <p className="text-xs text-muted-foreground">
              Get your webhook URL from{' '}
              <a
                href="https://api.slack.com/apps"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                api.slack.com/apps
              </a>
            </p>
          </div>

          {/* Notification Rules */}
          <div className="space-y-3 rounded-lg border p-4">
            <Label>Notification Rules</Label>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="notifyOnDown" className="font-normal">
                  Notify when domain goes offline
                </Label>
              </div>
              <Switch
                id="notifyOnDown"
                checked={localSettings.notifyOnDown}
                onCheckedChange={(checked) =>
                  setLocalSettings({ ...localSettings, notifyOnDown: checked })
                }
                disabled={!localSettings.enabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="notifyOnRecovery" className="font-normal">
                  Notify when domain recovers
                </Label>
              </div>
              <Switch
                id="notifyOnRecovery"
                checked={localSettings.notifyOnRecovery}
                onCheckedChange={(checked) =>
                  setLocalSettings({ ...localSettings, notifyOnRecovery: checked })
                }
                disabled={!localSettings.enabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="notifyOnSlow" className="font-normal">
                  Notify when response is slow
                </Label>
              </div>
              <Switch
                id="notifyOnSlow"
                checked={localSettings.notifyOnSlow}
                onCheckedChange={(checked) =>
                  setLocalSettings({ ...localSettings, notifyOnSlow: checked })
                }
                disabled={!localSettings.enabled}
              />
            </div>

            {localSettings.notifyOnSlow && (
              <div className="space-y-2 pl-4">
                <Label htmlFor="slowThreshold" className="text-xs">
                  Slow Threshold (seconds)
                </Label>
                <Input
                  id="slowThreshold"
                  type="number"
                  min="1"
                  max="30"
                  value={localSettings.slowThreshold}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      slowThreshold: Number(e.target.value),
                    })
                  }
                  disabled={!localSettings.enabled}
                  className="w-24"
                />
              </div>
            )}
          </div>

          {/* Cooldown */}
          <div className="space-y-2">
            <Label htmlFor="cooldown">Cooldown Period (minutes)</Label>
            <Input
              id="cooldown"
              type="number"
              min="1"
              max="60"
              value={localSettings.cooldownMinutes}
              onChange={(e) =>
                setLocalSettings({
                  ...localSettings,
                  cooldownMinutes: Number(e.target.value),
                })
              }
              disabled={!localSettings.enabled}
              className="w-32"
            />
            <p className="text-xs text-muted-foreground">
              Minimum time between notifications for the same domain
            </p>
          </div>

          {/* Test Button */}
          {localSettings.enabled && localSettings.webhookUrl && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>Test your webhook configuration</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTest}
                  disabled={testSent}
                >
                  {testSent ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Sent!
                    </>
                  ) : (
                    'Send Test'
                  )}
                </Button>
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Settings</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
