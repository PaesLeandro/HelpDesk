import { hash } from "bcrypt"
import { PrismaClient, UserRole } from "@prisma/client"

const password = process.env.DEMO_PASSWORD
if (!password || password.length < 8) {
  throw new Error("Defina DEMO_PASSWORD com ao menos 8 caracteres para criar as contas de demonstração")
}

const prisma = new PrismaClient()

async function main() {
  const passwordHash = await hash(password!, 8)
  const accounts = [
    { name: "Usuário Admin", email: "admin@helpdesk.local", role: UserRole.admin, availability: "[]" },
    { name: "Técnico 1", email: "tecnico1@helpdesk.local", role: UserRole.technician, availability: JSON.stringify(["08:00", "09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00"]) },
    { name: "Técnico 2", email: "tecnico2@helpdesk.local", role: UserRole.technician, availability: JSON.stringify(["10:00", "11:00", "12:00", "13:00", "16:00", "17:00", "18:00", "19:00"]) },
    { name: "Técnico 3", email: "tecnico3@helpdesk.local", role: UserRole.technician, availability: JSON.stringify(["12:00", "13:00", "14:00", "15:00", "18:00", "19:00", "20:00", "21:00"]) },
    { name: "Usuário Cliente", email: "cliente@helpdesk.local", role: UserRole.client, availability: "[]" },
  ]

  for (const account of accounts) {
    await prisma.user.upsert({
      where: { email: account.email },
      update: { name: account.name, role: account.role, password: passwordHash, availability: account.availability },
      create: { ...account, password: passwordHash },
    })
  }

  const services = [
    { title: "Instalação de Rede", price: 180 },
    { title: "Recuperação de Dados", price: 200 },
    { title: "Manutenção de Hardware", price: 150 },
    { title: "Suporte de Software", price: 200 },
    { title: "Suporte a Impressoras", price: 120 },
  ]

  for (const service of services) {
    await prisma.service.upsert({
      where: { title: service.title },
      update: {},
      create: service,
    })
  }

  if ((await prisma.ticket.count()) === 0) {
    const client = await prisma.user.findUniqueOrThrow({ where: { email: "cliente@helpdesk.local" } })
    const technician = await prisma.user.findUniqueOrThrow({ where: { email: "tecnico1@helpdesk.local" } })
    const network = await prisma.service.findUniqueOrThrow({ where: { title: "Instalação de Rede" } })
    const data = await prisma.service.findUniqueOrThrow({ where: { title: "Recuperação de Dados" } })
    const hardware = await prisma.service.findUniqueOrThrow({ where: { title: "Manutenção de Hardware" } })
    const software = await prisma.service.findUniqueOrThrow({ where: { title: "Suporte de Software" } })

    await prisma.ticket.createMany({ data: [
      { title: "Rede lenta", description: "A conexão da rede está lenta durante o trabalho.", amount: network.price, serviceId: network.id, clientId: client.id, technicianId: technician.id, status: "in_progress" },
      { title: "Backup não está funcionando", description: "Não consigo concluir o backup dos arquivos.", amount: data.price, serviceId: data.id, clientId: client.id, status: "open" },
      { title: "Computador não liga", description: "O computador não inicia ao pressionar o botão.", amount: hardware.price, serviceId: hardware.id, clientId: client.id, status: "open" },
      { title: "Instalação de software de gestão", description: "Preciso instalar o software de gestão na estação.", amount: software.price, serviceId: software.id, clientId: client.id, technicianId: technician.id, status: "closed" },
    ] })
  }

  console.log("Dados de demonstração criados. Contas: admin@helpdesk.local, tecnico@helpdesk.local e cliente@helpdesk.local")
}

main().finally(() => prisma.$disconnect())
