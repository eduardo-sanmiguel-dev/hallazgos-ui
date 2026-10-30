"use client";

import { Box } from "@mui/material";
import { keyframes, useTheme } from "@mui/material/styles";
import type { SxProps, Theme } from "@mui/material/styles";

/*
 * Ambientación del tema de Halloween: solo decoración. Nada de esto se puede
 * tocar ni enfocar (pointer-events: none, aria-hidden), no ocupa lugar en la
 * página, no se imprime y, con "reducir movimiento" del sistema, se queda
 * quieto (sin cuervos ni murciélagos volando). Cada pieza se pinta solo con
 * el tema de Halloween.
 *
 * TEMPORAL (Halloween 2026): al eliminar el tema se borra este archivo y sus
 * usos en app/(routes)/layout.tsx y app/page.tsx (ver app/seasonalTheme.ts).
 */

const useIsHalloween = () => useTheme().appTheme === "halloween";

const twinkle = keyframes`
  0%, 100% { opacity: 0.25; }
  50% { opacity: 0.95; }
`;

const flicker = keyframes`
  0%, 100% { opacity: 1; }
  20% { opacity: 0.78; }
  24% { opacity: 1; }
  55% { opacity: 0.86; }
  60% { opacity: 1; }
  80% { opacity: 0.7; }
`;

const drift = keyframes`
  from { transform: translateX(-6%); }
  to { transform: translateX(6%); }
`;

const flap = keyframes`
  from { transform: scaleY(1); }
  to { transform: scaleY(0.35); }
`;

const bob = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(14px); }
`;

// Cruza la pantalla en el primer tramo del ciclo y espera fuera de ella el
// resto: así pasan de vez en cuando, no todo el tiempo.
const flyRight = keyframes`
  0% { transform: translate(-12vw, 0); }
  28% { transform: translate(112vw, -8vh); }
  100% { transform: translate(112vw, -8vh); }
`;

const flyLeft = keyframes`
  0% { transform: translate(112vw, 0) scaleX(-1); }
  32% { transform: translate(-12vw, 6vh) scaleX(-1); }
  100% { transform: translate(-12vw, 6vh) scaleX(-1); }
`;

const orbit = keyframes`
  from { transform: rotate(0deg) translateX(26px) rotate(0deg); }
  to { transform: rotate(360deg) translateX(26px) rotate(-360deg); }
