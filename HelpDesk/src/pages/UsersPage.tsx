import { useEffect, useState, type FormEvent } from "react";

import type { User } from "../dtos/helpdesk";
import { api } from "../services/Api";
import { getErrorMessage } from "../utils/format";

type ManagedRole = "technician" | "client";

export function UsersPage({ role }: { role: ManagedRole }) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dialogOpen, setDialogOpen] = useState<User | "new" | null>(null);
  const title = role === "technician" ? "Técnicos" : "Clientes";

  async function load() {
    try {
      const { data } = await api.get<User[]>("/users", { params: { role } });
      setUsers(data);
      setError("");
    } catch (error) {
      setError(getErrorMessage(error, `Não foi possível carregar ${title.toLowerCase()}.`));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, [role]);

  return (
    <div className="page">
      <div className="page-heading"><h1>{title}</h1>      <button className="action-button" onClick={() => setDialogOpen("new")}>+ <span>Novo</span></button></div>
      {error && <p className="page-error" role="alert">{error}</p>}
      {loading ? <p className="empty-state">Carregando...</p> : (
        <div className="table-shell">
          <table className="data-table users-table"><thead><tr><th>Nome</th><th>E-mail</th><th>Perfil</th></tr></thead><tbody>
            {users.map((user) => <tr key={user.id}><td className="cell-title">{user.name}</td><td>{user.email}</td><td>{role === "technician" ? "Técnico" : "Cliente"}</td><td className="row-actions"><button type="button" className="text-action" onClick={() => setDialogOpen(user)}>Editar</button><button type="button" className="text-action" onClick={async () => { if (confirm("Excluir este usuário?")) { await api.delete(`/users/${user.id}`); await load(); } }}>Excluir</button></td></tr>)}
          </tbody></table>
          {!users.length && <p className="empty-state">Nenhum {role === "technician" ? "técnico" : "cliente"} cadastrado.</p>}
        </div>
      )}
      {dialogOpen && <UserDialog role={role} user={dialogOpen === "new" ? null : dialogOpen} onClose={() => setDialogOpen(null)} onSaved={async () => { setDialogOpen(null); await load(); }} />}
    </div>
  );
}

function UserDialog({ role, user, onClose, onSaved }: { role: ManagedRole; user: User | null; onClose: () => void; onSaved: () => Promise<void> }) {
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const data = Object.fromEntries(new FormData(event.currentTarget));
      if (user) await api.patch(`/users/${user.id}`, data);
      else await api.post("/users/staff", { ...data, role });
      await onSaved();
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="dialog" role="dialog" aria-modal="true" aria-labelledby="user-dialog-title">
        <div className="dialog-heading"><h2 id="user-dialog-title">Novo {role === "technician" ? "técnico" : "cliente"}</h2><button type="button" aria-label="Fechar" onClick={onClose}>×</button></div>
        <form className="form-stack" onSubmit={submit}>
          <label>Nome<input name="name" defaultValue={user?.name} minLength={2} autoComplete="name" required /></label>
          <label>E-mail<input name="email" type="email" defaultValue={user?.email} autoComplete="email" required /></label>
          <label>{user ? "Nova senha (opcional)" : "Senha inicial"}<input name="password" type="password" minLength={6} autoComplete="new-password" required={!user} /></label>
          {error && <p className="page-error" role="alert">{error}</p>}
          <button className="action-button wide" disabled={saving}>{saving ? "Salvando..." : user ? "Salvar" : "Cadastrar"}</button>
        </form>
      </section>
    </div>
  );
}
