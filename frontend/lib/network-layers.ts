export type ProtocolRef = {
  name: string;
  ports: string;
  note: string;
};

export type LayerLesson = {
  id: string;
  model: "osi" | "tcp";
  name: string;
  nameSi: string;
  pdu: string;
  functionSi: string;
  encapsulationSi: string;
  hardwareSi: string;
  protocols: ProtocolRef[];
  analogySi: string;
};

export const OSI_STACK = [
  { id: "osi-7", name: "Application", tcp: "tcp-app" },
  { id: "osi-6", name: "Presentation", tcp: "tcp-app" },
  { id: "osi-5", name: "Session", tcp: "tcp-app" },
  { id: "osi-4", name: "Transport", tcp: "tcp-trans" },
  { id: "osi-3", name: "Network", tcp: "tcp-inet" },
  { id: "osi-2", name: "Data Link", tcp: "tcp-access" },
  { id: "osi-1", name: "Physical", tcp: "tcp-access" },
] as const;

export const TCP_STACK = [
  { id: "tcp-app", name: "Application", osi: ["osi-7", "osi-6", "osi-5"] },
  { id: "tcp-trans", name: "Transport", osi: ["osi-4"] },
  { id: "tcp-inet", name: "Internet", osi: ["osi-3"] },
  { id: "tcp-access", name: "Network Access", osi: ["osi-2", "osi-1"] },
] as const;

