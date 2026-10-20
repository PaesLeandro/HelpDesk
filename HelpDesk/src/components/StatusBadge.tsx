import type { TicketStatus } from "../dtos/helpdesk";

const labels: Record<TicketStatus, string> = {
  open: "Aberto",
  in_progress: "Em atendimento",
  closed: "Encerrado",
};

export function StatusBadge({ status }: { status: TicketStatus }) {
  return <span className={`status-badge status-${status}`}>{labels[status]}</span>;
}
