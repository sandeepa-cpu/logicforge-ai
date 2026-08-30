"use client";

import NetworkingTutor from "@/components/NetworkingTutor";
import "./NetworkingModule.css";

export default function NetworkingModule() {
  return (
    <div className="network-module max-md:px-0">
      <header className="network-module__intro max-md:px-0">
        <p className="network-module__kicker">A/L ICT · Networking</p>
        <h2>Subnetting සහ OSI/TCP-IP — මුල සිට ලිඛිත පිළිතුරට</h2>
        <p>
          Binary conversions, 2ⁿ − 2, subnet mask, සහ සෑම ස්ථරයකම PDU, headers, hardware,
          port අංක, සහ ලිපි උපමාව. Gemini මගින් සිංහලෙන් පියවරෙන් පියවර විස්තර කරයි.
        </p>
      </header>
      <NetworkingTutor />
    </div>
  );
}