`;

// Solo se anima si el sistema no pide reducir el movimiento.
const MOTION = "@media (prefers-reduced-motion: no-preference)";
const NO_PRINT = { "@media print": { display: "none" } };

// Silueta de la noche: un tono más oscuro que el fondo del tema.
const SILHOUETTE = "#0B0712";
const STONE = "#251A34";
const PUMPKIN = "#E8650F";
const PUMPKIN_RIB = "#B9480A";
const CANDLE = "#FFD36B";

// Estrellas: [x %, y %, tamaño px, retraso s].
const STARS: [number, number, number, number][] = [
  [6, 14, 2, 0],
  [14, 32, 1.5, 1.2],
  [23, 9, 2.5, 2.4],
  [31, 24, 1.5, 0.6],
  [42, 12, 2, 3.1],
  [48, 36, 1.5, 1.8],
  [57, 18, 2, 0.3],
  [64, 7, 1.5, 2.7],
  [71, 28, 2.5, 1.1],
  [79, 15, 1.5, 3.6],
  [86, 33, 2, 0.9],
  [93, 10, 2, 2.1],
  [97, 24, 1.5, 1.5],
  [37, 42, 1.5, 2.9],
  [68, 44, 1.5, 0.4],
];

/** Calabaza con cara encendida (coordenadas del cementerio). */
function JackOLantern({
  x,
  y,
  scale = 1,
  delay = 0,
}: {
  x: number;
  y: number;
  scale?: number;
  delay?: number;
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <path
        d="M-2 -21 q2 -8 7 -9"
        stroke="#3E6B25"
        strokeWidth={3}
        fill="none"
      />
      <ellipse cx={0} cy={0} rx={24} ry={19} fill={PUMPKIN} />
      <ellipse
        cx={-10}
        cy={0}
        rx={11}
        ry={18}
        fill={PUMPKIN_RIB}
        opacity={0.55}
      />
      <ellipse
        cx={10}
        cy={0}
        rx={11}
        ry={18}
        fill={PUMPKIN_RIB}
        opacity={0.55}
      />
      <ellipse cx={0} cy={0} rx={9} ry={19} fill={PUMPKIN} />
      <Box
        component="g"
        sx={{
          fill: CANDLE,
          filter: "drop-shadow(0 0 4px rgba(255, 170, 40, 0.9))",
          [MOTION]: {
            animation: `${flicker} 2.6s ease-in-out ${delay}s infinite`,
          },
        }}
      >
        <path d="M-13 -6 l6 -8 l5 8 z" />
        <path d="M2 -6 l6 -8 l5 8 z" />
        <path d="M-15 4 q15 14 30 0 l-4 1 l-3 4 l-3 -4 l-4 4 l-4 -4 l-3 4 l-3 -4 z" />
      </Box>
    </g>
  );
}

/** Lápida redondeada con su cruz o "RIP". */
function Tombstone({
  x,
  y,
  w,
  h,
  label,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  label?: string;
}) {
  const r = w / 2;
  return (
    <g transform={`translate(${x} ${y})`}>
      <path
        d={`M0 ${h} V${r} A${r} ${r} 0 0 1 ${w} ${r} V${h} Z`}
        fill={STONE}
      />
      {label ? (
        <text
          x={r}
          y={r + 6}
          textAnchor="middle"
          fontSize={w / 3.4}
          fontWeight={700}
          fill={SILHOUETTE}
          fontFamily="Georgia, serif"
        >
          {label}
        </text>
      ) : (
        <path
          d={`M${r} ${r - 6} V${r + 14} M${r - 6} ${r + 1} H${r + 6}`}
          stroke={SILHOUETTE}
          strokeWidth={3}
        />
      )}
    </g>
  );
}

/** Cuervo posado (de perfil). */
function PerchedCrow({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`} fill={SILHOUETTE}>
      <path d="M0 0 q-3 -12 6 -16 q6 -3 9 2 l7 1 l-7 2 q2 9 -6 13 l3 7 l-2 0 l-3 -6 l-2 6 l-2 0 l2 -7 q-4 -1 -5 -2 z" />
      <path d="M-1 -2 l-12 6 l12 -2 z" />
      <circle cx={10} cy={-12} r={1.2} fill={PUMPKIN} />
    </g>
  );
}

/** Cementerio al pie de la pantalla. */
function Graveyard() {
  return (
    <Box
      component="svg"
      viewBox="0 0 1200 170"
      preserveAspectRatio="xMidYMax slice"
      sx={{
        position: "absolute",
        left: 0,
        bottom: 0,
        width: "100%",
        height: { xs: 110, md: 170 },
      }}
    >
      {/* Colinas al fondo y suelo al frente. */}
      <path
        d="M0 120 Q150 70 320 105 T650 95 T980 100 T1200 85 V170 H0 Z"
        fill="#1A1124"
      />
      {/* Árbol seco con un cuervo. */}
      <g stroke={SILHOUETTE} strokeLinecap="round" fill="none">
        <path d="M250 150 C255 115 245 95 252 60" strokeWidth={9} />
        <path d="M252 95 C230 80 215 82 200 66" strokeWidth={5} />
        <path d="M250 78 C270 64 288 66 300 52" strokeWidth={5} />
        <path d="M252 62 C246 48 240 42 236 30" strokeWidth={3.5} />
        <path
          d="M212 76 l-10 -12 M290 61 l6 -12 M226 72 l-4 8"
          strokeWidth={2.5}
        />
      </g>
      <PerchedCrow x={286} y={62} />
      {/* Reja de hierro. */}
      <g fill={SILHOUETTE}>
        <rect x={760} y={118} width={330} height={4} />
        <rect x={760} y={140} width={330} height={4} />
        {Array.from({ length: 23 }, (_, index) => {
          const x = 762 + index * 14.5;
          return (
            <g key={x}>
              <rect x={x} y={108} width={3} height={50} />
              <path d={`M${x - 2.5} 109 l4 -9 l4 9 z`} />
            </g>
          );
        })}
      </g>
      <Tombstone x={380} y={96} w={42} h={56} label="RIP" />
      <Tombstone x={440} y={112} w={30} h={42} />
      <Tombstone x={600} y={104} w={36} h={50} label="RIP" />
      <Tombstone x={1110} y={110} w={32} h={44} />
      <path
        d="M0 150 Q200 132 420 148 T840 144 T1200 146 V170 H0 Z"
        fill={SILHOUETTE}
      />
      <JackOLantern x={90} y={146} scale={1.05} />
      <JackOLantern x={150} y={154} scale={0.7} delay={0.8} />
      <JackOLantern x={530} y={150} scale={0.85} delay={1.6} />
      <JackOLantern x={1010} y={148} scale={1} delay={0.4} />
    </Box>
  );
}