export const LAYER_LESSONS: Record<string, LayerLesson> = {
  "osi-7": {
    id: "osi-7",
    model: "osi",
    name: "Application",
    nameSi: "භාවිත ස්ථරය",
    pdu: "Data",
    functionSi:
      "පරිශීලක යෙදුම්වලට ජාල සේවා ලබා දෙයි. වෙබ්, ඊමේල්, ගොනු හුවමාරුව මෙහිදී ආරම්භ වේ. මෙය OSI හි ඉහළම ස්ථරයයි.",
    encapsulationSi:
      "මෙහිදී තවමත් 'header එකක්' නැත — පණිවිඩය **Data** ලෙස යටින් ස්ථරයට යයි. Encapsulation පහළට යන විට headers එකතු වේ.",
    hardwareSi:
      "විශේෂිත ජාල උපකරණයක් නැත. Host එකේ යෙදුම් (browser, mail client) මෙහි ක්‍රියා කරයි.",
    protocols: [
      { name: "HTTP", ports: "TCP 80", note: "සාමාන්‍ය වෙබ් පිටු" },
      { name: "HTTPS", ports: "TCP 443", note: "TLS සමඟ සුරක්ෂිත වෙබ්" },
      { name: "DNS", ports: "UDP/TCP 53", note: "නම් → IP පරිවර්තනය" },
      { name: "SMTP", ports: "TCP 25 / 587", note: "ඊමේල් යැවීම" },
      { name: "IMAP", ports: "TCP 143 / 993", note: "ඊමේල් කියවීම" },
      { name: "FTP", ports: "TCP 21", note: "ගොනු හුවමාරුව" },
      { name: "SSH", ports: "TCP 22", note: "සුරක්ෂිත remote login" },
    ],
    analogySi:
      "ලිපියේ **ඇතුළත ලියූ පණිවිඩය** මෙයයි — ඔබ කියන්නට ඕනෑ දේ. ලියුම් කවරය තවමත් නැත.",
  },
  "osi-6": {
    id: "osi-6",
    model: "osi",
    name: "Presentation",
    nameSi: "ඉදිරිපත් කිරීමේ ස්ථරය",
    pdu: "Data",
    functionSi:
      "දත්ත **format**, **compression**, සහ **encryption/decryption** කරයි. විවිධ පද්ධතිවලට එකම අර්ථය තේරෙන්නට භාෂාව පරිවර්තනය කරයි.",
    encapsulationSi:
      "ASCII, JPEG, MPEG, TLS වැනි කේතනයෙන් Data සූදානම් කර Session/Transport වෙත යවයි.",
    hardwareSi: "Host මෘදුකාංග (codec, TLS library). වෙනම box එකක් නැත.",
    protocols: [
      { name: "TLS/SSL", ports: "බොහෝ විට 443 සමඟ", note: "සංකේතනය" },
      { name: "JPEG / MPEG / ASCII", ports: "—", note: "ආකෘති ප්‍රමිති" },
    ],
    analogySi:
      "ලිපිය **පරිවර්තනය / රහස් කේතයෙන්** ලියනවා වැනිය. තැපැල්කරුට නොතේරෙන භාෂාවකින් ලියුවත් ලබන්නාට තේරේ.",
  },
  "osi-5": {
    id: "osi-5",
    model: "osi",
    name: "Session",
    nameSi: "සැසි ස්ථරය",
    pdu: "Data",
    functionSi:
      "host දෙකක් අතර **සංවාදයක්** ආරම්භ කර, පවත්වාගෙන, අවසන් කරයි. Dialog control සහ synchronization checkpoints.",
    encapsulationSi: "Session තොරතුරු සමඟ Data යටට යයි. TCP/IP හිදී මෙය Application තුළට බහාලයි.",
    hardwareSi: "Host මෘදුකාංග. වෙනම ජාල උපකරණයක් නැත.",
    protocols: [
      { name: "NetBIOS / RPC", ports: "විවිධ", note: "සැසි / ක්‍රියා පටිපාටි ඇමතුම්" },
      { name: "SIP", ports: "TCP/UDP 5060", note: "හඬ/වීඩියෝ සැසි" },
    ],
    analogySi:
      "දුරකථන ඇමතුමක් **connect → කතාව → hang up** කරනවා වැනිය. ලිපි ගණනාවක් එකම ලිපිනයට අනුපිළිවෙලින් යැවීමේ 'සංවාදය'.",
  },
  "osi-4": {
    id: "osi-4",
    model: "osi",
    name: "Transport",
    nameSi: "ප්‍රවාහන ස්ථරය",
    pdu: "Segment (TCP) / Datagram (UDP)",
    functionSi:
      "අන්තිමේ සිට අන්තිමට (end-to-end) බෙදාහැරීම. **Port numbers** මගින් යෙදුම තෝරයි. TCP reliable + ordered; UDP වේගවත්, connectionless.",
    encapsulationSi:
      "Data වලට **TCP/UDP header** (source/destination port, sequence…) යොදා **Segment** සාදයි.",
    hardwareSi: "Host TCP/IP stack. Firewalls මෙහි ports filter කරයි. Routers මෙම header බලා routing නොකරයි.",
    protocols: [
      { name: "TCP", ports: "connection-oriented", note: "3-way handshake, ACK" },
      { name: "UDP", ports: "connectionless", note: "DNS, video, games" },
      { name: "HTTP", ports: "80", note: "TCP මත" },
      { name: "HTTPS", ports: "443", note: "TCP මත" },
      { name: "DNS", ports: "53", note: "බොහෝ විට UDP" },
      { name: "DHCP", ports: "67 (server), 68 (client)", note: "UDP" },
    ],
    analogySi:
      "ලිපිය **පටි ගහන / tracking number** දෙන තැපැල් සේවාවක් වැනිය. TCP = registered post (ලැබුණු බව දැනේ). UDP = සාමාන්‍ය ලියුම (වේගයි, guarantee නැත).",
  },
  "osi-3": {
    id: "osi-3",
    model: "osi",
    name: "Network",
    nameSi: "ජාල ස්ථරය",
    pdu: "Packet",
    functionSi:
      "**Logical addressing (IP)** සහ **routing**. විවිධ ජාල හරහා හොඳම මාර්ගය තෝරයි. Subnetting මෙහිදී අත්‍යවශ්‍යයි.",
    encapsulationSi:
      "Segment එකට **IP header** (source IP, destination IP, TTL…) යොදා **Packet** සාදයි.",
    hardwareSi: "**Router**, Layer-3 switch. ගෙදර router එක මෙම ස්ථරයේදී WAN වෙත packet යවයි.",
    protocols: [
      { name: "IPv4 / IPv6", ports: "—", note: "ලිපිනකරණය" },
      { name: "ICMP", ports: "—", note: "ping, Destination Unreachable" },
      { name: "OSPF / BGP", ports: "—", note: "routing protocols" },
    ],
    analogySi:
      "ලියුම් කවරයේ **නගරය + තැපැල් කේතය** වැනිය. තැපැල් කාර්යාල (routers) කවරය බලා ඊළඟ කාර්යාලයට යවයි — ඇතුළත ලියුම නොකියවයි.",
  },
  "osi-2": {
    id: "osi-2",
    model: "osi",
    name: "Data Link",
    nameSi: "දත්ත සම්බන්ධක ස්ථරය",
    pdu: "Frame",
    functionSi:
      "එකම භෞතික සබැඳියේ (LAN) node දෙකක් අතර විශ්වාසදායක බෙදාහැරීම. **MAC addresses**, error detection (FCS/CRC).",
    encapsulationSi:
      "Packet එකට **Ethernet header** (src/dst MAC) සහ trailer යොදා **Frame** සාදයි.",
    hardwareSi: "**Switch** (MAC table), NIC, Wi-Fi AP. Hub එකක් collision domain එකක් — අද කලාතුරකින්.",
    protocols: [
      { name: "Ethernet (IEEE 802.3)", ports: "—", note: "wired LAN" },
      { name: "Wi-Fi (IEEE 802.11)", ports: "—", note: "wireless LAN" },
      { name: "PPP / ARP", ports: "—", note: "ARP: IP → MAC" },
    ],
    analogySi:
      "එම වීදියේදී ලිපිය **අතින් ගෙයින් ගෙට** දෙනවා වැනිය. MAC යනු ගේ බිත්තියේ ඇති නිශ්චිත නාම පුවරුවයි.",
  },
  "osi-1": {
    id: "osi-1",
    model: "osi",
    name: "Physical",
    nameSi: "භෞතික ස්ථරය",
    pdu: "Bits",
    functionSi:
      "Bits විදුලි සංඥා, ආලෝකය, හෝ රේඩියෝ තරංග ලෙස මාධ්‍යයේ යවයි. Voltage, connector, frequency.",
    encapsulationSi:
      "Frame එක **Bits** ලෙස encode කරයි. Header එකක් නැත — භෞතික සංඥා පමණි.",
    hardwareSi: "**Hub**, repeater, cable (UTP, fibre), radio, NIC transceivers.",
    protocols: [
      { name: "1000BASE-T / 10GBASE-SR", ports: "—", note: "physical Ethernet media" },
      { name: "USB / Bluetooth PHY", ports: "—", note: "භෞතික ප්‍රමිති" },
    ],
    analogySi:
      "ලිපිය **ට්‍රක් එකේ / කුරියර් බයික් එකේ** යන භෞතික ගමනයි. මාර්ගය කුමක්ද (කේබල්ද Wi-Fi ද) මෙහිදී තීරණය වේ.",
  },
  "tcp-app": {
    id: "tcp-app",
    model: "tcp",
    name: "Application",
    nameSi: "TCP/IP භාවිත ස්ථරය",
    pdu: "Data",
    functionSi:
      "OSI Application + Presentation + Session තුන **එකට**. යෙදුම, ආකෘතිය, සැසිය — සියල්ල මෙහි.",
    encapsulationSi: "යෙදුම් දත්ත Transport වෙත යයි. HTTP, DNS, SMTP මෙහිදී ක්‍රියා කරයි.",
    hardwareSi: "End hosts. OSI 7/6/5 හා සමාන.",
    protocols: [
      { name: "HTTP / HTTPS", ports: "80 / 443", note: "වෙබ්" },
      { name: "DNS", ports: "53", note: "නම් විසඳීම" },
      { name: "SMTP / IMAP", ports: "25, 587 / 143, 993", note: "ඊමේල්" },
    ],
    analogySi:
      "ලිපිය ලිවීම + භාෂාව තේරීම + සංවාදය පවත්වාගැනීම — තැපැල් කාර්යාලයට භාර දෙන තෙක් සියල්ල.",
  },
  "tcp-trans": {
    id: "tcp-trans",
    model: "tcp",
    name: "Transport",
    nameSi: "TCP/IP ප්‍රවාහන ස්ථරය",
    pdu: "Segment / Datagram",
    functionSi: "OSI Transport හා **සෘජුවම ගැලපේ**. Ports, TCP, UDP.",
    encapsulationSi: "TCP/UDP header යොදා Segment/Datagram.",
    hardwareSi: "Host stack, transport firewalls.",
    protocols: [
      { name: "TCP", ports: "80, 443, 22, 25, …", note: "reliable" },
      { name: "UDP", ports: "53, 67, 68, …", note: "fast" },
    ],
    analogySi: "Registered post vs සාමාන්‍ය ලියුම — OSI 4 උපමාවම මෙහිදීත් වලංගුයි.",
  },
  "tcp-inet": {
    id: "tcp-inet",
    model: "tcp",
    name: "Internet",
    nameSi: "TCP/IP අන්තර්ජාල ස්ථරය",
    pdu: "Packet",
    functionSi: "OSI Network හා ගැලපේ. IP routing, ICMP.",
    encapsulationSi: "IP header → Packet.",
    hardwareSi: "**Routers**.",
    protocols: [
      { name: "IPv4 / IPv6", ports: "—", note: "logical address" },
      { name: "ICMP", ports: "—", note: "ping" },
    ],
    analogySi: "ලියුම් කවරයේ නගර ලිපිනය — තැපැල් කාර්යාල මාර්ගගත කිරීම.",
  },
  "tcp-access": {
    id: "tcp-access",
    model: "tcp",
    name: "Network Access",
    nameSi: "TCP/IP ජාල පිවිසුම් ස්ථරය",
    pdu: "Frame + Bits",
    functionSi: "OSI Data Link + Physical **එකට**. LAN බෙදාහැරීම සහ භෞතික bits.",
    encapsulationSi: "Ethernet frame, පසුව bits on the wire.",
    hardwareSi: "**Switch, NIC, hub, cable, Wi-Fi AP**.",
    protocols: [
      { name: "Ethernet", ports: "—", note: "frames / MAC" },
      { name: "Wi-Fi 802.11", ports: "—", note: "wireless" },
    ],
    analogySi: "වීදියේ අතින් දීම + ට්‍රක් එකේ ගමන — අවසාන mile එක.",
  },
};

export function getLayerLesson(id: string): LayerLesson | undefined {
  return LAYER_LESSONS[id];
}

export function flattenLayerLesson(lesson: LayerLesson): string {
  const protocols = lesson.protocols
    .map((item) => `${item.name} (${item.ports}) — ${item.note}`)
    .join("\n");
  return [
    `${lesson.model.toUpperCase()} ${lesson.name} / ${lesson.nameSi}`,
    `PDU (data unit): ${lesson.pdu}`,
    `Function: ${lesson.functionSi}`,
    `Encapsulation: ${lesson.encapsulationSi}`,
    `Hardware: ${lesson.hardwareSi}`,
    `Protocols and ports:\n${protocols}`,
    `Analogy: ${lesson.analogySi}`,
  ].join("\n");
}
