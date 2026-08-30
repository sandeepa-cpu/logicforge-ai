import {
  dottedBits,
  octetBinaryWorking,
  type SubnetResult,
} from "@/lib/subnet";

export type LessonStep = {
  title: string;
  body: string[];
  code?: string;
};

export function buildSubnetLesson(result: SubnetResult): LessonStep[] {
  const hostBits = result.hostBits;
  const total = result.hostCount;
  const usable = result.usableHosts;
  const pointToPoint = result.prefix >= 31;
  const conversions = result.octets.map((octet) => {
    const work = octetBinaryWorking(octet);
    const sum = work.parts.length > 0 ? work.parts.join(" + ") : "0";
    return `${octet} = ${sum} = ${work.bits}`;
  });
  const maskConversions = result.maskOctets.map((octet) => {
    const work = octetBinaryWorking(octet);
    return `${octet} = ${work.bits}`;
  });

  const formulaSteps = pointToPoint
    ? [
        `Host bits n = 32 − ${result.prefix} = ${hostBits}.`,
        `මුළු ලිපින ගණන = 2^n = 2^${hostBits} = ${total}.`,
        result.prefix === 32
          ? "/32 යනු එකම host එකකි. Network/Broadcast වෙන් කිරීමක් නැත. 2^n − 2 භාවිතා නොකරයි."
          : "/31 (RFC 3021) point-to-point සඳහා ය. ලිපින දෙකම hosts ලෙස යොදා ගනී. 2^n − 2 භාවිතා නොකරයි.",
      ]
    : [
        `Host bits ගණන n = 32 − prefix = 32 − ${result.prefix} = **${hostBits}**.`,
        `මුළු ලිපින = 2^n = 2^${hostBits} = **${total}**.`,
        `එම ${total} තුළ **Network address** එකක් සහ **Broadcast address** එකක් ඇත. ඒවා hosts වලට දිය නොහැක.`,
        `ප්‍රයෝජනවත් hosts = 2^n − 2 = ${total} − 2 = **${usable}**.`,
      ];

  return [
    {
      title: "1. මූලික අර්ථය (ලිපි උපමාව)",
      body: [
        `IPv4 ලිපිනයක් යනු ජාලයේ උපාංගයකට දෙන **32-bit** නිවාස ලිපිනයකි. මෙම උදාහරණය: **${result.cidr}**.`,
        "තැපැල් ලිපියක මෙන්, **Network ID** යනු නගරය/වීදිය (රවුටරය සොයන කොටස) වන අතර **Host ID** යනු ගෙදර අංකය (එම ජාලයේ උපාංගය) වේ.",
        "Prefix (CIDR) /n කියන්නේ මුල් n bits Network සඳහා රඳවා ගන්නා බවයි.",
      ],
    },
    {
      title: "2. දශම → ද්විමය (එක් එක් octet)",
      body: [
        "එක් octet එකක් 0–255 අතර වේ. Place values: **128 64 32 16 8 4 2 1**.",
        "එක් එක් අගයට එම බර ගැලපේ නම් bit එක 1, නැතිනම් 0.",
        ...conversions,
        `සම්පූර්ණ IP (binary): ${dottedBits(result.ipBits)}`,
      ],
    },
    {
      title: "3. Network bits සහ Host bits වෙන් කිරීම",
      body: [
        `Prefix = /${result.prefix} නිසා **Network bits = ${result.prefix}**, **Host bits = ${hostBits}**.`,
        `Binary IP: ${dottedBits(result.ipBits)}`,
        `මුල් ${result.prefix} bits = Network කොටස. ඉතිරි ${hostBits} bits = Host කොටස.`,
      ],
      code: splitBits(result.ipBits, result.prefix),
    },
    {
      title: "4. Subnet Mask ගණනය",
      body: [
        "Subnet Mask එකේ Network bits ට **1**, Host bits ට **0** යොදයි.",
        `මුල් ${result.prefix} එකක්, ඊළඟ ${hostBits} බින්දුවක්: ${dottedBits(result.maskBits)}`,
        ...maskConversions,
        `දශම Subnet Mask = **${result.mask}**. Wildcard (host bits 1) = **${result.wildcard}**.`,
      ],
    },
    {
      title: "5. Network Address = IP AND Mask",
      body: [
        "AND නීතිය: 1 AND 1 = 1; අනෙක් සියල්ල 0. Host bits ට mask 0 නිසා ඒවා ශුන්‍ය වේ.",
        `IP:      ${dottedBits(result.ipBits)}`,
        `Mask:    ${dottedBits(result.maskBits)}`,
        `AND:     ${dottedBits(result.networkBits)}`,
        `Network ID = **${result.network}/${result.prefix}** (මෙය ජාලයේ “වීදි නම” ය).`,
      ],
    },
    {
      title: "6. Broadcast Address",
      body: [
        "Broadcast යනු එම ජාලයේ **සෑම host එකකටම** යන ලිපිනයයි. Host bits සියල්ල 1 කරයි.",
        `Network OR Wildcard: ${dottedBits(result.broadcastBits)}`,
        `Broadcast = **${result.broadcast}**.`,
      ],
    },
    {
      title: "7. 2ⁿ − 2 සූත්‍රය",
      body: formulaSteps,
    },
    {
      title: "8. First host සහ Last host",
      body: pointToPoint
        ? [
            `මෙම prefix එකේදී first = **${result.firstHost}**, last = **${result.lastHost}**.`,
          ]
        : [
            `First host = Network + 1 = **${result.firstHost}**.`,
            `Last host = Broadcast − 1 = **${result.lastHost}**.`,
            "ලිපි උපමාව: Network යනු වීදි නාම ලෑල්ලයි, Broadcast යනු 'සියලු ගෙවල්වලට' යන දැන්වීමයි — ඒවා ගෙදර අංක නොවේ.",
          ],
    },
  ];
}

export function flattenSubnetLesson(result: SubnetResult): string {
  return buildSubnetLesson(result)
    .map((step) => {
      const lines = [step.title, ...step.body];
      if (step.code) {
        lines.push(step.code);
      }
      return lines.join("\n");
    })
    .join("\n\n");
}

function splitBits(bits: string, prefix: number): string {
  const net = bits.slice(0, prefix) || "(නැත)";
  const host = bits.slice(prefix) || "(නැත)";
  return `NET[${net}]  HOST[${host}]`;
}
