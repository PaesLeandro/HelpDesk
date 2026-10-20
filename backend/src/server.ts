import cors from "cors";
import express from "express";

const app = express();
const port = 3333;

app.use(cors());
app.use(express.json());

app.get("/health", (_request, response) => {
  response.status(200).json({
    status: "ok",
    message: "API HelpDesk ativa",
  });
});

app.listen(port, () => {
  console.log(`API rodando em http://localhost:${port}`);
});
