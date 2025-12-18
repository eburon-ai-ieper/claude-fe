import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { LogOut, Settings, Users, Building2, Home } from "lucide-react";
import { NavLink } from "react-router";
import type { ReactNode } from "react";

interface SuperAdminLayoutProps {
  children: ReactNode;
}

export function SuperAdminLayout({ children }: SuperAdminLayoutProps) {
  const { user, logout } = useAuthStore();

  return (
    <div className="flex min-h-svh bg-background text-foreground">
      {/* Sidebar */}
      <aside className="hidden border-r bg-card/60 backdrop-blur-sm md:flex md:w-64 md:flex-col">
        <div className="flex items-center gap-2 px-6 py-4">
          <div className="size-8 rounded-md bg-primary/10" />
          <div className="flex flex-col">
            <span className="text-sm font-semibold tracking-tight">
              Superadmin
            </span>
            <span className="text-xs text-muted-foreground">
              Eburon Meet Control
            </span>
          </div>
        </div>
        <Separator />
        <nav className="flex-1 space-y-1 px-3 py-4">
          <SidebarLink to="/super-admin" icon={<Home className="size-4" />}>
            Dashboard
          </SidebarLink>
          <SidebarLink
            to="/super-admin/users"
            icon={<Users className="size-4" />}
          >
            User Management
          </SidebarLink>
          <SidebarLink
            to="/super-admin/organizations"
            icon={<Building2 className="size-4" />}
          >
            Organizations
          </SidebarLink>
          <SidebarLink
            to="/super-admin/settings"
            icon={<Settings className="size-4" />}
          >
            Settings
          </SidebarLink>
        </nav>
        <Separator />
        <div className="flex items-center justify-between gap-2 px-4 py-4">
          <div className="flex flex-col">
            <span className="text-xs font-medium leading-tight">
              {user?.name ?? user?.email ?? "Super Admin"}
            </span>
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
              {user?.role}
            </span>
          </div>
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label="Logout"
            onClick={logout}
          >
            <LogOut className="size-4" />
          </Button>
        </div>
      </aside>

      {/* Content */}
      <div className="flex min-h-svh flex-1 flex-col">
        {/* Mobile header */}
        <header className="flex items-center justify-between gap-2 border-b bg-card/60 px-4 py-3 backdrop-blur-sm md:hidden">
          <div className="flex flex-col">
            <span className="text-sm font-semibold tracking-tight">
              Superadmin
            </span>
            <span className="text-xs text-muted-foreground">
              Eburon Meet Control
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="icon-sm"
              variant="ghost"
              aria-label="Settings"
              asChild
            >
              <NavLink to="/super-admin/settings">
                <Settings className="size-4" />
              </NavLink>
            </Button>
            <Button
              size="icon-sm"
              variant="ghost"
              aria-label="Logout"
              onClick={logout}
            >
              <LogOut className="size-4" />
            </Button>
          </div>
        </header>

        <main className="flex-1 px-4 py-4 md:px-8 md:py-6">{children}</main>
      </div>
    </div>
  );
}

interface SidebarLinkProps {
  to: string;
  icon: ReactNode;
  children: ReactNode;
}

function SidebarLink({ to, icon, children }: SidebarLinkProps) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        [
          "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
          isActive
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
        ].join(" ")
      }
    >
      {icon}
      <span>{children}</span>
    </NavLink>
  );
}

export default SuperAdminLayout;


