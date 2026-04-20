"use client";
import TodoList from "./TodoList";
export default function ClientTasks({ clientId }: { clientId: number }) {
  return <TodoList clientId={clientId} />;
}
