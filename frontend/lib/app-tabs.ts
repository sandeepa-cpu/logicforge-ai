export const APP_TABS = [
  { id: "logic", label: "Logic & Circuits", panelId: "panel-logic" },
  { id: "network", label: "Networking Tutor", panelId: "panel-network" },
] as const;

export type AppTabId = (typeof APP_TABS)[number]["id"];
