import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  ShoppingBag,
  FolderTree,
  Package,
  Layers,
  Users,
  BarChart3,
  Settings,
  LogOut,
  UtensilsCrossed,
  CupSoda,
} from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "@/integrations/firebase/client";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useAuth } from "@/lib/auth-context";

const main = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Orders", url: "/orders", icon: ShoppingBag },
  { title: "Customers", url: "/customers", icon: Users },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
];

const chaat = [
  { title: "Categories", url: "/chaat/categories", icon: FolderTree },
  { title: "Products", url: "/chaat/products", icon: Package },
  { title: "Combos", url: "/chaat/combos", icon: Layers },
];

const juice = [
  { title: "Categories", url: "/juice/categories", icon: FolderTree },
  { title: "Products", url: "/juice/products", icon: Package },
  { title: "Combos", url: "/juice/combos", icon: Layers },
];

export function AppSidebar() {
  const path = useLocation().pathname;
  const { user } = useAuth();
  const active = (u: string) => path === u || path.startsWith(u + "/");

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-3 py-4">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-md bg-accent flex items-center justify-center text-accent-foreground font-display font-extrabold">
            B
          </div>
          <div className="group-data-[collapsible=icon]:hidden">
            <div className="font-display font-bold text-sidebar-foreground leading-none">Bombaiwala</div>
            <div className="text-[10px] text-sidebar-foreground/60 uppercase tracking-widest mt-0.5">Admin</div>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {main.map((i) => (
                <SidebarMenuItem key={i.url}>
                  <SidebarMenuButton asChild isActive={active(i.url)} tooltip={i.title}>
                    <Link to={i.url}><i.icon className="h-4 w-4" /><span>{i.title}</span></Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center gap-1.5">
            <UtensilsCrossed className="h-3 w-3" /> Chaat
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {chaat.map((i) => (
                <SidebarMenuItem key={i.url}>
                  <SidebarMenuButton asChild isActive={active(i.url)} tooltip={"Chaat " + i.title}>
                    <Link to={i.url}><i.icon className="h-4 w-4" /><span>{i.title}</span></Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center gap-1.5">
            <CupSoda className="h-3 w-3" /> Juice
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {juice.map((i) => (
                <SidebarMenuItem key={i.url}>
                  <SidebarMenuButton asChild isActive={active(i.url)} tooltip={"Juice " + i.title}>
                    <Link to={i.url}><i.icon className="h-4 w-4" /><span>{i.title}</span></Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={active("/settings")} tooltip="Settings">
                  <Link to="/settings"><Settings className="h-4 w-4" /><span>Settings</span></Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={() => signOut(auth)} tooltip="Sign out">
              <LogOut className="h-4 w-4" />
              <div className="flex flex-col items-start min-w-0">
                <span className="truncate w-full text-xs">{user?.email ?? "—"}</span>
                <span className="text-[10px] text-sidebar-foreground/60">Sign out</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
