import { useEffect, useRef, useState } from "react";
import cover from "./cover.jpg";
import {
  ACCESS_CODE,
  AMAZON_URL,
  CHAPTERS,
  WHATSAPP_DISPLAY,
  bienvenida,
  chapter,
  whatsAppLink,
  type Gender,
  type Nearby,
} from "./content";
import { spawnIdFor } from "./world";

type Phase = "intro" | "play";

export function Mountain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const api = useRef<{ autopilotTo: (id: string) => void; placeAt: (id: string) => void } | null>(null);
  const audioRef = useRef<AudioContext | null>(null);
  const simRef = useRef({
    playing: false,
    locked: false,
    ix: 0,
    iy: 0,
    progress: 0,
    codeOk: false,
    gender: "mujer" as Gender,
    name: "",
    spawnId: "entrance",
  });

  const [phase, setPhase] = useState<Phase>("intro");
  const [name, setName] = useState("");
  const [gender, setGender] = useState<Gender | null>(null);
  const [progress, setProgress] = useState(0);
  const [codeOk, setCodeOk] = useState(false);
  const [hasSave, setHasSave] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [formError, setFormError] = useState("");
  const [panel, setPanel] = useState<Nearby | null>(null);
  const [nearby, setNearby] = useState<Nearby | null>(null);
  const [entry, setEntry] = useState("");
  const [wrong, setWrong] = useState(false);
  const [toast, setToast] = useState("");
  const [mapOpen, setMapOpen] = useState(false);
  const [webglError, setWebglError] = useState("");
  const [confirmReset, setConfirmReset] = useState(false);
  const sent = useRef("");

  simRef.current.playing = phase === "play";
  simRef.current.locked = panel !== null || mapOpen;
  simRef.current.progress = progress;
  simRef.current.codeOk = codeOk;
  simRef.current.gender = gender ?? "mujer";
  simRef.current.name = name;

  useEffect(() => {
    try {
      const raw = localStorage.getItem("montana-inteligente-v1");
      if (raw) {
        const saved = JSON.parse(raw) as {
          name?: string;
          gender?: Gender;
          progress?: number;
          codeOk?: boolean;
        };
        if (saved.name) setName(saved.name);
        if (saved.gender === "mujer" || saved.gender === "hombre") setGender(saved.gender);
        if (typeof saved.progress === "number") setProgress(saved.progress);
        if (saved.codeOk) setCodeOk(true);
        if (saved.name && saved.gender) setHasSave(true);
      }
    } catch {
      /* guardar es un extra, no un requisito */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (phase !== "play") return;
    localStorage.setItem(
      "montana-inteligente-v1",
      JSON.stringify({ v: 1, name, gender, progress, codeOk }),
    );
  }, [phase, name, gender, progress, codeOk]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let dead = false;
    let destroy = () => {};
    void import("./engine").then(({ createGame }) => {
      if (dead) return;
      const handle = createGame(canvas, {
        getSim: () => simRef.current,
        onNearby: (n) => setNearby(n),
        onInteract: (n) => setPanel(n),
        onFail: (message) => setWebglError(message),
      });
      api.current = handle;
      destroy = () => handle.destroy();
    });
    return () => {
      dead = true;
      destroy();
      api.current = null;
    };
  }, []);

  const nearKey = nearby
    ? nearby.kind === "cave" || nearby.kind === "false" || nearby.kind === "locked"
      ? `${nearby.kind}-${nearby.n}`
      : nearby.kind
    : "";
  const seen = useRef("");
  useEffect(() => {
    if (!nearby) {
      seen.current = "";
      return;
    }
    if (seen.current === nearKey) return;
    seen.current = nearKey;
    if (nearby.kind === "locked") return;
    if (nearby.kind === "code" && codeOk) return;
    setEntry("");
    setPanel(nearby);
    simRef.current.ix = 0;
    simRef.current.iy = 0;
  }, [nearKey, nearby, codeOk]);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(""), 4200);
    return () => window.clearTimeout(id);
  }, [toast]);

  useEffect(() => {
    if (panel?.kind !== "code" || entry.length !== 5) return;
    if (sent.current === entry) return;
    sent.current = entry;
    if (entry === ACCESS_CODE) {
      setCodeOk(true);
      simRef.current.codeOk = true;
      setPanel(null);
      setEntry("");
      setToast(`${name}, la puerta de la cueva 5 se abrió.`);
      chime(audioRef.current, 523, 659);
    } else {
      setWrong(true);
      setEntry("");
      sent.current = "";
      window.setTimeout(() => setWrong(false), 420);
      navigator.vibrate?.(30);
    }
  }, [entry, panel, name]);

  function ensureAudio() {
    if (audioRef.current) {
      void audioRef.current.resume();
      return audioRef.current;
    }
    const ctx = new AudioContext();
    audioRef.current = ctx;
    const seconds = 2;
    const buffer = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0;
    for (let i = 0; i < data.length; i++) b0 = 0.985 * b0 + (Math.random() * 2 - 1) * 0.04;
    // brown-ish noise written in a second pass so the first samples are not a spike
    b0 = 0;
    for (let i = 0; i < data.length; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.992 * b0 + white * 0.02;
      data[i] = b0 * 0.35;
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 420;
    const gain = ctx.createGain();
    gain.gain.value = 0.012;
    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    src.start();
    return ctx;
  }

  function begin(mode: "new" | "continue") {
    if (!name.trim() || !gender) {
      setFormError("Escriba su nombre y elija si recorre la montaña como mujer o como hombre.");
      return;
    }
    const clean = name.trim().slice(0, 24);
    const nextProgress = mode === "continue" ? progress : 0;
    const nextCode = mode === "continue" ? codeOk : false;
    if (mode === "new") {
      setProgress(0);
      setCodeOk(false);
    }
    setName(clean);
    setFormError("");
    setPanel(null);
    simRef.current.spawnId = spawnIdFor(nextProgress);
    simRef.current.progress = nextProgress;
    simRef.current.codeOk = nextCode;
    simRef.current.name = clean;
    simRef.current.gender = gender;
    simRef.current.playing = true;
    setPhase("play");
    ensureAudio();
  }

  function backToIntro() {
    simRef.current.playing = false;
    simRef.current.ix = 0;
    simRef.current.iy = 0;
    setPanel(null);
    setMapOpen(false);
    setPhase("intro");
    setHasSave(true);
  }

  const activeChapter = panel?.kind === "cave" ? chapter(panel.n) : panel?.kind === "false" ? chapter(panel.n) : null;

  return (
    <main className="mn">
      <canvas ref={canvasRef} className="mn-canvas" />
      {phase === "intro" ? (
        <section className="mn-intro">
          <p className="mn-kicker">Colección Nueva Economía Digital · Vol. II</p>
          <h1>La Montaña Inteligente</h1>
          <p className="mn-lead">
            Cada cueva es un capítulo de <em>Inteligencia Artificial y Activos Digitales</em>. Recorra las 13, en el
            mismo orden del libro. Hay un sendero que sigue y otro que enseña y vuelve.
          </p>
          <img src={cover} alt="Tapa del libro Inteligencia Artificial y Activos Digitales" />
          <p className="mn-authors">Sergio Alejandro Tertusio · José Gabriel Montenegro · Andrea Fabiana Iglesias</p>
          <label htmlFor="explorer-name">Su nombre</label>
          <input
            id="explorer-name"
            maxLength={24}
            autoComplete="name"
            placeholder="Cómo quiere que lo llamemos"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <p className="mn-label">¿Cómo recorre la montaña?</p>
          <div className="mn-genders">
            <button type="button" data-on={gender === "mujer"} onClick={() => setGender("mujer")}>
              <i className="mn-sil mujer" aria-hidden />
              Mujer
            </button>
            <button type="button" data-on={gender === "hombre"} onClick={() => setGender("hombre")}>
              <i className="mn-sil" aria-hidden />
              Hombre
            </button>
          </div>
          {formError ? (
            <p className="mn-error" role="alert">
              {formError}
            </p>
          ) : null}
          {hydrated && hasSave ? (
            <button type="button" className="mn-primary" onClick={() => begin("continue")}>
              Continuar, {name || "explorador"}
            </button>
          ) : (
            <button type="button" className="mn-primary" onClick={() => begin("new")}>
              Entrar a la montaña
            </button>
          )}
          {hydrated && hasSave ? (
            <button type="button" className="mn-ghost" onClick={() => (confirmReset ? resetAll() : setConfirmReset(true))}>
              {confirmReset ? "Sí, borrar el recorrido y la puerta" : "Empezar de nuevo"}
            </button>
          ) : null}
          <p className="mn-note">
            La cueva 5 pide un código de cinco dígitos. Lo entrega Sergio Tertusio por WhatsApp al {WHATSAPP_DISPLAY}.
            Sin ese código, la montaña no sigue.
          </p>
          <div className="mn-links">
            <a href={whatsAppLink(name, "book")} target="_blank" rel="noreferrer">
              WhatsApp
            </a>
            <a href={AMAZON_URL} target="_blank" rel="noreferrer">
              Amazon
            </a>
          </div>
          {webglError ? <p className="mn-error">{webglError}</p> : null}
        </section>
      ) : (
        <>
          <header className="mn-hud">
            <div>
              <strong>{name}</strong>
              <span>
                {progress >= 13 ? "Cumbre" : `Capítulo ${progress + 1} · Cueva ${progress + 1} de 13`}
              </span>
            </div>
            <ol className="mn-dots" aria-label="Cuevas">
              {CHAPTERS.map((c) => (
                <li key={c.n} data-state={progress >= c.n ? "done" : progress + 1 === c.n ? "now" : c.n === 5 && !codeOk && progress >= 4 ? "lock" : "todo"} />
              ))}
            </ol>
            <button type="button" onClick={() => setMapOpen(true)}>
              Mapa
            </button>
          </header>
          {progress < 1 && !panel ? (
            <p className="mn-coach">Joystick o WASD. Cada cueva es un capítulo del libro. El camino falso enseña y lo devuelve.</p>
          ) : null}
          {nearby?.kind === "locked" && !panel ? (
            <p className="mn-coach">Esta galería sigue cerrada. Primero comprenda la cueva en la que está.</p>
          ) : null}
          {toast ? (
            <p className="mn-toast" role="status">
              {toast}
            </p>
          ) : null}
          {!panel && !mapOpen ? (
            <Joystick
              onChange={(x, y) => {
                simRef.current.ix = x;
                simRef.current.iy = y;
              }}
            />
          ) : null}
          {nearby && !panel && nearby.kind !== "locked" ? (
            <button type="button" className="mn-read" onClick={() => setPanel(nearby)}>
              {nearby.kind === "code" ? "Abrir la puerta" : nearby.kind === "summit" ? "Mirar la cumbre" : nearby.kind === "false" ? "Leer el muro" : "Leer el capítulo"}
            </button>
          ) : null}
          {mapOpen ? (
            <section className="mn-page mn-map" role="dialog" aria-label="Mapa de cuevas">
              <h2>Trece cuevas, trece capítulos</h2>
              <p className="mn-note">Cada cueva corresponde a un capítulo del libro, en el mismo orden.</p>
              <ol>
                {CHAPTERS.map((c) => (
                  <li key={c.n} data-state={progress >= c.n ? "done" : progress + 1 === c.n ? "now" : "todo"}>
                    <span>{c.n}</span>
                    <div>
                      <strong>{c.title}</strong>
                      <small>
                        {progress >= c.n ? "Comprendida" : c.n === 5 && !codeOk && progress >= 4 ? "Pide el código" : progress + 1 === c.n ? "La que sigue" : "Cerrada"}
                      </small>
                    </div>
                  </li>
                ))}
              </ol>
              <button
                type="button"
                className="mn-primary"
                onClick={() => {
                  api.current?.placeAt(spawnIdFor(progress));
                  setMapOpen(false);
                }}
              >
                Volver al sendero
              </button>
              <button type="button" className="mn-ghost" onClick={() => setMapOpen(false)}>
                Seguir caminando
              </button>
              <button type="button" className="mn-ghost" onClick={backToIntro}>
                Salir a la entrada
              </button>
            </section>
          ) : null}
          {panel?.kind === "cave" && activeChapter ? (
            <article className="mn-page" role="dialog" aria-label={activeChapter.title}>
              <p className="mn-kicker">Cueva {activeChapter.n} · Capítulo {activeChapter.n} del libro</p>
              <h2>{activeChapter.title}</h2>
              <p className="mn-sub">{activeChapter.subtitle}</p>
              <p className="mn-note">Esta cueva es el capítulo {activeChapter.n} del libro. Lo que sigue es la idea; el capítulo completo está en la obra.</p>
              <h3>Por qué importa</h3>
              <p>
                {bienvenida(gender ?? "mujer")}, {name}. {activeChapter.importance}
              </p>
              <h3>Beneficios y ventajas</h3>
              <ul>
                {activeChapter.benefits.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
              <h3>Por qué conviene el libro</h3>
              <p>{activeChapter.book}</p>
              <h3>Para no olvidar</h3>
              <ul>
                {activeChapter.ideas.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
              <p className="mn-q">{activeChapter.question}</p>
              {activeChapter.n === 4 && progress < 4 ? (
                <p className="mn-note">
                  La puerta de la cueva 5 pide un código de cinco dígitos. Si no lo tiene, pídaselo a Sergio Tertusio
                  por WhatsApp antes de seguir.
                </p>
              ) : null}
              <div className="mn-links">
                <a href={whatsAppLink(name, "book")} target="_blank" rel="noreferrer">
                  Pedir el libro
                </a>
                <a href={AMAZON_URL} target="_blank" rel="noreferrer">
                  Ver en Amazon
                </a>
              </div>
              <button
                type="button"
                className="mn-primary"
                onClick={() => {
                  const next = activeChapter.n === progress + 1;
                  if (next) {
                    setProgress(activeChapter.n);
                    chime(audioRef.current, 494, 660);
                    if (activeChapter.n === 4) {
                      setToast("La cueva 5 está cerrada con un código. Pídaselo a Sergio por WhatsApp.");
                    }
                  }
                  setPanel(null);
                }}
              >
                {activeChapter.n === progress + 1 ? "Comprendí este capítulo" : "Cerrar"}
              </button>
            </article>
          ) : null}
          {panel?.kind === "false" && activeChapter ? (
            <article className="mn-page" role="dialog" aria-label="Camino falso">
              <p className="mn-kicker">Callejón</p>
              <h2>{activeChapter.falseTitle}</h2>
              <p>{activeChapter.falseLesson}</p>
              <p className="mn-note">No pierde lo ya recorrido. Solo regresa al cruce y elige el otro letrero.</p>
              <button
                type="button"
                className="mn-primary"
                onClick={() => {
                  simRef.current.locked = false;
                  simRef.current.ix = 0;
                  simRef.current.iy = 0;
                  setPanel(null);
                  api.current?.autopilotTo(`j-${activeChapter.n}`);
                }}
              >
                Regresar al cruce
              </button>
            </article>
          ) : null}
          {panel?.kind === "code" ? (
            <article className={`mn-page ${wrong ? "shake" : ""}`} role="dialog" aria-label="Código de la cueva 5">
              <p className="mn-kicker">Puerta de la cueva 5</p>
              <h2>Hace falta un código</h2>
              <p>
                {name}, esta puerta guarda el capítulo de los agentes con capacidad económica. El código tiene cinco
                dígitos y no está escrito en la montaña. Pídaselo a Sergio Tertusio por WhatsApp.
              </p>
              <p className="mn-phone">{WHATSAPP_DISPLAY}</p>
              <div className="mn-digits" data-wrong={wrong}>
                {Array.from({ length: 5 }, (_, i) => (
                  <span key={i}>{entry[i] ?? ""}</span>
                ))}
              </div>
              {wrong ? <p className="mn-error">Ese código no abre la cueva.</p> : null}
              <div className="mn-pad">
                {["1", "2", "3", "4", "5", "6", "7", "8", "9", "⌫", "0"].map((d) => (
                  <button
                    type="button"
                    key={d}
                    onClick={() => {
                      if (d === "⌫") {
                        sent.current = "";
                        setEntry((v) => v.slice(0, -1));
                        return;
                      }
                      setEntry((v) => (v.length >= 5 ? v : v + d));
                    }}
                  >
                    {d}
                  </button>
                ))}
              </div>
              <div className="mn-links">
                <a href={whatsAppLink(name, "code")} target="_blank" rel="noreferrer">
                  Pedir el código
                </a>
                <a href={AMAZON_URL} target="_blank" rel="noreferrer">
                  Ver en Amazon
                </a>
              </div>
              <button type="button" className="mn-ghost" onClick={() => setPanel(null)}>
                Seguir mirando los senderos
              </button>
            </article>
          ) : null}
          {panel?.kind === "summit" ? (
            <article className="mn-page" role="dialog" aria-label="Cumbre">
              <p className="mn-kicker">Cumbre</p>
              <h2>Inteligencia, valor y confianza</h2>
              <img src={cover} alt="" />
              <p>
                {bienvenida(gender ?? "mujer")}, {name}. Llegó al núcleo. La inteligencia artificial amplía la
                decisión. Los activos digitales y la tokenización amplían el valor. La confianza permite registrar,
                verificar y gobernar. Ninguna de las tres alcanza sola.
              </p>
              <p>
                La montaña es el mapa. El libro es la conversación completa: casos, preguntas para la junta, riesgos,
                cuentas y una forma de no perder a la persona en el centro.
              </p>
              <p className="mn-note">Experiencia educativa. No es asesoría legal, financiera, contable ni de inversión.</p>
              <div className="mn-links">
                <a href={whatsAppLink(name, "book")} target="_blank" rel="noreferrer">
                  Escribir a Sergio
                </a>
                <a href={AMAZON_URL} target="_blank" rel="noreferrer">
                  Conseguir el libro
                </a>
              </div>
              <button type="button" className="mn-primary" onClick={() => setPanel(null)}>
                Quedarme un momento
              </button>
            </article>
          ) : null}
        </>
      )}
    </main>
  );

  function resetAll() {
    localStorage.removeItem("montana-inteligente-v1");
    setProgress(0);
    setCodeOk(false);
    setHasSave(false);
    setConfirmReset(false);
    setGender(null);
    setName("");
  }
}

function chime(ctx: AudioContext | null, a: number, b: number) {
  if (!ctx) return;
  const now = ctx.currentTime;
  [a, b].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, now + i * 0.08);
    gain.gain.exponentialRampToValueAtTime(0.05, now + i * 0.08 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.08 + 0.45);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now + i * 0.08);
    osc.stop(now + i * 0.08 + 0.5);
  });
}

function Joystick({ onChange }: { onChange: (x: number, y: number) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });

  function point(clientX: number, clientY: number) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const max = r.width * 0.34;
    let dx = clientX - (r.left + r.width / 2);
    let dy = clientY - (r.top + r.height / 2);
    const m = Math.hypot(dx, dy);
    if (m > max && m > 0) {
      dx = (dx / m) * max;
      dy = (dy / m) * max;
    }
    setKnob({ x: dx, y: dy });
    onChange(dx / max, -dy / max);
  }

  function release() {
    setKnob({ x: 0, y: 0 });
    onChange(0, 0);
  }

  return (
    <div
      className="mn-joy"
      ref={ref}
      role="slider"
      aria-label="Moverse"
      aria-valuemin={-1}
      aria-valuemax={1}
      aria-valuenow={0}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        point(e.clientX, e.clientY);
      }}
      onPointerMove={(e) => {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) point(e.clientX, e.clientY);
      }}
      onPointerUp={release}
      onPointerCancel={release}
    >
      <span style={{ transform: `translate(${knob.x}px, ${knob.y}px)` }} />
    </div>
  );
}
