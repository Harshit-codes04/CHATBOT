import { v } from "convex/values";
import { query, mutation, internalAction, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";
import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: process.env.CONVEX_OPENAI_BASE_URL,
  apiKey: process.env.CONVEX_OPENAI_API_KEY,
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }
    
    return await ctx.db
      .query("messages")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("asc")
      .collect();
  },
});

export const send = mutation({
  args: { content: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Store user message
    await ctx.db.insert("messages", {
      content: args.content,
      isUser: true,
      userId,
    });

    // Schedule AI response
    await ctx.scheduler.runAfter(0, internal.messages.generateResponse, {
      userMessage: args.content,
      userId,
    });
  },
});

export const generateResponse = internalAction({
  args: { 
    userMessage: v.string(),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4.1-nano",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant. Keep your responses concise and friendly."
          },
          {
            role: "user",
            content: args.userMessage
          }
        ],
        max_tokens: 150,
      });

      const aiResponse = response.choices[0].message.content || "I'm sorry, I couldn't generate a response.";

      // Store AI response
      await ctx.runMutation(internal.messages.storeAiResponse, {
        content: aiResponse,
        userId: args.userId,
      });
    } catch (error) {
      console.error("Error generating AI response:", error);
      await ctx.runMutation(internal.messages.storeAiResponse, {
        content: "I'm sorry, I'm having trouble responding right now. Please try again.",
        userId: args.userId,
      });
    }
  },
});

export const storeAiResponse = internalMutation({
  args: { 
    content: v.string(),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("messages", {
      content: args.content,
      isUser: false,
      userId: args.userId,
    });
  },
});
