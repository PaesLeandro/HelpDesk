import { Router } from "express"
import { compare, hash } from "bcrypt"
import { sign } from "jsonwebtoken"
import { Prisma, TicketStatus, UserRole } from "@prisma/client"
import { z } from "zod"

import { authConfig } from "@/configs/auth"
import { prisma } from "@/database/prisma"
import { ensureAuthenticated } from "@/middlewares/ensure-authenticated"
import { verifyUserAuthorization } from "@/middlewares/verify-user-Authorization"
import { AppError } from "@/utils/AppError"

const routes = Router()

const publicUser = {
  id: true,
  name: true,
  email: true,
  role: true,
  profileImage: true,
  availability: true,
  mustChangePassword: true,
} as const

const ticketInclude = {
  service: true,
  ticketServices: { include: { service: true } },
  client: { select: publicUser },
  technician: { select: publicUser },
} as const

const userSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome"),
  email: z.string().trim().email("E-mail inválido").toLowerCase(),
  password: z.string().min(6, "A senha deve ter ao menos 6 caracteres"),
})

async function createUser(data: z.infer<typeof userSchema>, role: UserRole) {
  const existing = await prisma.user.findUnique({ where: { email: data.email } })
  if (existing) throw new AppError("Já existe um usuário com esse e-mail", 409)

  return prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: await hash(data.password, 8),
      role,
    },
    select: publicUser,
  })
}

routes.post("/users", async (request, response) => {
  const data = userSchema.parse(request.body)
  const user = await createUser(data, UserRole.client)
  response.status(201).json(user)
})

routes.post("/sessions", async (request, response) => {
  const credentials = z.object({
    email: z.string().trim().email().toLowerCase(),
    password: z.string().min(1),
  }).parse(request.body)

  const user = await prisma.user.findUnique({ where: { email: credentials.email } })
  if (!user || !(await compare(credentials.password, user.password))) {
    throw new AppError("E-mail ou senha inválidos", 401)
  }

  if (user.role !== UserRole.admin && user.role !== UserRole.technician && user.role !== UserRole.client) {
    throw new AppError("Perfil não habilitado para o HelpDesk", 403)
  }

  const token = sign({ role: user.role }, authConfig.jwt.secret, {
    subject: user.id,
    expiresIn: authConfig.jwt.expiresIn,
  })

  const { password: _password, ...userWithoutPassword } = user
  response.json({ token, user: userWithoutPassword })
})

routes.use(ensureAuthenticated)

routes.get("/me", async (request, response) => {
  const user = await prisma.user.findUnique({
    where: { id: request.user!.id },
    select: publicUser,
  })
  if (!user) throw new AppError("Usuário não encontrado", 401)
  response.json(user)
})

routes.get("/users", verifyUserAuthorization(["admin"]), async (request, response) => {
  const query = z.object({
    role: z.enum(["technician", "client"]).optional(),
  }).parse(request.query)

  const users = await prisma.user.findMany({
    where: query.role ? { role: query.role } : { role: { in: ["technician", "client"] } },
    select: publicUser,
    orderBy: { name: "asc" },
  })

  response.json(users)
})

routes.get("/technicians", async (_request, response) => {
  const technicians = await prisma.user.findMany({
    where: { role: UserRole.technician },
    select: publicUser,
    orderBy: { name: "asc" },
  })
  response.json(technicians)
})

routes.post("/users/staff", verifyUserAuthorization(["admin"]), async (request, response) => {
  const data = userSchema.extend({
    role: z.enum(["technician", "client"]),
  }).parse(request.body)
  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: await hash(data.password, 8),
      role: data.role,
      mustChangePassword: data.role === UserRole.technician,
      availability: data.role === UserRole.technician
        ? JSON.stringify(["08:00", "09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00"])
        : "[]",
    },
    select: publicUser,
  })
  response.status(201).json(user)
})

routes.patch("/users/:id", verifyUserAuthorization(["admin"]), async (request, response) => {
  const { id } = z.object({ id: z.string().uuid() }).parse(request.params)
  const data = userSchema.partial().extend({
    availability: z.array(z.string()).optional(),
  }).refine((value) => Object.keys(value).length > 0, "Informe ao menos um campo").parse(request.body)
  const user = await prisma.user.update({
    where: { id },
    data: {
      name: data.name,
      email: data.email,
      password: data.password ? await hash(data.password, 8) : undefined,
      availability: data.availability ? JSON.stringify(data.availability) : undefined,
    },
    select: publicUser,
  })
  response.json(user)
})

routes.delete("/users/:id", verifyUserAuthorization(["admin"]), async (request, response) => {
  const { id } = z.object({ id: z.string().uuid() }).parse(request.params)
  await prisma.user.delete({ where: { id } })
  response.status(204).send()
})

routes.patch("/me", async (request, response) => {
  const data = z.object({
    name: z.string().trim().min(2).optional(),
    email: z.string().trim().email().toLowerCase().optional(),
    password: z.string().min(6).optional(),
    profileImage: z.string().max(500).nullable().optional(),
  }).parse(request.body)
  const user = await prisma.user.update({
    where: { id: request.user!.id },
    data: {
      name: data.name,
      email: data.email,
      password: data.password ? await hash(data.password, 8) : undefined,
      profileImage: data.profileImage,
      mustChangePassword: data.password ? false : undefined,
    },
    select: publicUser,
  })
  response.json(user)
})

routes.get("/services", async (request, response) => {
  const services = await prisma.service.findMany({
    where: request.user?.role === "admin" ? undefined : { active: true },
    orderBy: { title: "asc" },
  })
  response.json(services)
})

