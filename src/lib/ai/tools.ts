// Shared tool schema for Gemini function-calling.
// SERVER_TOOL_NAMES are executed inside the API route (DB reads).
// CLIENT_TOOL_NAMES are returned to the browser for execution against
// Zustand stores / the Leaflet map instance — the API route cannot run them.

export const CLIENT_TOOL_NAMES = new Set([
  "start_trip",
  "stop_trip",
  "set_route",
  "toggle_layer",
  "fly_to",
]);

export const SERVER_TOOL_NAMES = new Set(["get_trip_history", "search_marinas"]);

export const AI_TOOL_DECLARATIONS = [
  {
    name: "get_trip_history",
    description:
      "Fetch the user's logged boat trips, most recent first. Use for questions about past trips, distance, fuel, or dates.",
    parameters: {
      type: "object",
      properties: {
        limit: { type: "number", description: "Max trips to return, default 10" },
        since: { type: "string", description: "ISO date (YYYY-MM-DD) — only trips on/after this date" },
      },
    },
  },
  {
    name: "search_marinas",
    description: "Search known marinas by name or region.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search text, e.g. a marina or place name" },
      },
      required: ["query"],
    },
  },
  {
    name: "start_trip",
    description: "Start recording a new trip right now (manual recording).",
    parameters: { type: "object", properties: {} },
  },
  {
    name: "stop_trip",
    description: "Stop the currently recording trip and save it.",
    parameters: { type: "object", properties: {} },
  },
  {
    name: "set_route",
    description:
      "Plan a route from the boat's current position to a destination on the map. Only works when the map is open.",
    parameters: {
      type: "object",
      properties: {
        destination_lat: { type: "number" },
        destination_lon: { type: "number" },
        destination_name: { type: "string", description: "Human-readable name, for the confirmation message" },
      },
      required: ["destination_lat", "destination_lon"],
    },
  },
  {
    name: "toggle_layer",
    description: "Turn a map layer on or off.",
    parameters: {
      type: "object",
      properties: {
        layer: {
          type: "string",
          enum: ["showSeamarks", "showMarinas", "showProtected", "darkBase"],
        },
      },
      required: ["layer"],
    },
  },
  {
    name: "fly_to",
    description: "Move the map view to a specific location. Only works when the map is open.",
    parameters: {
      type: "object",
      properties: {
        lat: { type: "number" },
        lon: { type: "number" },
        zoom: { type: "number", description: "Optional zoom level, default 12" },
      },
      required: ["lat", "lon"],
    },
  },
];
