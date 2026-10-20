import { AxiosError } from "axios";

export const formatMoney = (amount: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(amount);

export const formatDate = (date: string) =>
  new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(date));

export const formatTicketNumber = (number: number) => String(number).padStart(5, "0");

export function getErrorMessage(error: unknown, fallback = "Não foi possível concluir a operação.") {
  if (error instanceof AxiosError) return error.response?.data?.message ?? fallback;
  return fallback;
}
