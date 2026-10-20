export type UserRole = "admin" | "technician" | "client";
export type TicketStatus = "open" | "in_progress" | "closed";

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  profileImage?: string | null;
  availability?: string;
  mustChangePassword?: boolean;
};

export type Session = {
  token: string;
  user: User;
};

export type Service = {
  id: string;
  title: string;
  price: number;
  active: boolean;
};

export type Ticket = {
  id: string;
  number: number;
  title: string;
  description: string;
  status: TicketStatus;
  amount: number;
  serviceId: string;
  service: Service;
  clientId: string;
  client: User;
  technicianId: string | null;
  technician: User | null;
  createdAt: string;
  updatedAt: string;
  ticketServices?: Array<{ id: string; price: number; service: Service }>;
};