/** Luna llena con brillo (solo en el login, donde no tapa nada). */
function FullMoon() {
  return (
    <Box
      sx={{
        position: "absolute",
        top: { xs: 24, sm: 40 },
        right: { xs: "6%", sm: "8%" },
        width: { xs: 70, sm: 110, md: 140 },
        aspectRatio: "1",
        borderRadius: "50%",
        background:
          "radial-gradient(circle at 36% 34%, #FFF7DE 0%, #F4DFA0 58%, #D9B866 100%)",
        boxShadow:
          "0 0 40px 10px rgba(255, 214, 120, 0.22), 0 0 140px 50px rgba(255, 122, 26, 0.1)",
        opacity: 0.85,
        "&::before, &::after": {
          content: '""',
          position: "absolute",
          borderRadius: "50%",
          backgroundColor: "rgba(120, 90, 40, 0.16)",
        },
        "&::before": { width: "22%", height: "22%", top: "26%", left: "52%" },
        "&::after": { width: "14%", height: "14%", top: "60%", left: "30%" },
      }}
    />
  );
}

interface BackdropProps {
  // "page": detrás del contenido del layout principal (se queda fijo
  // mientras la página se desplaza). "screen": pantalla completa (login).
  variant?: "page" | "screen";
}

/**
 * Noche de fondo: estrellas, neblina y el cementerio con calabazas. Va
 * detrás del contenido; el contenedor necesita `isolation: isolate`.
 */
export function HalloweenBackdrop({ variant = "page" }: BackdropProps) {
  if (!useIsHalloween()) return null;

  const placement: SxProps<Theme> =
    variant === "page"
      ? {
          // Fijo dentro del área de contenido (no debajo del menú lateral)
          // y sin ocupar lugar: el margen negativo devuelve su alto.
          position: "sticky",
          top: 0,
          height: "100vh",
          mb: "-100vh",
        }
      : { position: "fixed", inset: 0 };

  return (
    <Box
      aria-hidden
      data-halloween-decor=""
      sx={[
        {
          zIndex: -1,
          overflow: "hidden",
          pointerEvents: "none",
          userSelect: "none",
          ...NO_PRINT,
        },
        placement,
      ]}
    >
      {/* Resplandor morado de la noche. */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 70% 50% at 85% 0%, rgba(166, 107, 255, 0.12), transparent 70%), radial-gradient(ellipse 60% 40% at 10% 100%, rgba(255, 122, 26, 0.08), transparent 70%)",
        }}
      />
      {STARS.map(([x, y, size, delay]) => (
        <Box
          key={`${x}-${y}`}
          sx={{
            position: "absolute",
            left: `${x}%`,
            top: `${y}%`,
            width: size,
            height: size,
            borderRadius: "50%",
            backgroundColor: "#FFF3D6",
            opacity: 0.55,
            [MOTION]: {
              animation: `${twinkle} ${3 + (delay % 2)}s ease-in-out ${delay}s infinite`,
            },
          }}
        />
      ))}
      {variant === "screen" && <FullMoon />}
      {/* Neblina que se mueve despacio sobre el suelo. */}
      {[0, 1].map((layer) => (
        <Box
          key={layer}
          sx={{
            position: "absolute",
            left: "-10%",
            right: "-10%",
            bottom: layer ? 40 : 10,
            height: { xs: 90, md: 140 },
            background:
              "radial-gradient(ellipse 50% 50% at 50% 50%, rgba(214, 196, 255, 0.10), transparent 70%)",
            [MOTION]: {
              animation: `${drift} ${layer ? 38 : 27}s ease-in-out infinite alternate${layer ? "-reverse" : ""}`,
            },
          }}
        />
      ))}
      <Graveyard />
    </Box>
  );
}

