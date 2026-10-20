import { useEffect, useState } from "react";
import { Link } from "react-router";

import { StatusBadge } from "../components/StatusBadge";
import type { Ticket, TicketStatus } from "../dtos/helpdesk";
import { useAuth } from "../hooks/useAuth";
import { api } from "../services/Api";
import { formatDate, formatMoney, formatTicketNumber, getErrorMessage } from "../utils/format";

const sections: Array<{ status: TicketStatus; title: string }> = [
  { status: "in_progress", title: "Em atendimento" },
  { status: "open", title: "Abertos" },
  { status: "closed", title: "Encerrados" },
];

export function TicketsPage() {
  const { session } = useAuth();
  const role = session!.user.role;
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function load() {
    try {
      const { data } = await api.get<Ticket[]>("/tickets");
      setTickets(data);
      setError("");
    } catch (error) {
      setError(getErrorMessage(error, "Não foi possível carregar os chamados."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  async function changeStatus(ticket: Ticket) {
    setPendingId(ticket.id);
    try {
      if (role === "admin") {
        const next = ticket.status === "open" ? "in_progress" : ticket.status === "in_progress" ? "closed" : "open";
        await api.patch(`/tickets/${ticket.id}/status`, { status: next });
      } else {
        const action = ticket.status === "open" ? "start" : "close";
        await api.post(`/tickets/${ticket.id}/${action}`);
      }
      await load();
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="page">
      <div className="page-heading">
        <h1>{role === "admin" ? "Chamados" : "Meus chamados"}</h1>
        {role === "client" && <Link className="action-button" to="/new">+ <span>Criar chamado</span></Link>}
      </div>
      {error && <p className="page-error" role="alert">{error}</p>}
      {loading ? <p className="empty-state">Carregando chamados...</p> : role === "technician" ? (
        <div className="ticket-sections">
          {sections.map((section) => {
            const sectionTickets = tickets.filter((ticket) => ticket.status === section.status);
            return (
              <section key={section.status} className="ticket-section">
                <h2><StatusBadge status={section.status} /></h2>
                <div className="ticket-card-grid">
                  {sectionTickets.map((ticket) => (
                    <article className="ticket-card" key={ticket.id}>
                      <div className="ticket-card-top">
                        <span className="ticket-number">{formatTicketNumber(ticket.number)}</span>
                        <div className="ticket-card-actions">
                          <Link className="icon-action" aria-label={`Ver chamado ${formatTicketNumber(ticket.number)}`} to={`/tickets/${ticket.id}`}>◉</Link>
                          {ticket.status !== "closed" && <button type="button" className="mini-button" disabled={pendingId === ticket.id} onClick={() => changeStatus(ticket)}>{pendingId === ticket.id ? "..." : ticket.status === "open" ? "Iniciar" : "Encerrar"}</button>}
                        </div>
                      </div>
                      <h3>{ticket.title}</h3>
                      <p>{ticket.service.title}</p>
                      <div className="ticket-card-meta"><span>{formatDate(ticket.updatedAt)}</span><strong>{formatMoney(ticket.amount)}</strong></div>
                      <div className="ticket-card-footer"><span className="user-avatar small">{ticket.client.name.slice(0, 1).toUpperCase()}</span><span>{ticket.client.name}</span><StatusBadge status={ticket.status} /></div>
                    </article>
                  ))}
                </div>
                {!sectionTickets.length && <p className="section-empty">Nenhum chamado nesta etapa.</p>}
              </section>
            );
          })}
        </div>
      ) : (
        <div className="table-shell">
          <table className="data-table tickets-table">
            <thead><tr><th>Atualizado em</th><th>ID</th><th>Título</th><th className="desktop-only">Serviço</th><th className="desktop-only">Valor total</th><th className="desktop-only">{role === "admin" ? "Cliente" : "Técnico"}</th><th>Status</th><th><span className="sr-only">Detalhes</span></th></tr></thead>
            <tbody>
              {tickets.map((ticket) => (
                <tr key={ticket.id}>
                  <td className="date-cell">{formatDate(ticket.updatedAt)}</td>
                  <td>{formatTicketNumber(ticket.number)}</td>
                  <td className="cell-title"><span className="truncate-text">{ticket.title}</span></td>
                  <td className="desktop-only">{ticket.service.title}</td>
                  <td className="desktop-only">{formatMoney(ticket.amount)}</td>
                  <td className="desktop-only">{role === "admin" ? ticket.client.name : ticket.technician?.name ?? "Aguardando"}</td>
                  <td><StatusBadge status={ticket.status} />{role === "admin" && ticket.status !== "closed" && <button type="button" className="text-action" disabled={pendingId === ticket.id} onClick={() => changeStatus(ticket)}>Avançar</button>}</td>
                  <td><Link className="icon-action" aria-label={`Ver chamado ${formatTicketNumber(ticket.number)}`} to={`/tickets/${ticket.id}`}>◉</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!tickets.length && <p className="empty-state">Nenhum chamado encontrado.</p>}
        </div>
      )}
    </div>
  );
}
