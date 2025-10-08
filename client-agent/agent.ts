import "dotenv/config";
import { ChatOpenAI } from "@langchain/openai";
import { AgentExecutor } from "langchain/agents";
import { DynamicTool } from "langchain/tools";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { tool } from "@langchain/core/tools";
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
import { apiKey } from "./openai-api";
const model = new ChatOpenAI({
  modelName: "gpt-4o-mini",
  temperature: 0.8,
  apiKey:
   apiKey
});

async function processMessage(input: string, PORT: number) {
  const client = new A2AClient(`http://localhost:${PORT}`);
  const messageId = uuidv4();
  let taskId: string | undefined;
  try {
    const sendParams: MessageSendParams = {
      message: {
        messageId: messageId,
        role: "user",
        parts: [{ kind: "text", text: input }],
        kind: "message",
      },
      configuration: {
        blocking: true,
        acceptedOutputModes: ["text/plain"],
      },
    };

    const sendResponse: SendMessageResponse = await client.sendMessage(
      sendParams
    );
    if ("error" in sendResponse) {
      return sendResponse.error;
    }

    const result = sendResponse.result;

    if (result.kind === "task") {
      // The agent created a task.
      const taskResult = result as Task;
      taskId = taskResult.id;
    } else if (result.kind === "message") {
      // The agent responded with a direct message.
      const messageResult = result as Message;
      return messageResult.parts?.[0]?.text || "";
    }
    if (taskId) {
      const getParams: TaskQueryParams = { id: taskId };
      const getResponse: GetTaskResponse = await client.getTask(getParams);

      if ("error" in getResponse) {
        return getResponse.error;
      }

      const getTaskResult = getResponse.result;
      return getTaskResult.artifacts?.[0]?.parts?.[0]?.text || "";
    }
    return "No valid response from agent.";
  } catch (error) {
    console.error("A2A Client Communication Error:", error);
    return "Internal server error.";
  }
}
// --- TOOLS ---
const codeWriterTool = new DynamicTool({
  name: "code-writer",
  description:
    "Writes or explains code snippets in different programming languages.",
  func: async (input: string) => {
    return await processMessage(input, 3002);
  },
});

const foodOrderTool = new DynamicTool({
  name: "food-recipe-helper",
  description: "A specialized agent that can help with creating, modifying, and explaining recipes, as well as meal planning and ingredient suggestions.",
  func: async (input: string) => {
    return await processMessage(input, 3003);
  },
});

const movieBookingTool = new DynamicTool({
  name: "movie-agent",
  description: "A specialized agent that can assist users with finding movies, providing reviews and ratings, suggesting films based on preferences",
  func: async (input: string) => {
    return await processMessage(input, 3004);
  },
});


const tools = [codeWriterTool, foodOrderTool, movieBookingTool];

// --- Wrap agent creation in async function ---
const agent = createReactAgent({
  llm: model,
  tools,
});

export async function handleUserMessage(message: string): Promise<any> {
  console.log("Handling user message:", message);
  console.log("Invoking agent executor...");
  const result: any = await agent.invoke({
    messages: [
      {
        role: "user",
        content: message,
      },
    ],
  });
  const plainMessages = result.messages.map((msg) => ({
    type: msg.constructor.name, // "HumanMessage" or "AIMessage"
    id: msg.id,
    content: msg.content,
    additional_kwargs: msg.additional_kwargs,
    response_metadata: msg.response_metadata,
  }));
  let jsonContent :any= JSON.stringify(plainMessages, null, 2);
  jsonContent = JSON.parse(jsonContent);
  console.log("Agent response messages:", jsonContent);
  console.log("length:", jsonContent.length);
  return jsonContent[jsonContent.length-1]?.content;
}
