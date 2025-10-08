import express, { Request, Response } from "express";
import bodyParser from "body-parser";
import { handleUserMessage } from "./agent";
import cors from "cors";
const app = express();
app.use(bodyParser.json());
app.use(cors());
app.post("/message", async (req: Request, res: Response) => {
  try {
    const { prompt } = req.body;
    console.log("Received prompt:", prompt);
    if (!prompt) return res.status(400).json({ error: "Message is required" });
    console.log(prompt);
    const reply = await handleUserMessage(prompt);
    console.log(reply);
    res.json({ reply });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({
        error: error instanceof Error ? error.message : "Internal Server Error",
      });
  }
});

const PORT = 3001;
app.listen(PORT, () =>
  console.log(`✅ Server running on http://localhost:${PORT}`)
);