/** Murciélago de perfil, con alas que aletean. */
function Bat({ size, speed = 0.18 }: { size: number; speed?: number }) {
  return (
    <Box
      component="svg"
      viewBox="0 0 64 32"
      sx={{ width: size, display: "block" }}
    >
      <Box
        component="g"
        sx={{
          fill: "#1B1124",
          stroke: "rgba(166, 107, 255, 0.55)",
          strokeWidth: 0.8,
          transformOrigin: "32px 16px",
          [MOTION]: {
            animation: `${flap} ${speed}s ease-in-out infinite alternate`,
          },
        }}
      >
        <path d="M32 14 C26 4 18 4 2 8 C8 11 9 15 8 19 C12 16 15 17 17 21 C20 17 24 17 26 20 C28 17 30 16 32 18 Z" />
        <path d="M32 14 C38 4 46 4 62 8 C56 11 55 15 56 19 C52 16 49 17 47 21 C44 17 40 17 38 20 C36 17 34 16 32 18 Z" />
      </Box>
      <ellipse cx={32} cy={17} rx={4} ry={5} fill="#1B1124" />
      <path d="M29 12 l1 -4 l2 3 l2 -3 l1 4 z" fill="#1B1124" />
      <circle cx={30.6} cy={15.5} r={0.9} fill={PUMPKIN} />
      <circle cx={33.4} cy={15.5} r={0.9} fill={PUMPKIN} />
    </Box>
  );
}

/** Cuervo volando de perfil. */
function FlyingCrow({ size }: { size: number }) {
  return (
    <Box
      component="svg"
      viewBox="0 0 64 36"
      sx={{ width: size, display: "block" }}
    >
      <g fill="#120A18" stroke="rgba(166, 107, 255, 0.6)" strokeWidth={0.8}>
        <path d="M14 22 q10 -6 26 -4 l10 -3 l-6 5 q10 2 14 6 q-9 -1 -16 1 q-12 4 -24 1 l-10 4 l4 -6 z" />
        <Box
          component="path"
          d="M24 19 q4 -14 -6 -19 q14 2 18 18 z"
          sx={{
            transformOrigin: "30px 19px",
            [MOTION]: {
              animation: `${flap} 0.32s ease-in-out infinite alternate`,
            },
          }}
        />
        <circle cx={50} cy={19} r={0.9} fill={PUMPKIN} />
      </g>
    </Box>
  );
}

// [tipo, alto inicial (vh), tamaño px, duración s, retraso s, dirección].
const FLYERS: [
  "bat" | "crow",
  number,
  number,
  number,
  number,
  "right" | "left",
][] = [
  ["crow", 22, 54, 34, 4, "right"],
  ["bat", 38, 34, 26, 12, "left"],
  ["bat", 42, 24, 26, 12.6, "left"],
  ["bat", 34, 20, 26, 13.1, "left"],
  ["crow", 62, 44, 41, 23, "left"],
  ["bat", 70, 28, 31, 30, "right"],
];

/**
 * Cuervos y murciélagos que cruzan la pantalla de vez en cuando, por encima
 * del contenido pero debajo del header y de los diálogos. No se pueden tocar.
 */
export function HalloweenFlyers() {
  if (!useIsHalloween()) return null;

  return (
    <Box
      aria-hidden
      data-halloween-decor=""
      sx={{
        position: "fixed",
        inset: 0,
        zIndex: 1,
        overflow: "hidden",
        pointerEvents: "none",
        ...NO_PRINT,
        // Con "reducir movimiento" no hay nada volando.
        "@media (prefers-reduced-motion: reduce)": { display: "none" },
      }}
    >
      {FLYERS.map(([kind, top, size, duration, delay, direction]) => (
        <Box
          key={`${kind}-${top}-${delay}`}
          sx={{
            position: "absolute",
            left: 0,
            top: `${top}vh`,
            // Fuera de la pantalla hasta que le toca pasar.
            transform: "translate(-12vw, 0)",
            animation: `${direction === "right" ? flyRight : flyLeft} ${duration}s linear ${delay}s infinite`,
          }}
        >
          <Box
            sx={{
              animation: `${bob} 2.4s ease-in-out infinite`,
              // Siluetas oscuras sobre la noche: un halo para que se vean.
              filter: "drop-shadow(0 0 4px rgba(255, 122, 26, 0.35))",
            }}
          >
            {kind === "bat" ? <Bat size={size} /> : <FlyingCrow size={size} />}
          </Box>
        </Box>
      ))}
    </Box>
  );
}

