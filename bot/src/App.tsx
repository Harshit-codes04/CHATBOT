import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { ChatBot } from "./ChatBot";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm h-16 flex justify-between items-center border-b shadow-sm px-4">
        <h2 className="text-xl font-semibold text-primary">AI Chatbot</h2>
        <SignOutButton />
      </header>
      <main className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-4xl mx-auto">
          <Content />
        </div>
      </main>
      <Toaster />
    </div>
  );
}

function Content() {
  const loggedInUser = useQuery(api.auth.loggedInUser);

  if (loggedInUser === undefined) {
    return (
      <div className="flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-section">
      <Authenticated>
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-primary mb-2">Chat with AI</h1>
          <p className="text-lg text-secondary">
            Welcome back, {loggedInUser?.email ?? "friend"}! Ask me anything.
          </p>
        </div>
        <ChatBot />
      </Authenticated>

      <Unauthenticated>
        <div className="text-center">
          <h1 className="text-5xl font-bold text-primary mb-4">AI Chatbot</h1>
          <p className="text-xl text-secondary mb-8">Sign in to start chatting</p>
          <SignInForm />
        </div>
      </Unauthenticated>
    </div>
  );
}
