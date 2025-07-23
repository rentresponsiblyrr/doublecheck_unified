/**
 * Sidebar Context - Professional Context Management
 * Extracted from monolithic sidebar for better separation of concerns
 */

import * as React from "react";
import { SidebarContext, SIDEBAR_CONSTANTS } from "./types";
import { useIsMobile } from "@/hooks/use-mobile";

const SidebarContextProvider = React.createContext<SidebarContext | null>(null);

export function useSidebar() {
  const context = React.useContext(SidebarContextProvider);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.");
  }
  return context;
}

interface SidebarProviderProps extends React.ComponentProps<"div"> {
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const SidebarProvider = React.forwardRef<
  HTMLDivElement,
  SidebarProviderProps
>(
  (
    {
      defaultOpen = true,
      open: openProp,
      onOpenChange: setOpenProp,
      className,
      style,
      children,
      ...props
    },
    ref,
  ) => {
    const isMobile = useIsMobile();
    const [openMobile, setOpenMobile] = React.useState(false);

    // Internal state for when no external control is provided
    const [_open, _setOpen] = React.useState(defaultOpen);
    const open = openProp ?? _open;
    const setOpen = React.useCallback(
      (value: boolean | ((value: boolean) => boolean)) => {
        const openState = typeof value === "function" ? value(open) : value;
        if (setOpenProp) {
          setOpenProp(openState);
        } else {
          _setOpen(openState);
        }

        // Store in cookie for persistence
        document.cookie = `${SIDEBAR_CONSTANTS.COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_CONSTANTS.COOKIE_MAX_AGE}`;
      },
      [setOpenProp, open],
    );

    // Toggle function
    const toggleSidebar = React.useCallback(() => {
      return isMobile
        ? setOpenMobile((open) => !open)
        : setOpen((open) => !open);
    }, [isMobile, setOpen, setOpenMobile]);

    // Keyboard shortcut handling
    React.useEffect(() => {
      const handleKeyDown = (event: KeyboardEvent) => {
        if (
          event.key === SIDEBAR_CONSTANTS.KEYBOARD_SHORTCUT &&
          (event.metaKey || event.ctrlKey)
        ) {
          event.preventDefault();
          toggleSidebar();
        }
      };

      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }, [toggleSidebar]);

    // Determine collapsed state
    const state = open ? "expanded" : "collapsed";

    const contextValue: SidebarContext = React.useMemo(
      () => ({
        state,
        open,
        setOpen,
        isMobile,
        openMobile,
        setOpenMobile,
        toggleSidebar,
      }),
      [
        state,
        open,
        setOpen,
        isMobile,
        openMobile,
        setOpenMobile,
        toggleSidebar,
      ],
    );

    return (
      <SidebarContextProvider.Provider value={contextValue}>
        <div
          style={
            {
              "--sidebar-width": SIDEBAR_CONSTANTS.WIDTH,
              "--sidebar-width-icon": SIDEBAR_CONSTANTS.WIDTH_ICON,
              ...style,
            } as React.CSSProperties
          }
          className={className}
          ref={ref}
          {...props}
        >
          {children}
        </div>
      </SidebarContextProvider.Provider>
    );
  },
);

SidebarProvider.displayName = "SidebarProvider";
