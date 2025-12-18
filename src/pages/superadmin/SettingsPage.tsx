import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface LocalSettings {
  defaultRoomDurationMinutes: number;
  maxUsersPerOrganization: number;
  maintenanceMode: boolean;
}

const STORAGE_KEY = "superadmin_settings";

export function SettingsPage() {
  const [settings, setSettings] = useState<LocalSettings>({
    defaultRoomDurationMinutes: 60,
    maxUsersPerOrganization: 1000,
    maintenanceMode: false,
  });

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as LocalSettings;
      setSettings(parsed);
    } catch {
      // ignore parse error and keep defaults
    }
  }, []);

  const handleSave = (event: React.FormEvent) => {
    event.preventDefault();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    toast.success("Settings saved locally");
  };

  const hasErrors =
    settings.defaultRoomDurationMinutes <= 0 ||
    settings.maxUsersPerOrganization <= 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Configure application‑wide defaults for the admin console. These are
          stored locally in the browser for now.
        </p>
      </div>

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle className="text-base">General</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="room-duration">
                  Default room duration (minutes)
                </FieldLabel>
                <Input
                  id="room-duration"
                  type="number"
                  min={1}
                  value={settings.defaultRoomDurationMinutes}
                  onChange={(event) =>
                    setSettings((prev) => ({
                      ...prev,
                      defaultRoomDurationMinutes:
                        Number(event.target.value) || 0,
                    }))
                  }
                />
                {settings.defaultRoomDurationMinutes <= 0 && (
                  <FieldError
                    errors={[
                      {
                        type: "min",
                        message: "Duration must be greater than 0",
                      },
                    ]}
                  />
                )}
              </Field>

              <Field>
                <FieldLabel htmlFor="max-users">
                  Max users per organization
                </FieldLabel>
                <Input
                  id="max-users"
                  type="number"
                  min={1}
                  value={settings.maxUsersPerOrganization}
                  onChange={(event) =>
                    setSettings((prev) => ({
                      ...prev,
                      maxUsersPerOrganization:
                        Number(event.target.value) || 0,
                    }))
                  }
                />
                {settings.maxUsersPerOrganization <= 0 && (
                  <FieldError
                    errors={[
                      {
                        type: "min",
                        message: "Max users must be greater than 0",
                      },
                    ]}
                  />
                )}
              </Field>

              <Field>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <FieldLabel>Maintenance mode</FieldLabel>
                    <p className="text-xs text-muted-foreground">
                      Toggle to indicate that the system is under maintenance.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant={
                      settings.maintenanceMode ? "destructive" : "outline"
                    }
                    onClick={() =>
                      setSettings((prev) => ({
                        ...prev,
                        maintenanceMode: !prev.maintenanceMode,
                      }))
                    }
                  >
                    {settings.maintenanceMode ? "Enabled" : "Disabled"}
                  </Button>
                </div>
              </Field>
            </FieldGroup>

            <CardFooter className="flex justify-end gap-2 px-0">
              <Button type="submit" disabled={hasErrors}>
                Save settings
              </Button>
            </CardFooter>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default SettingsPage;


