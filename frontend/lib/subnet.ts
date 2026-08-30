export type SubnetResult = {
  cidr: string;
  ip: string;
  prefix: number;
  mask: string;
  wildcard: string;
  network: string;
  broadcast: string;
  firstHost: string;
  lastHost: string;
  hostCount: number;
  usableHosts: number;
  hostBits: number;
  ipBits: string;
  maskBits: string;
  networkBits: string;
  broadcastBits: string;
  wildcardBits: string;
  octets: number[];
  maskOctets: number[];
  networkOctets: number[];
  broadcastOctets: number[];
};

export function parseIPv4(ip: string): number | null {
  const parts = ip.trim().split(".");
  if (parts.length !== 4) {
    return null;
  }
  let value = 0;
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) {
      return null;
    }
    const octet = Number(part);
    if (octet > 255) {
      return null;
    }
    value = ((value << 8) + octet) >>> 0;
  }
  return value;
}

export function formatIPv4(value: number): string {
  return [24, 16, 8, 0].map((shift) => ((value >>> shift) & 255).toString()).join(".");
}

export function toBitString(value: number): string {
  return value.toString(2).padStart(32, "0");
}

export function analyzeSubnet(input: string): SubnetResult | { error: string } {
  const trimmed = input.trim();
  const match = trimmed.match(/^(\d{1,3}(?:\.\d{1,3}){3})\s*\/\s*(\d{1,2})$/);
  if (!match) {
    return { error: "Enter an IPv4 address with a prefix, for example 192.168.1.10/24." };
  }

  const ipValue = parseIPv4(match[1] ?? "");
  const prefix = Number(match[2]);
  if (ipValue === null) {
    return { error: "That IPv4 address is not valid." };
  }
  if (!Number.isInteger(prefix) || prefix < 0 || prefix > 32) {
    return { error: "Prefix must be an integer from 0 to 32." };
  }

  const mask = prefix === 0 ? 0 : ((0xffffffff << (32 - prefix)) >>> 0);
  const wildcard = (~mask) >>> 0;
  const network = (ipValue & mask) >>> 0;
  const broadcast = (network | wildcard) >>> 0;
  const hostCount = 2 ** (32 - prefix);
  const hostBits = 32 - prefix;
  const pointToPoint = prefix >= 31;

  return {
    cidr: `${formatIPv4(ipValue)}/${prefix}`,
    ip: formatIPv4(ipValue),
    prefix,
    mask: formatIPv4(mask),
    wildcard: formatIPv4(wildcard),
    network: formatIPv4(network),
    broadcast: formatIPv4(broadcast),
    firstHost: pointToPoint ? formatIPv4(network) : formatIPv4(network + 1),
    lastHost: pointToPoint ? formatIPv4(broadcast) : formatIPv4(broadcast - 1),
    hostCount,
    usableHosts: pointToPoint ? hostCount : Math.max(0, hostCount - 2),
    hostBits,
    ipBits: toBitString(ipValue),
    maskBits: toBitString(mask),
    networkBits: toBitString(network),
    broadcastBits: toBitString(broadcast),
    wildcardBits: toBitString(wildcard),
    octets: toOctets(ipValue),
    maskOctets: toOctets(mask),
    networkOctets: toOctets(network),
    broadcastOctets: toOctets(broadcast),
  };
}

export function dottedBits(bits: string): string {
  return bits.match(/.{1,8}/g)?.join(".") ?? bits;
}

export function octetBinaryWorking(value: number): { bits: string; parts: string[] } {
  const weights = [128, 64, 32, 16, 8, 4, 2, 1];
  let remaining = value;
  const used: string[] = [];
  const bits = weights.map((weight) => {
    if (remaining >= weight) {
      remaining -= weight;
      used.push(String(weight));
      return "1";
    }
    return "0";
  });
  return { bits: bits.join(""), parts: used };
}

function toOctets(value: number): number[] {
  return [24, 16, 8, 0].map((shift) => (value >>> shift) & 255);
}
