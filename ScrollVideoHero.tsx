import { useEffect, useRef } from "react";

const FRAME_COUNT = 192;
// Parte final do scroll em que o último quadro fica parado antes de a página seguir.
const END_HOLD = 0.05;

// BASE_URL acompanha o endereço do GitHub Pages (ex.: /nome-do-repositorio/)
const framePath = (i: number) =>
  `${import.meta.env.BASE_URL}hero-frames/f_${String(i + 1).padStart(4, "0")}.webp`;

type Props = {
  /** Quantas telas de scroll o vídeo ocupa. Maior = vídeo mais lento. */
  scrollScreens?: number;
};

export default function ScrollVideoHero({ scrollScreens = 4 }: Props) {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    const hint = hintRef.current;
    const ctx = canvas?.getContext("2d");
    if (!section || !stage || !canvas || !hint || !ctx) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const frames: HTMLImageElement[] = [];
    const loaded: boolean[] = new Array(FRAME_COUNT).fill(false);

    let target = 0; // quadro alvo definido pelo scroll
    let current = 0; // quadro exibido (suavizado)
    let drawn = -1;
    let raf = 0;
    let running = false;
    let w = 0;
    let h = 0;

    const draw = (index: number) => {
      // Se o quadro ainda não carregou, usa o mais próximo já carregado.
      let i = index;
      while (i >= 0 && !loaded[i]) i--;
      if (i < 0) {
        i = index;
        while (i < FRAME_COUNT && !loaded[i]) i++;
      }
      const img = frames[i];
      if (!img || !loaded[i]) return;

      const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
      const dw = img.naturalWidth * scale;
      const dh = img.naturalHeight * scale;
      ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
      drawn = index;
    };

    const tick = () => {
      current += (target - current) * (reduceMotion ? 1 : 0.14);
      if (Math.abs(target - current) < 0.01) current = target;

      const idx = Math.round(current);
      if (idx !== drawn) draw(idx);

      if (current === target) {
        running = false;
        return;
      }
      raf = requestAnimationFrame(tick);
    };

    const kick = () => {
      if (running) return;
      running = true;
      raf = requestAnimationFrame(tick);
    };

    const onScroll = () => {
      const rect = section.getBoundingClientRect();
      const total = section.offsetHeight - stage.offsetHeight;
      const p = total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 0;
      const videoP = Math.min(1, p / (1 - END_HOLD));
      target = videoP * (FRAME_COUNT - 1);
      // O texto "Role a página" some assim que a pessoa começa a rolar.
      hint.style.opacity = String(Math.max(0, 1 - p * 30));
      kick();
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = stage.clientWidth;
      h = stage.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawn = -1;
      draw(Math.round(current));
    };

    // Carrega os quadros (o primeiro já aparece assim que chega).
    for (let i = 0; i < FRAME_COUNT; i++) {
      const img = new Image();
      img.decoding = "async";
      img.onload = () => {
        loaded[i] = true;
        drawn = -1;
        kick();
      };
      img.src = framePath(i);
      frames.push(img);
    }

    resize();
    onScroll();
    current = target; // se a página abrir já rolada, não anima de volta ao zero

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", resize);
      frames.forEach((img) => {
        img.onload = null;
      });
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      aria-label="Apresentação da N2 Calistenia"
      className="relative bg-[#0C0D10]"
      style={{ height: `${(scrollScreens + 1) * 100}svh` }}
    >
      <div ref={stageRef} className="sticky top-0 h-svh w-full overflow-hidden">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full"
          aria-hidden="true"
        />

        {/* Funde a base do vídeo com a cor da próxima seção */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-56 bg-linear-to-t from-[#0C0D10] to-transparent" />

        <div
          ref={hintRef}
          className="pointer-events-none absolute inset-x-0 bottom-10 flex flex-col items-center gap-3"
        >
          <span className="text-base font-medium text-[#F5F6F8]">
            Role a página
          </span>
          <span className="relative block h-10 w-px overflow-hidden bg-white/25">
            <span className="animate-scroll-hint absolute inset-x-0 top-0 h-1/2 bg-[#FACC15]" />
          </span>
        </div>
      </div>
    </section>
  );
}
