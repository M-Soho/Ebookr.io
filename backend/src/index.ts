import express from "express";
import cors from "cors";
import { config } from "./config.js";
import { authRouter } from "./routes/auth.routes.js";
import { contactsRouter } from "./routes/contacts.routes.js";
import { remindersRouter } from "./routes/reminders.routes.js";
import { dashboardRouter } from "./routes/dashboard.routes.js";
import { errorHandler } from "./middleware/error.js";

const app = express();

app.use(cors({ origin: config.clientOrigin }));
app.use(express.json());

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
app.use("/api/auth", authRouter);
app.use("/api/contacts", contactsRouter);
app.use("/api/reminders", remindersRouter);
app.use("/api/dashboard", dashboardRouter);

app.use(errorHandler);

app.listen(config.port, () => {
  // eslint-disable-next-line no-console
  console.log(`Ebookr API listening on http://localhost:${config.port}`);
});
