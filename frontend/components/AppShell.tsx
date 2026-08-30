"use client";

import { useState } from "react";

import LogicWorkspace from "@/components/LogicWorkspace";
import Navbar from "@/components/Navbar";
import NetworkingModule from "@/components/NetworkingModule";
import { APP_TABS, type AppTabId } from "@/lib/app-tabs";
import "./AppShell.css";

export default function AppShell() {
  const [activeTab, setActiveTab] = useState<AppTabId>("logic");

  function changeTab(tab: AppTabId) {
    setActiveTab(tab);
    if (tab === "logic") {
      window.requestAnimationFrame(() => {
        window.dispatchEvent(new Event("logicforge:fit-diagram"));
      });
    }
  }

  return (
    <div className={activeTab === "network" ? "app-root is-network" : "app-root"}>
      <Navbar activeTab={activeTab} onTabChange={changeTab} />
      <div className="app-shell">
        {APP_TABS.map((tab) => {
          const active = tab.id === activeTab;
          return (
            <div
              key={tab.id}
              id={tab.panelId}
              role="tabpanel"
              aria-labelledby={`tab-${tab.id}`}
              hidden={!active}
              inert={!active}
              className={
                active
                  ? `app-panel is-active app-panel--${tab.id}`
                  : `app-panel app-panel--${tab.id}`
              }
            >
              {tab.id === "logic" ? <LogicWorkspace /> : <NetworkingModule />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
