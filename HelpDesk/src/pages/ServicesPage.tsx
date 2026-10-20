import { useEffect, useState, type FormEvent } from "react";

import type { Service } from "../dtos/helpdesk";
import { api } from "../services/Api";
import { formatMoney, getErrorMessage } from "../utils/format";

export function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dialog, setDialog] = useState<Service | "new" | null>(null);

  async function load() {
    try {
      const { data } = await api.get<Service[]>("/services");
      setServices(data);
      setError("");
    } catch (error) {
      setError(getErrorMessage(error, "Não foi possível carregar os serviços."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  async function toggle(service: Service) {
    try {
      await api.patch(`/services/${service.id}`, { active: !service.active });
      await load();
    } catch (error) {
      setError(getErrorMessage(error));
    }
  }

  return (
    <div className="page">
      <div className="page-heading">
        <h1>Serviços</h1>
        <button className="action-button" type="button" onClick={() => setDialog("new")}>+ <span>Novo</span></button>
      </div>

      {error && <p className="page-error" role="alert">{error}</p>}
      {loading ? <p className="empty-state">Carregando serviços...</p> : (
        <div className="table-shell">
          <table className="data-table services-table">
            <thead><tr><th>Título</th><th>Valor</th><th>Status</th><th><span className="sr-only">Ações</span></th></tr></thead>
            <tbody>
              {services.map((service) => (
                <tr key={service.id}>
                  <td className="cell-title">{service.title}</td>
                  <td>{formatMoney(service.price)}</td>
                  <td><span className={`service-status ${service.active ? "active" : "inactive"}`}>{service.active ? "Ativo" : "Inativo"}</span></td>
                  <td className="row-actions">
                    <button type="button" className="text-action" onClick={() => toggle(service)}>{service.active ? "Desativar" : "Restaurar"}</button>
                    <button type="button" className="icon-action" aria-label={`Editar ${service.title}`} title="Editar" onClick={() => setDialog(service)}>✎</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!services.length && <p className="empty-state">Nenhum serviço cadastrado.</p>}
        </div>
      )}

      {dialog && <ServiceDialog key={dialog === "new" ? "new" : dialog.id} service={dialog === "new" ? null : dialog} onClose={() => setDialog(null)} onSaved={async () => { setDialog(null); await load(); }} />}
    </div>
  );
}

function ServiceDialog({ service, onClose, onSaved }: { service: Service | null; onClose: () => void; onSaved: () => Promise<void> }) {
  const [title, setTitle] = useState(service?.title ?? "");
  const [price, setPrice] = useState(service?.price.toString() ?? "");
  const [active, setActive] = useState(service?.active ?? true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const data = { title: title.trim(), price: Number(price), active };
      if (service) await api.patch(`/services/${service.id}`, data);
      else await api.post("/services", data);
      await onSaved();
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="dialog" role="dialog" aria-modal="true" aria-labelledby="service-dialog-title">
        <div className="dialog-heading"><h2 id="service-dialog-title">{service ? "Editar serviço" : "Novo serviço"}</h2><button type="button" aria-label="Fechar" onClick={onClose}>×</button></div>
        <form className="form-stack" onSubmit={submit}>
          <label>Título<input value={title} onChange={(event) => setTitle(event.target.value)} minLength={2} required /></label>
          <label>Valor (R$)<input type="number" min="0" step="0.01" value={price} onChange={(event) => setPrice(event.target.value)} required /></label>
          <label className="check-field"><input type="checkbox" checked={active} onChange={(event) => setActive(event.target.checked)} /> Serviço ativo</label>
          {error && <p className="page-error" role="alert">{error}</p>}
          <button className="action-button wide" disabled={saving}>{saving ? "Salvando..." : "Salvar serviço"}</button>
        </form>
      </section>
    </div>
  );
}
