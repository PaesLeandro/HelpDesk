if (process.env.NODE_ENV === "production" && !process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET é obrigatório em produção")
}

export const authConfig = {
  jwt: {
    secret: process.env.JWT_SECRET ?? "helpdesk-local-development-only",
    expiresIn: "1d",
  },
}
