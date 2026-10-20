import { Router } from "express"
import { helpdeskRoutes } from "./helpdesk-routes"
import { uploadsRoutes } from "./uploads-routes"

const routes = Router()

routes.get("/health", (_request, response) => {
  response.json({ status: "ok", message: "API HelpDesk ativa" })
})
routes.use(helpdeskRoutes)
routes.use("/uploads", uploadsRoutes)

export { routes }