/**
 * Luna creciente, estrellas y un murciélago dando vueltas, en el espacio libre
 * del header (tablet y escritorio).
 */
export function HalloweenHeaderScene() {
  if (!useIsHalloween()) return null;

  return (
    <Box
      aria-hidden
      data-halloween-decor=""
      sx={{
        display: { xs: "none", md: "block" },
        position: "absolute",
        top: "50%",
        left: "50%",
        width: 140,
        height: 56,
        transform: "translate(-50%, -50%)",
        pointerEvents: "none",
        ...NO_PRINT,
      }}
    >
      {/* Luna creciente: un círculo claro y otro del color del header. */}
      <Box
        sx={(theme) => ({
          position: "absolute",
          left: 52,
          top: 10,
          width: 34,
          height: 34,
          borderRadius: "50%",
          backgroundColor: "#F4DFA0",
          boxShadow: "0 0 18px 4px rgba(255, 214, 120, 0.25)",
          overflow: "hidden",
          "&::after": {
            content: '""',
            position: "absolute",
            width: "100%",
            height: "100%",
            borderRadius: "50%",
            top: -4,
            left: 11,
            backgroundColor: theme.palette.background.paper,
          },
        })}
      />
      {[
        [10, 14, 0],
        [30, 38, 1.4],
        [108, 12, 0.7],
        [128, 34, 2.1],
      ].map(([x, y, delay]) => (
        <Box
          key={`${x}-${y}`}
          sx={{
            position: "absolute",
            left: x,
            top: y,
            width: 3,
            height: 3,
            borderRadius: "50%",
            backgroundColor: "#FFF3D6",
            opacity: 0.6,
            [MOTION]: {
              animation: `${twinkle} 2.8s ease-in-out ${delay}s infinite`,
            },
          }}
        />
      ))}
      {/* Murciélago orbitando la luna. */}
      <Box
        sx={{
          position: "absolute",
          left: 59,
          top: 19,
          [MOTION]: { animation: `${orbit} 9s linear infinite` },
        }}
      >
        <Bat size={20} speed={0.24} />
      </Box>
    </Box>
  );
}

/** Telaraña en la esquina inferior derecha de su contenedor (menú lateral). */
export function HalloweenCobweb({ size = 88 }: { size?: number }) {
  const isHalloween = useIsHalloween();
  if (!isHalloween) return null;

  // Hilos desde la esquina (100, 100) y vueltas que cuelgan entre ellos.
  const angles = [180, 198, 216, 234, 252, 270].map(
    (deg) => (deg * Math.PI) / 180,
  );
  const point = (radius: number, angle: number) =>
    [100 + radius * Math.cos(angle), 100 + radius * Math.sin(angle)] as const;
  const spokes = angles
    .map((angle) => {
      const [x, y] = point(100, angle);
      return `M100 100 L${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
  const rings = [22, 42, 62, 82]
    .map((radius) =>
      angles
        .slice(1)
        .map((angle, index) => {
          const [x1, y1] = point(radius, angles[index]);
          const [x2, y2] = point(radius, angle);
          const [cx, cy] = point(radius * 0.86, (angles[index] + angle) / 2);
          return `M${x1.toFixed(1)} ${y1.toFixed(1)} Q${cx.toFixed(1)} ${cy.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`;
        })
        .join(" "),
    )
    .join(" ");

  return (
    <Box
      component="svg"
      aria-hidden
      data-halloween-decor=""
      viewBox="0 0 100 100"
      sx={{
        position: "absolute",
        right: 0,
        bottom: 0,
        width: size,
        height: size,
        pointerEvents: "none",
        opacity: 0.4,
        ...NO_PRINT,
      }}
    >
      <path
        d={`${spokes} ${rings}`}
        fill="none"
        stroke="#E9DCF7"
        strokeWidth={0.7}
      />
    </Box>
  );
}