const serviceSchema = z.object({
  title: z.string().trim().min(2, "Informe o título"),
  price: z.number().nonnegative("Informe um valor válido"),
  active: z.boolean().optional(),
})

routes.post("/services", verifyUserAuthorization(["admin"]), async (request, response) => {
  const data = serviceSchema.parse(request.body)
  const service = await prisma.service.create({ data })
  response.status(201).json(service)
})

routes.patch("/services/:id", verifyUserAuthorization(["admin"]), async (request, response) => {
  const { id } = z.object({ id: z.string().uuid() }).parse(request.params)
  const data = serviceSchema.partial().refine(
    (value) => Object.keys(value).length > 0,
    "Informe ao menos um campo",
  ).parse(request.body)

  const existing = await prisma.service.findUnique({ where: { id } })
  if (!existing) throw new AppError("Serviço não encontrado", 404)
  const service = await prisma.service.update({ where: { id }, data })
  response.json(service)
})

routes.get("/tickets", async (request, response) => {
  const { id, role } = request.user!
  let where: Prisma.TicketWhereInput = {}

  if (role === "client") where = { clientId: id }
  else if (role === "technician") {
    where = {
      OR: [
        { status: TicketStatus.open, technicianId: null },
        { technicianId: id },
      ],
    }
  } else if (role !== "admin") throw new AppError("Perfil não autorizado", 403)

  const tickets = await prisma.ticket.findMany({
    where,
    include: ticketInclude,
    orderBy: { updatedAt: "desc" },
  })
  response.json(tickets)
})

routes.post("/tickets", verifyUserAuthorization(["client"]), async (request, response) => {
  const data = z.object({
    title: z.string().trim().min(3, "Informe o título"),
    description: z.string().trim().min(5, "Descreva o problema"),
    serviceId: z.string().uuid(),
    technicianId: z.string().uuid().optional(),
  }).parse(request.body)

  const service = await prisma.service.findUnique({ where: { id: data.serviceId } })
  if (!service || !service.active) throw new AppError("Serviço indisponível", 400)
  if (data.technicianId) {
    const technician = await prisma.user.findFirst({ where: { id: data.technicianId, role: UserRole.technician } })
    if (!technician) throw new AppError("Técnico inválido", 400)
  }

  const ticket = await prisma.ticket.create({
    data: {
      title: data.title,
      description: data.description,
      serviceId: service.id,
      amount: service.price,
      clientId: request.user!.id,
      technicianId: data.technicianId,
      ticketServices: { create: { serviceId: service.id, price: service.price } },
    },
    include: ticketInclude,
  })

  routes.post("/tickets/:id/services", verifyUserAuthorization(["technician"]), async (request, response) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params)
    const { serviceId } = z.object({ serviceId: z.string().uuid() }).parse(request.body)
    const ticket = await prisma.ticket.findFirst({ where: { id, technicianId: request.user!.id } })
    if (!ticket) throw new AppError("Chamado não encontrado ou não atribuído a você", 404)
    const service = await prisma.service.findFirst({ where: { id: serviceId, active: true } })
    if (!service) throw new AppError("Serviço indisponível", 400)
    await prisma.ticketService.create({ data: { ticketId: id, serviceId, price: service.price } })
    const total = await prisma.ticketService.aggregate({ where: { ticketId: id }, _sum: { price: true } })
    const updated = await prisma.ticket.update({ where: { id }, data: { amount: total._sum.price ?? 0 }, include: ticketInclude })
    response.json(updated)
  })
  response.status(201).json(ticket)
})

routes.get("/tickets/:id", async (request, response) => {
  const { id } = z.object({ id: z.string().uuid() }).parse(request.params)
  const ticket = await prisma.ticket.findUnique({ where: { id }, include: ticketInclude })
  if (!ticket) throw new AppError("Chamado não encontrado", 404)

  const user = request.user!
  if (
    user.role !== "admin" &&
    !(user.role === "client" && ticket.clientId === user.id) &&
    !(user.role === "technician" && (ticket.technicianId === user.id || (ticket.status === "open" && ticket.technicianId === null)))
  ) throw new AppError("Acesso negado ao chamado", 403)

  response.json(ticket)
})

routes.post("/tickets/:id/start", verifyUserAuthorization(["technician"]), async (request, response) => {
  const { id } = z.object({ id: z.string().uuid() }).parse(request.params)
  const result = await prisma.ticket.updateMany({
    where: { id, status: TicketStatus.open, technicianId: null },
    data: { technicianId: request.user!.id, status: TicketStatus.in_progress },
  })
  if (!result.count) throw new AppError("Este chamado não está mais disponível", 409)
  const ticket = await prisma.ticket.findUnique({ where: { id }, include: ticketInclude })
  response.json(ticket)
})

routes.post("/tickets/:id/close", verifyUserAuthorization(["technician"]), async (request, response) => {
  const { id } = z.object({ id: z.string().uuid() }).parse(request.params)
  const result = await prisma.ticket.updateMany({
    where: { id, technicianId: request.user!.id, status: TicketStatus.in_progress },
    data: { status: TicketStatus.closed },
  })

  routes.patch("/tickets/:id/status", verifyUserAuthorization(["admin"]), async (request, response) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params)
    const { status } = z.object({ status: z.nativeEnum(TicketStatus) }).parse(request.body)
    const ticket = await prisma.ticket.update({ where: { id }, data: { status }, include: ticketInclude })
    response.json(ticket)
  })
  if (!result.count) throw new AppError("Chamado não pode ser encerrado", 409)
  const ticket = await prisma.ticket.findUnique({ where: { id }, include: ticketInclude })
  response.json(ticket)
})

export { routes as helpdeskRoutes }
