import { useState, type FormEvent } from "react";
import { AxiosError } from "axios";
import { Link, useNavigate } from "react-router";
import { z, ZodError } from "zod";

import { api } from "../services/Api";

const signUpSchema = z
  .object({
    name: z.string().trim().min(1, "Informe o nome"),
    email: z.email("E-mail inválido"),
    password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
    passwordConfirm: z.string().min(1, "Confirme a senha"),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: "As senhas não são iguais",
    path: ["passwordConfirm"],
  });

export function SignUp() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const formData = new FormData(event.currentTarget);
      const data = signUpSchema.parse({
        name: formData.get("name"),
        email: formData.get("email"),
        password: formData.get("password"),
        passwordConfirm: formData.get("passwordConfirm"),
      });

      await api.post("/users", data);
      navigate("/");
    } catch (error) {
      if (error instanceof ZodError) {
        setError(error.issues[0]?.message ?? "Verifique os dados informados.");
      } else if (error instanceof AxiosError) {
        setError(error.response?.data?.message ?? "Não foi possível cadastrar. Tente novamente.");
      } else {
        setError("Não foi possível cadastrar. Tente novamente.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="auth-card" aria-labelledby="signup-title">
      <header className="auth-card-header">
        <h1 id="signup-title">Crie sua conta</h1>
        <p>Preencha seus dados para acessar o portal</p>
      </header>

      <form onSubmit={onSubmit} className="auth-form">
        <label className="auth-field">
          <span>Nome</span>
          <input name="name" placeholder="Seu nome" autoComplete="name" required />
        </label>
        <label className="auth-field">
          <span>E-mail</span>
          <input
            name="email"
            type="email"
            placeholder="exemplo@mail.com"
            autoComplete="email"
            required
          />
        </label>
        <label className="auth-field">
          <span>Senha</span>
          <input
            name="password"
            type="password"
            placeholder="Crie uma senha"
            autoComplete="new-password"
            required
          />
        </label>
        <label className="auth-field">
          <span>Confirmação da senha</span>
          <input
            name="passwordConfirm"
            type="password"
            placeholder="Repita sua senha"
            autoComplete="new-password"
            required
          />
        </label>

        {error && <p className="auth-message" role="alert">{error}</p>}

        <button className="auth-button auth-button-primary" type="submit" disabled={isLoading}>
          {isLoading ? "Cadastrando..." : "Cadastrar"}
        </button>
      </form>

      <Link className="auth-back-link" to="/">
        Já tenho uma conta
      </Link>
    </section>
  );
}
