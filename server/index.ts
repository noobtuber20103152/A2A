import 'dotenv/config';
import type {
  AgentCard,
  TaskStatusUpdateEvent,
  Task,
  TaskArtifactUpdateEvent
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
import { generate } from './generateText';

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3002;

const pizzaHutAgentCard: AgentCard = {
  name: process.env.AGENT_NAME || "Pizza Hut AI Agent",
  description:
    "A specialized agent that can answer questions about Pizza Hut's menu, deals, ordering, and restaurant information.",
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
      id: "pizza_hut_menu_chat",
      name: "Pizza Hut Menu & Ordering",
      description:
        "Answer questions or chat about Pizza Hut's menu, deals, ordering process, and restaurant information.",
      tags: ["pizza", "menu", "deals", "ordering", "locations", "allergies"],
      examples: [
        "What pizzas are available at Pizza Hut?",
        "Tell me about current Pizza Hut deals.",
        "Where is the nearest Pizza Hut?",
        "Does Pizza Hut offer gluten-free options?",
        "How do I place an order for delivery?",
        "What are Pizza Hut's opening hours?",
        "Can I customize my pizza order?",
      ],
      inputModes: ["text/plain"],
      outputModes: ["text/plain"],
    },
  ],
  supportsAuthenticatedExtendedCard: false,
};

// 1. Define your agent's logic as a AgentExecutor
class MyAgentExecutor implements AgentExecutor {
  private cancelledTasks = new Set<string>();

  public cancelTask = async (
    taskId: string,
    eventBus: ExecutionEventBus
  ): Promise<void> => {
    this.cancelledTasks.add(taskId);
    // The execute loop is responsible for publishing the final state
  };

  async execute(
    requestContext: RequestContext,
    eventBus: ExecutionEventBus
  ): Promise<void> {
    const userMessage = requestContext.userMessage;
    const existingTask = requestContext.task;

    // Access the actual text content from the client message
    const messageText = userMessage.parts[0]?.kind === 'text' 
      ? userMessage.parts[0].text 
      : '';
    console.log("User message content:", messageText);

    // Determine IDs for the task and context, from requestContext.
    const taskId = requestContext.taskId;
    const contextId = requestContext.contextId;

    console.log(
      `[MyAgentExecutor] Processing message ${userMessage.messageId} for task ${taskId} (context: ${contextId})`
    );

    // 1. Publish initial Task event if it's a new task
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
        artifacts: [], // Initialize artifacts array
      };
      eventBus.publish(initialTask);
    }

    // 2. Publish "working" status update
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

    // Simulate work...
    await new Promise((resolve) => setTimeout(resolve, 1000));
    // Use fetch to call the Anthropic API with the user message, and extract the response text.
    // We'll use the Claude 3 model (e.g., claude-3-opus-20240229) for this example.
    // The API key is in process.env.ANTHROPIC_API_KEY

    // Prepare the Anthropic API request


    let prompt = basePrompt + messageText;
    const response = "Open AI response here";
    // const response = await generate(prompt);
    console.log("OpenAI response:", response);
    // Call the Anthropic API
    let anthropicResponseText = response; // Default response in case of failure
    const artifactId = `artifact-${uuidv4()}`;
    const artifactName = `Generated Code ${uuidv4().substring(0, 8)}`;

    // 3. Publish artifact update
    const artifactUpdate: TaskArtifactUpdateEvent = {
      kind: "artifact-update",
      taskId: taskId,
      contextId: contextId,
      artifact: {
        artifactId,
        name: artifactName,
        parts: [{ kind: "text", text: anthropicResponseText as string }],
      },
      append: false, // Each emission is a complete file snapshot
      lastChunk: true, // True for this file artifact
    };
    eventBus.publish(artifactUpdate);

    // 4. Publish final status update
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
  pizzaHutAgentCard,
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
  console.log(`[MyAgent] Environment: ${process.env.NODE_ENV || 'development'}`);
});