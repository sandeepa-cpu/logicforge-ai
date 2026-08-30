"use client";

import type { KeyboardEvent } from "react";

import { APP_TABS, type AppTabId } from "@/lib/app-tabs";
import "./Navbar.css";

type NavbarProps = {
  activeTab: AppTabId;
  onTabChange: (tab: AppTabId) => void;
};

export default function Navbar({ activeTab, onTabChange }: NavbarProps) {
  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const current = APP_TABS.findIndex((tab) => tab.id === activeTab);
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      event.preventDefault();
      const delta = event.key === "ArrowRight" ? 1 : -1;
      const next = APP_TABS[(current + delta + APP_TABS.length) % APP_TABS.length];
      if (next) {
        onTabChange(next.id);
        document.getElementById(`tab-${next.id}`)?.focus();
      }
    }
    if (event.key === "Home") {
      event.preventDefault();
      onTabChange("logic");
      document.getElementById("tab-logic")?.focus();
    }
    if (event.key === "End") {
      event.preventDefault();
      onTabChange("network");
      document.getElementById("tab-network")?.focus();
    }
  }

  return (
    <>
      <div className="app-brand-bar no-print md:hidden sticky top-0 z-[70] border-b border-[#262626] bg-[rgb(11_16_22/0.92)] px-4 py-3 backdrop-blur-xl">
        <p className="m-0 text-sm font-bold tracking-tight">LogicForge AI</p>
      </div>
      <header className="navbar no-print max-md:fixed max-md:inset-x-0 max-md:bottom-0 max-md:top-auto max-md:z-[80] max-md:border-b-0 max-md:border-t max-md:border-[#262626]">
        <div className="navbar__inner max-md:mx-auto max-md:w-full max-md:max-w-md max-md:min-h-0 max-md:flex-nowrap max-md:justify-stretch max-md:gap-1 max-md:px-2 max-md:py-2 max-md:pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          <p className="navbar__brand hidden md:block">LogicForge AI</p>
          <div
            className="navbar__tabs max-md:w-full max-md:flex-1 max-md:gap-1 max-md:border-0 max-md:bg-transparent max-md:p-0"
            role="tablist"
            aria-label="Workspace"
            onKeyDown={onKeyDown}
          >
            {APP_TABS.map((tab) => {
              const selected = tab.id === activeTab;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  id={`tab-${tab.id}`}
                  aria-selected={selected}
                  aria-controls={tab.panelId}
                  tabIndex={selected ? 0 : -1}
                  className={
                    selected
                      ? "navbar__tab is-active max-md:min-h-12 max-md:flex-1 max-md:px-4 max-md:py-3"
                      : "navbar__tab max-md:min-h-12 max-md:flex-1 max-md:px-4 max-md:py-3"
                  }
                  onClick={() => onTabChange(tab.id)}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </header>
    </>
  );
}
