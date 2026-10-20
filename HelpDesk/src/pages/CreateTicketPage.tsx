import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";

import type { Service, Ticket, User } from "../dtos/helpdesk";
import { api } from "../services/Api";
import { formatMoney, getErrorMessage } from "../utils/format";

export function CreateTicketPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [error, setError] = useState("");
  const [technicians, setTechnicians] = useState<User[]>([]);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.get<Service[]>("/services")
      .then(({ data }) => setServices(data.filter((service) => service.active)))
      .catch((error) => setError(getErrorMessage(error, "Não foi possível carregar os serviços.")));
    api.get<User[]>("/technicians")
      .then(({ data }) => setTechnicians(data))
      .catch((error) => setError(getErrorMessage(error, "Não foi possível carregar os técnicos.")));
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const data = Object.fromEntries(new FormData(event.currentTarget));
      if (!data.technicianId) delete data.technicianId;
      const response = await api.post<Ticket>("/tickets", data);
      navigate(`/tickets/${response.data.id}`);
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page narrow-page">
      <div className="page-heading"><h1>Criar chamado</h1></div>
      <div className="form-panel">
        <p className="muted">Conte o que está acontecendo para que um técnico possa ajudar.</p>
        <form className="form-stack" onSubmit={submit}>
          <label>Título<input name="title" minLength={3} placeholder="Ex.: Computador não liga" required /></label>
          <label>Serviço<select name="serviceId" defaultValue="" required><option value="" disabled>Selecione um serviço</option>{services.map((service) => <option key={service.id} value={service.id}>{service.title} — {formatMoney(service.price)}</option>)}</select></label>
          <label>Técnico<select name="technicianId" defaultValue=""><option value="">Selecione um técnico</option>{technicians.map((technician) => <option key={technician.id} value={technician.id}>{technician.name}</option>)}</select></label>
          <label>Descrição<textarea name="description" minLength={5} rows={5} placeholder="Descreva o problema" required /></label>
          {error && <p className="page-error" role="alert">{error}</p>}
          <div className="form-actions"><Link className="secondary-button" to="/">Cancelar</Link><button className="action-button" disabled={saving || !services.length}>{saving ? "Criando..." : "Criar chamado"}</button></div>
        </form>
      </div>
    </div>
  );
}
