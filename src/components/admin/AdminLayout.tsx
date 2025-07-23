import React from "react";
import { AdminLayoutContainer } from "./layout/AdminLayoutContainer";

interface AdminLayoutProps {
  children?: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  return <AdminLayoutContainer>{children}</AdminLayoutContainer>;
};

export default AdminLayout;
