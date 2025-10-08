import "dotenv/config";
import type {
  AgentCard,
  TaskStatusUpdateEvent,
  Task,
  TaskArtifactUpdateEvent,
} from "@a2a-js/sdk";

import {
  InMemoryTaskStore,
  TaskStore,
  AgentExecutor,
  RequestContext,
  ExecutionEventBus,
  DefaultRequestHandler,
} from "@a2a-js/sdk/server";
import { A2AExpressApp } from "@a2a-js/sdk/server/express";
import { v4 as uuidv4 } from "uuid";

import express from "express";
import { basePrompt } from "./basePrompt";
import { generate } from "./generateText";

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3003;

const foodRecipeAgentCard: AgentCard = {
  name: process.env.AGENT_NAME || "Food Recipe AI Agent",
  description:
    "A specialized agent that can help with creating, modifying, and explaining recipes, as well as meal planning and ingredient suggestions.",
  url: `http://localhost:${PORT}/`,
  provider: {
    organization: process.env.AGENT_ORGANIZATION || "A2A Agents",
    url: "https://example.com/a2a-agents",
  },
  protocolVersion: "0.3.0",
  version: "0.0.2",
  capabilities: {
    streaming: true,
    pushNotifications: false,
    stateTransitionHistory: true,
  },
  securitySchemes: undefined,
  security: undefined,
  defaultInputModes: ["text/plain"],
  defaultOutputModes: ["text/plain"],
  skills: [
    {
      id: "recipe_creation_chat",
      name: "Recipe Creation & Cooking Guidance",
      description:
        "Assist with generating new recipes, modifying existing ones, suggesting ingredient substitutions, and explaining cooking steps.",
      tags: ["cooking", "recipes", "meal planning", "ingredients", "culinary"],
      examples: [
        "Create a vegan lasagna recipe with lentils instead of cheese.",
        "Suggest a quick 30-minute dinner recipe using chicken and broccoli.",
        "How can I make chocolate chip cookies gluten-free?",
        "Explain step-by-step how to bake a perfect sourdough bread.",
        "Suggest meal ideas for a low-carb breakfast plan.",
        "Replace butter with a healthier alternative in this cake recipe.",
        "Create a festive Indian dessert recipe for Diwali.",
      ],
      inputModes: ["text/plain"],
      outputModes: ["text/plain"],
    },
  ],
  supportsAuthenticatedExtendedCard: false,
};


class MyAgentExecutor implements AgentExecutor {
  private cancelledTasks = new Set<string>();

  public cancelTask = async (
    taskId: string,
    eventBus: ExecutionEventBus
  ): Promise<void> => {
    this.cancelledTasks.add(taskId);
  };

  async execute(
    requestContext: RequestContext,
    eventBus: ExecutionEventBus
  ): Promise<void> {
    const userMessage = requestContext.userMessage;
    const existingTask = requestContext.task;
    const messageText =
      userMessage.parts[0]?.kind === "text" ? userMessage.parts[0].text : "";
    console.log("User message content:", messageText);
    const taskId = requestContext.taskId;
    const contextId = requestContext.contextId;

    console.log(
      `[MyAgentExecutor] Processing message ${userMessage.messageId} for task ${taskId} (context: ${contextId})`
    );
    if (!existingTask) {
      const initialTask: Task = {
        kind: "task",
        id: taskId,
        contextId: contextId,
        status: {
          state: "submitted",
          timestamp: new Date().toISOString(),
        },
        history: [userMessage],
        metadata: userMessage.metadata,
        artifacts: [],
      };
      eventBus.publish(initialTask);
    }

    const workingStatusUpdate: TaskStatusUpdateEvent = {
      kind: "status-update",
      taskId: taskId,
      contextId: contextId,
      status: {
        state: "working",
        message: {
          kind: "message",
          role: "agent",
          messageId: uuidv4(),
          parts: [{ kind: "text", text: "Finding your movie information..." }],
          taskId: taskId,
          contextId: contextId,
        },
        timestamp: new Date().toISOString(),
      },
      final: false,
    };
    eventBus.publish(workingStatusUpdate);

    await new Promise((resolve) => setTimeout(resolve, 1000));

    let prompt = basePrompt + messageText;
    const response = await generate(prompt);
    console.log("OpenAI response:", response);
    let anthropicResponseText = response;
    const artifactId = `artifact-${uuidv4()}`;
    const artifactName = `Generated Code ${uuidv4().substring(0, 8)}`;
    const artifactUpdate: TaskArtifactUpdateEvent = {
      kind: "artifact-update",
      taskId: taskId,
      contextId: contextId,
      artifact: {
        artifactId,
        name: artifactName,
        parts: [{ kind: "text", text: anthropicResponseText as string }],
      },
      append: false,
      lastChunk: true,
    };
    eventBus.publish(artifactUpdate);
    const finalUpdate: TaskStatusUpdateEvent = {
      kind: "status-update",
      taskId: taskId,
      contextId: contextId,
      status: {
        state: "completed",
        message: {
          kind: "message",
          role: "agent",
          messageId: uuidv4(),
          taskId: taskId,
          contextId: contextId,
          parts: [],
        },
        timestamp: new Date().toISOString(),
      },
      final: true,
    };
    eventBus.publish(finalUpdate);
    eventBus.finished();
  }
}

const taskStore: TaskStore = new InMemoryTaskStore();
const agentExecutor: AgentExecutor = new MyAgentExecutor();

const requestHandler = new DefaultRequestHandler(
  foodRecipeAgentCard,
  taskStore,
  agentExecutor
);

const appBuilder = new A2AExpressApp(requestHandler);
const expressApp = appBuilder.setupRoutes(express(), "");

expressApp.listen(PORT, () => {
  console.log(
    `[MyAgent] Server using new framework started on http://localhost:${PORT}`
  );
  console.log(
    `[MyAgent] Agent Card: http://localhost:${PORT}/.well-known/agent-card.json`
  );
  console.log("[MyAgent] Press Ctrl+C to stop the server");
  console.log(
    `[MyAgent] Environment: ${process.env.NODE_ENV || "development"}`
  );
});
