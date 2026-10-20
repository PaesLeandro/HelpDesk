import { Navigate, Route, Routes } from "react-router";

import { AppLayout } from "../components/AppLayout";
import { TicketsPage } from "../pages/TicketsPage";
import { TicketDetailsPage } from "../pages/TicketDetailsPage";

export function TechnicianRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<TicketsPage />} />
        <Route path="/tickets/:id" element={<TicketDetailsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
