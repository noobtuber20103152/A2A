import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import { A2AClient } from "@a2a-js/sdk/client";
import type {
  Message,
  MessageSendParams,
  Task,
  TaskQueryParams,
  SendMessageResponse,
  GetTaskResponse,
} from "@a2a-js/sdk";
import { v4 as uuidv4 } from "uuid";

const client = new A2AClient("http://localhost:3002"); 

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.post("/message", async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: "Missing 'prompt' in request body." });
  }

  const messageId = uuidv4();
  let taskId: string | undefined;
  try {
    const sendParams: MessageSendParams = {
      message: {
        messageId: messageId,
        role: "user",
        parts: [{ kind: "text", text: prompt }],
        kind: "message",
      },
      configuration: {
        blocking: true,
        acceptedOutputModes: ["text/plain"],
      },
    };

    const sendResponse: SendMessageResponse = await client.sendMessage(sendParams);

    if ("error" in sendResponse) {
      return res.status(500).json({ error: sendResponse.error });
    }

    const result = sendResponse.result;

    if (result.kind === "task") {
      // The agent created a task.
      const taskResult = result as Task;
      taskId = taskResult.id;
    } else if (result.kind === "message") {
      // The agent responded with a direct message.
      const messageResult = result as Message;
      return res.json({ message: messageResult.parts?.[0]?.text || "" });
    }

    // 2. If a task was created, get its status.
    if (taskId) {
      const getParams: TaskQueryParams = { id: taskId };
      const getResponse: GetTaskResponse = await client.getTask(getParams);

      if ("error" in getResponse) {
        return res.status(500).json({ error: getResponse.error });
      }

      const getTaskResult = getResponse.result;
      return res.json({
        artifact: getTaskResult.artifacts?.[0]?.parts?.[0]?.text || "",
      });
    }

    // Fallback
    return res.status(500).json({ error: "No valid response from agent." });
  } catch (error) {
    console.error("A2A Client Communication Error:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
});

const PORT = process.env.CLIENT_PORT ? parseInt(process.env.CLIENT_PORT) : 3001;
app.listen(PORT, () => {
  console.log(`A2A Client Express server running on http://localhost:${PORT}`);
});