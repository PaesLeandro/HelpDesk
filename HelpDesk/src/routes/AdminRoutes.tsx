import { Navigate, Route, Routes } from "react-router";

import { AppLayout } from "../components/AppLayout";
import { ServicesPage } from "../pages/ServicesPage";
import { TicketsPage } from "../pages/TicketsPage";
import { TicketDetailsPage } from "../pages/TicketDetailsPage";
import { UsersPage } from "../pages/UsersPage";

export function AdminRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Navigate to="/services" replace />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/tickets" element={<TicketsPage />} />
        <Route path="/technicians" element={<UsersPage role="technician" />} />
        <Route path="/clients" element={<UsersPage role="client" />} />
        <Route path="/tickets/:id" element={<TicketDetailsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/services" replace />} />
    </Routes>
  );
}
