/**
 * Sidebar - Professional Component Architecture Index
 * Clean, focused export of all sidebar components
 * Replaces 761-line monolithic component with modular architecture
 */

// Core context and types
export { SidebarProvider, useSidebar } from "./context";
export type { SidebarContext } from "./types";
export { SIDEBAR_CONSTANTS } from "./types";

// Main components
export {
  Sidebar,
  SidebarTrigger,
  SidebarRail,
  SidebarInset,
} from "./components";

// Content components
export {
  SidebarInput,
  SidebarHeader,
  SidebarFooter,
  SidebarSeparator,
  SidebarContent,
} from "./content";

// Menu components
export {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "./menu";

// Menu extras
export {
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "./menu-extras";
