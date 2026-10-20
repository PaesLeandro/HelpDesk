import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";

import { StatusBadge } from "../components/StatusBadge";
import type { Service, Ticket } from "../dtos/helpdesk";
import { useAuth } from "../hooks/useAuth";
import { api } from "../services/Api";
import { formatDate, formatMoney, formatTicketNumber, getErrorMessage } from "../utils/format";

export function TicketDetailsPage() {
  const { id } = useParams();
  const { session } = useAuth();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [serviceId, setServiceId] = useState("");

  async function load() {
    try {
      const { data } = await api.get<Ticket>(`/tickets/${id}`);
      setTicket(data);
      if (session?.user.role === "technician") {
        const servicesResponse = await api.get<Service[]>("/services");
        setServices(servicesResponse.data);
      }
      setError("");
    } catch (error) {
      setError(getErrorMessage(error, "Não foi possível carregar o chamado."));
    }

  }

  useEffect(() => { void load(); }, [id]);

  async function addService() {
    if (!ticket || !serviceId) return;
    setPending(true);
    try {
      const { data } = await api.post<Ticket>(`/tickets/${ticket.id}/services`, { serviceId });
      setTicket(data);
      setServiceId("");
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setPending(false);
    }
  }

  async function changeStatus() {
    if (!ticket) return;
    setPending(true);
    try {
      await api.post(`/tickets/${ticket.id}/${ticket.status === "open" ? "start" : "close"}`);
      await load();
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="page narrow-page">
      <div className="page-heading"><div><Link className="back-link" to={session?.user.role === "admin" ? "/tickets" : "/"}>← Voltar</Link><h1>Chamado {ticket ? formatTicketNumber(ticket.number) : ""}</h1></div></div>
      {error && <p className="page-error" role="alert">{error}</p>}
      {!ticket ? !error && <p className="empty-state">Carregando chamado...</p> : (
        <article className="form-panel ticket-details">
          <div className="detail-header"><div><span className="ticket-number">{formatTicketNumber(ticket.number)}</span><h2>{ticket.title}</h2></div><StatusBadge status={ticket.status} /></div>
          <p className="detail-description">{ticket.description}</p>
          <dl className="detail-grid">
            <div><dt>Serviço</dt><dd>{ticket.service.title}</dd></div>
            <div><dt>Valor total</dt><dd>{formatMoney(ticket.amount)}</dd></div>
            <div><dt>Cliente</dt><dd>{ticket.client.name}</dd></div>
            <div><dt>Técnico</dt><dd>{ticket.technician?.name ?? "Aguardando técnico"}</dd></div>
            <div><dt>Criado em</dt><dd>{formatDate(ticket.createdAt)}</dd></div>
            <div><dt>Atualizado em</dt><dd>{formatDate(ticket.updatedAt)}</dd></div>
          </dl>
          {!!ticket.ticketServices?.length && <div><strong>Serviços do chamado</strong><ul>{ticket.ticketServices.map((item) => <li key={item.id}>{item.service.title}: {formatMoney(item.price)}</li>)}</ul></div>}
          {session?.user.role === "technician" && ticket.technicianId === session.user.id && ticket.status !== "closed" && <div className="form-actions"><select value={serviceId} onChange={(event) => setServiceId(event.target.value)}><option value="">Adicionar serviço</option>{services.filter((service) => !ticket.ticketServices?.some((item) => item.service.id === service.id)).map((service) => <option key={service.id} value={service.id}>{service.title} — {formatMoney(service.price)}</option>)}</select><button className="secondary-button" type="button" disabled={pending || !serviceId} onClick={addService}>Adicionar</button></div>}
          {session?.user.role === "technician" && ticket.status !== "closed" && <button className="action-button" type="button" disabled={pending} onClick={changeStatus}>{pending ? "Aguarde..." : ticket.status === "open" ? "Iniciar atendimento" : "Encerrar chamado"}</button>}
        </article>
      )}
    </div>
  );
}
