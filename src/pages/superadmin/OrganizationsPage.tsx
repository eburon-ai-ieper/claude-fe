import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createOrganization,
  deleteOrganization,
  fetchOrganizations,
  updateOrganization,
} from "@/api/superadmin";
import type { Organization } from "@/types/superadmin";
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
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { Trash2, Pencil, Plus } from "lucide-react";
import { getSyntheticMinutesForOrganization } from "@/lib/analytics";

export function OrganizationsPage() {
  const [search, setSearch] = useState("");
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [formName, setFormName] = useState("");

  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["superadmin", "organizations", { search }],
    queryFn: () => fetchOrganizations(search || undefined),
  });

  const organizations = useMemo(() => data ?? [], [data]);

  const createMutation = useMutation({
    mutationFn: createOrganization,
    onSuccess: () => {
      toast.success("Organization created");
      setFormName("");
      queryClient.invalidateQueries({
        queryKey: ["superadmin", "organizations"],
      });
    },
    onError: () => {
      toast.error("Failed to create organization");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      updateOrganization(id, { name }),
    onSuccess: () => {
      toast.success("Organization updated");
      setEditingOrg(null);
      setFormName("");
      queryClient.invalidateQueries({
        queryKey: ["superadmin", "organizations"],
      });
    },
    onError: () => {
      toast.error("Failed to update organization");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteOrganization,
    onSuccess: () => {
      toast.success("Organization deleted");
      queryClient.invalidateQueries({
        queryKey: ["superadmin", "organizations"],
      });
    },
    onError: () => {
      toast.error("Failed to delete organization");
    },
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!formName.trim()) {
      toast.error("Organization name is required");
      return;
    }

    if (editingOrg) {
      updateMutation.mutate({ id: editingOrg.id, name: formName.trim() });
    } else {
      createMutation.mutate({ name: formName.trim() });
    }
  };

  const handleEdit = (org: Organization) => {
    setEditingOrg(org);
    setFormName(org.name);
  };

  const handleCancelEdit = () => {
    setEditingOrg(null);
    setFormName("");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Organizations
          </h1>
          <p className="text-sm text-muted-foreground">
            Create and manage organizations in the system.
          </p>
        </div>

        <div className="flex w-full flex-col gap-2 md:w-80">
          <Field>
            <FieldLabel htmlFor="org-search">Search</FieldLabel>
            <Input
              id="org-search"
              placeholder="Search by name..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </Field>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr,1.2fr]">
        <Card className="order-2 lg:order-1">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">All organizations</CardTitle>
            {isLoading && <Spinner />}
          </CardHeader>
          <CardContent>
            {isError && (
              <p className="text-sm text-destructive">
                Failed to load organizations.
              </p>
            )}
            {!isLoading && organizations.length === 0 && !isError && (
              <p className="text-sm text-muted-foreground">
                No organizations found.
              </p>
            )}
            <ul className="divide-y">
              {organizations.map((org) => (
                <li
                  key={org.id}
                  className="flex items-center justify-between gap-3 py-3"
                >
                  <div>
                    <p className="text-sm font-medium">{org.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {org.users?.length ?? 0} users ·{" "}
                      {org.rooms?.length ?? 0} rooms
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {getSyntheticMinutesForOrganization(
                        org,
                      ).toLocaleString()}{" "}
                      minutes used
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      aria-label="Edit organization"
                      onClick={() => handleEdit(org)}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      aria-label="Delete organization"
                      className="text-destructive hover:bg-destructive/10"
                      disabled={deleteMutation.isPending}
                      onClick={() => deleteMutation.mutate(org.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="order-1 lg:order-2">
          <CardHeader>
            <CardTitle className="text-base">
              {editingOrg ? "Edit organization" : "Create organization"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="org-name">Name</FieldLabel>
                  <Input
                    id="org-name"
                    placeholder="Acme Inc."
                    value={formName}
                    onChange={(event) => setFormName(event.target.value)}
                  />
                  {!formName.trim() && (
                    <FieldError
                      errors={[
                        {
                          type: "required",
                          message: "Name is required",
                        },
                      ]}
                    />
                  )}
                </Field>
              </FieldGroup>
              <CardFooter className="flex justify-end gap-2 px-0">
                {editingOrg && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleCancelEdit}
                  >
                    Cancel
                  </Button>
                )}
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  <Plus className="mr-2 size-4" />
                  {editingOrg ? "Save changes" : "Create organization"}
                </Button>
              </CardFooter>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default OrganizationsPage;


