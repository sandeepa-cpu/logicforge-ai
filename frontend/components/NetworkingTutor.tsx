"use client";

import { useId, useMemo, useState } from "react";

import NetworkExplanation from "@/components/NetworkExplanation";
import {
  flattenLayerLesson,
  getLayerLesson,
  OSI_STACK,
  TCP_STACK,
} from "@/lib/network-layers";
import { keepInputVisible } from "@/lib/keep-input-visible";
import { analyzeSubnet } from "@/lib/subnet";
import { buildSubnetLesson, flattenSubnetLesson } from "@/lib/subnet-lesson";
import "./NetworkingTutor.css";

const DEFAULT_CIDR = "192.168.1.10/24";

export default function NetworkingTutor() {
  const cidrId = useId();
  const [cidr, setCidr] = useState(DEFAULT_CIDR);
  const [selected, setSelected] = useState<string>("osi-3");
  const subnet = useMemo(() => analyzeSubnet(cidr), [cidr]);
  const subnetOk = !("error" in subnet);
  const examSteps = subnetOk ? buildSubnetLesson(subnet) : [];
  const layer = getLayerLesson(selected);

  const osiActive = new Set<string>();
  const tcpActive = new Set<string>();
  const osiHit = OSI_STACK.find((item) => item.id === selected);
  const tcpHit = TCP_STACK.find((item) => item.id === selected);
  if (osiHit) {
    osiActive.add(osiHit.id);
    tcpActive.add(osiHit.tcp);
  }
  if (tcpHit) {
    tcpActive.add(tcpHit.id);
    for (const id of tcpHit.osi) {
      osiActive.add(id);
    }
  }

  const mappedTcp = osiHit
    ? TCP_STACK.find((item) => item.id === osiHit.tcp)
    : tcpHit;
  const mappedOsi = tcpHit
    ? OSI_STACK.filter((item) => tcpHit.osi.includes(item.id))
    : osiHit
      ? [osiHit]
      : [];

  const lessonText = [
    subnetOk ? flattenSubnetLesson(subnet) : "",
    layer ? flattenLayerLesson(layer) : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  return (
    <div className="network-tutor">
      <section className="network-card">
        <h2>IP subnet calculator</h2>
        <p className="network-card__lead">
          වලංගු CIDR එකක් දෙන්න. පහතින් A/L ලිඛිත පිළිතුරක් ලෙස binary, mask, AND, සහ 2ⁿ − 2
          සම්පූර්ණයෙන් පෙන්වයි.
        </p>
        <label className="subnet-form" htmlFor={cidrId}>
          <span>IPv4 CIDR</span>
          <input
            id={cidrId}
            value={cidr}
            spellCheck={false}
            autoComplete="off"
            inputMode="decimal"
            placeholder="192.168.1.10/24"
            className="max-md:min-h-12 max-md:w-full max-md:px-4 max-md:py-3"
            onFocus={(event) => keepInputVisible(event.currentTarget)}
            onChange={(event) => setCidr(event.target.value)}
          />
        </label>
        {"error" in subnet ? (
          <p className="subnet-error" role="status">
            {subnet.error}
          </p>
        ) : (
          <>
            <BitStrip bits={subnet.ipBits} prefix={subnet.prefix} label="Address" />
            <BitStrip bits={subnet.maskBits} prefix={subnet.prefix} label="Mask" />
            <BitStrip bits={subnet.networkBits} prefix={subnet.prefix} label="Network" />
            <dl className="subnet-grid">
              <div>
                <dt>Network</dt>
                <dd>{subnet.network}/{subnet.prefix}</dd>
              </div>
              <div>
                <dt>Broadcast</dt>
                <dd>{subnet.broadcast}</dd>
              </div>
              <div>
                <dt>Subnet mask</dt>
                <dd>{subnet.mask}</dd>
              </div>
              <div>
                <dt>Wildcard</dt>
                <dd>{subnet.wildcard}</dd>
              </div>
              <div>
                <dt>First host</dt>
                <dd>{subnet.firstHost}</dd>
              </div>
              <div>
                <dt>Last host</dt>
                <dd>{subnet.lastHost}</dd>
              </div>
              <div>
                <dt>Addresses</dt>
                <dd>{subnet.hostCount}</dd>
              </div>
              <div>
                <dt>Usable hosts</dt>
                <dd>{subnet.usableHosts}</dd>
              </div>
            </dl>
            <ol className="exam-steps" lang="si">
              {examSteps.map((step) => (
                <li key={step.title}>
                  <h3>{step.title}</h3>
                  {step.body.map((line, lineIndex) => (
                    <p key={`${step.title}-${lineIndex}`}>{renderInline(line)}</p>
                  ))}
                  {step.code ? <pre className="exam-steps__code">{step.code}</pre> : null}
                </li>
              ))}
            </ol>
          </>
        )}
      </section>

      <section className="network-card">
        <h2>OSI vs TCP/IP</h2>
        <p className="network-card__lead">
          ස්ථරයක් තෝරන්න. PDU, encapsulation, hardware, port අංක, සහ ලිපි උපමාව පෙන්වයි.
        </p>
        <p className="encap-strip" lang="si">
          Encapsulation (පහළට): <strong>Data</strong> → <strong>Segment</strong> →{" "}
          <strong>Packet</strong> → <strong>Frame</strong> → <strong>Bits</strong>
        </p>
        <div className="stack-map max-md:grid-cols-1 md:grid-cols-2">
          <div>
            <h3>OSI (7)</h3>
            <ol className="stack-map__list">
              {OSI_STACK.map((item, index) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className={osiActive.has(item.id) ? "stack-layer is-active" : "stack-layer"}
                    aria-pressed={selected === item.id}
                    onClick={() => setSelected(item.id)}
                  >
                    <span>{7 - index}</span>
                    {item.name}
                  </button>
                </li>
              ))}
            </ol>
          </div>
          <div>
            <h3>TCP/IP (4)</h3>
            <ol className="stack-map__list stack-map__list--tcp">
              {TCP_STACK.map((item) => (
                <li key={item.id} style={{ flex: item.osi.length }}>
                  <button
                    type="button"
                    className={tcpActive.has(item.id) ? "stack-layer is-active" : "stack-layer"}
                    aria-pressed={selected === item.id}
                    onClick={() => setSelected(item.id)}
                  >
                    {item.name}
                  </button>
                </li>
              ))}
            </ol>
          </div>
        </div>
        {layer ? (
          <article className="layer-dossier" lang="si">
            <p className="layer-dossier__map">
              {mappedOsi.map((item) => item.name).join(" + ") || layer.name}
              {" ↔ "}
              {mappedTcp?.name ?? "TCP/IP"}
            </p>
            <h3>
              {layer.nameSi} ({layer.name})
            </h3>
            <dl className="layer-dossier__facts">
              <div>
                <dt>PDU / data unit</dt>
                <dd>{layer.pdu}</dd>
              </div>
              <div>
                <dt>කාර්යය</dt>
                <dd>{renderInline(layer.functionSi)}</dd>
              </div>
              <div>
                <dt>Encapsulation / header</dt>
                <dd>{renderInline(layer.encapsulationSi)}</dd>
              </div>
              <div>
                <dt>Hardware</dt>
                <dd>{renderInline(layer.hardwareSi)}</dd>
              </div>
            </dl>
            <div className="protocol-table-wrap overflow-x-auto overscroll-x-contain">
              <table className="protocol-table">
                <caption>Protocols සහ port අංක</caption>
                <thead>
                  <tr>
                    <th scope="col">Protocol</th>
                    <th scope="col">Port</th>
                    <th scope="col">කාර්යය</th>
                  </tr>
                </thead>
                <tbody>
                  {layer.protocols.map((item) => (
                    <tr key={`${item.name}-${item.ports}`}>
                      <td>{item.name}</td>
                      <td>{item.ports}</td>
                      <td>{item.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="layer-dossier__analogy">
              <strong>ලිපි උපමාව.</strong> {renderInline(layer.analogySi)}
            </p>
          </article>
        ) : null}
      </section>

      <NetworkExplanation
        cidr={subnetOk ? subnet.cidr : cidr}
        subnet={subnetOk ? subnet : null}
        layerId={selected}
        layerName={layer ? `${layer.name} (${layer.nameSi})` : selected}
        lesson={lessonText}
        disabled={!subnetOk}
      />
    </div>
  );
}

function BitStrip({
  bits,
  prefix,
  label,
}: {
  bits: string;
  prefix: number;
  label: string;
}) {
  return (
    <div className="bit-strip overflow-x-auto overscroll-x-contain">
      <p>{label}</p>
      <div className="bit-strip__bits" aria-hidden="true">
        {Array.from(bits).map((bit, index) => (
          <span
            key={`${label}-${index}`}
            className={index < prefix ? "bit is-net" : "bit is-host"}
          >
            {bit}
          </span>
        ))}
      </div>
    </div>
  );
}

function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    const bold = part.match(/^\*\*([^*]+)\*\*$/);
    if (bold) {
      return <strong key={index}>{bold[1]}</strong>;
    }
    return <span key={index}>{part}</span>;
  });
}
