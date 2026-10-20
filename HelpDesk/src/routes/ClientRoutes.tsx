import { Navigate, Route, Routes } from "react-router";

import { AppLayout } from "../components/AppLayout";
import { CreateTicketPage } from "../pages/CreateTicketPage";
import { TicketsPage } from "../pages/TicketsPage";
import { TicketDetailsPage } from "../pages/TicketDetailsPage";

export function ClientRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<TicketsPage />} />
        <Route path="/new" element={<CreateTicketPage />} />
        <Route path="/tickets/:id" element={<TicketDetailsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
