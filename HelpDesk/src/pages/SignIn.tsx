import { useActionState } from "react";
import { AxiosError } from "axios";
import { Link } from "react-router";
import { z, ZodError } from "zod";

import { useAuth } from "../hooks/useAuth";
import { api } from "../services/Api";

const signInSchema = z.object({
  email: z.email("E-mail inválido"),
  password: z.string().trim().min(1, "Informe a senha"),
});

type FormState = { message: string; success?: boolean } | null;

export function SignIn() {
  const auth = useAuth();
  const [state, formAction, isLoading] = useActionState<FormState, FormData>(signIn, null);

  async function signIn(_: FormState, formData: FormData): Promise<FormState> {
    try {
      const data = signInSchema.parse({
        email: formData.get("email"),
        password: formData.get("password"),
      });

      const response = await api.post("/sessions", data);
      auth.save(response.data);
      return { message: "Acesso realizado com sucesso.", success: true };
    } catch (error) {
      if (error instanceof ZodError) {
        return { message: error.issues[0]?.message ?? "Verifique os dados informados." };
      }

      if (error instanceof AxiosError) {
        return {
          message: error.response?.data?.message ?? "Não foi possível entrar. Tente novamente.",
        };
      }

      return { message: "Não foi possível entrar. Tente novamente." };
    }
  }

  return (
    <div className="auth-stack">
      <section className="auth-card" aria-labelledby="login-title">
        <header className="auth-card-header">
          <h1 id="login-title">Acesse o portal</h1>
          <p>Entre usando seu e-mail e senha cadastrados</p>
        </header>

        <form action={formAction} className="auth-form">
          <label className="auth-field">
            <span>E-mail</span>
            <input
              name="email"
              type="email"
              autoComplete="email"
              placeholder="exemplo@mail.com"
              required
            />
          </label>

          <label className="auth-field">
            <span>Senha</span>
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="Digite sua senha"
              required
            />
          </label>

          {state?.message && (
            <p className={state.success ? "auth-message success" : "auth-message"} role="status">
              {state.message}
            </p>
          )}

          <button className="auth-button auth-button-primary" type="submit" disabled={isLoading}>
            {isLoading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </section>

      <section className="auth-card auth-signup-card" aria-labelledby="signup-title">
        <header className="auth-card-header">
          <h2 id="signup-title">Ainda não tem uma conta?</h2>
          <p>Cadastre agora mesmo</p>
        </header>
        <Link className="auth-button auth-button-secondary" to="/signup">
          Criar conta
        </Link>
      </section>
    </div>
  );
}
