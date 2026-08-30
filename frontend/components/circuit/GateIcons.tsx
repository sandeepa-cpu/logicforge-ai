import type { GateKind } from "./types";

type GateIconProps = {
  type: GateKind;
  accent: string;
};

export function GateIcon({ type, accent }: GateIconProps) {
  switch (type) {
    case "OR":
      return <OrIcon accent={accent} />;
    case "NOT":
      return <NotIcon accent={accent} />;
    case "NAND":
      return <NandIcon accent={accent} />;
    case "NOR":
      return <NorIcon accent={accent} />;
    case "XOR":
      return <XorIcon accent={accent} />;
    case "CONST":
      return <ConstIcon accent={accent} />;
    case "AND":
    default:
      return <AndIcon accent={accent} />;
  }
}

function AndIcon({ accent }: { accent: string }) {
  return (
    <svg viewBox="0 0 100 64" width="100" height="64" aria-hidden="true">
      <path
        d="M14 8 H50 C76 8 88 18 88 32 C88 46 76 56 50 56 H14 Z"
        fill={`${accent}22`}
        stroke={accent}
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function NandIcon({ accent }: { accent: string }) {
  return (
    <svg viewBox="0 0 100 64" width="100" height="64" aria-hidden="true">
      <path
        d="M10 8 H44 C68 8 78 18 78 32 C78 46 68 56 44 56 H10 Z"
        fill={`${accent}22`}
        stroke={accent}
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      <circle cx="88" cy="32" r="6" fill="#0f1419" stroke={accent} strokeWidth="2.2" />
    </svg>
  );
}

function OrIcon({ accent }: { accent: string }) {
  return (
    <svg viewBox="0 0 100 64" width="100" height="64" aria-hidden="true">
      <path
        d="M16 8 C40 10 64 16 88 32 C64 48 40 54 16 56 C30 40 30 24 16 8 Z"
        fill={`${accent}22`}
        stroke={accent}
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function NorIcon({ accent }: { accent: string }) {
  return (
    <svg viewBox="0 0 100 64" width="100" height="64" aria-hidden="true">
      <path
        d="M12 8 C34 10 56 16 76 32 C56 48 34 54 12 56 C26 40 26 24 12 8 Z"
        fill={`${accent}22`}
        stroke={accent}
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      <circle cx="86" cy="32" r="6" fill="#0f1419" stroke={accent} strokeWidth="2.2" />
    </svg>
  );
}

function XorIcon({ accent }: { accent: string }) {
  return (
    <svg viewBox="0 0 100 64" width="100" height="64" aria-hidden="true">
      <path
        d="M10 10 C22 24 22 40 10 54"
        fill="none"
        stroke={accent}
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="M22 8 C44 10 66 16 88 32 C66 48 44 54 22 56 C36 40 36 24 22 8 Z"
        fill={`${accent}22`}
        stroke={accent}
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function NotIcon({ accent }: { accent: string }) {
  return (
    <svg viewBox="0 0 100 64" width="100" height="64" aria-hidden="true">
      <polygon
        points="16,8 74,32 16,56"
        fill={`${accent}22`}
        stroke={accent}
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      <circle cx="84" cy="32" r="6" fill="#0f1419" stroke={accent} strokeWidth="2.2" />
    </svg>
  );
}

function ConstIcon({ accent }: { accent: string }) {
  return (
    <svg viewBox="0 0 100 64" width="100" height="64" aria-hidden="true">
      <rect
        x="22"
        y="14"
        width="56"
        height="36"
        rx="8"
        fill={`${accent}22`}
        stroke={accent}
        strokeWidth="2.4"
      />
    </svg>
  );
}
