import { createFileRoute } from "@tanstack/react-router";
import { Mountain } from "@/game/Mountain";

export const Route = createFileRoute("/")({
  component: Mountain,
});
