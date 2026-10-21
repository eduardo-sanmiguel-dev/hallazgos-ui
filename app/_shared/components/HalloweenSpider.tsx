import { Box } from "@mui/material";
import { Tooltip } from "@mui/material";
import { keyframes } from "@mui/material/styles";

const swing = keyframes`
  from { transform: rotate(-7deg); }
  to { transform: rotate(7deg); }
`;

const blink = keyframes`
  0%, 92%, 100% { transform: scaleY(1); }
  96% { transform: scaleY(0.1); }
`;

// Patas de un lado (el otro se dibuja en espejo).
const LEGS = [
  "M17 33.5 Q11 26 6 29",
  "M16.5 35.5 Q9 32.5 4.5 36",
  "M16.5 38 Q9 39.5 5.5 45",
  "M17.5 40 Q12.5 46 10.5 52",
];

// Araña colgando de su hilo, decoración del header en el tema de Halloween.
// Se mece sola y baja un poco al pasar el cursor.
export default function HalloweenSpider() {
  return (
    <Tooltip title="¡Feliz Halloween!">
      <Box
        role="img"
        aria-label="Araña de Halloween"
        sx={{
          alignSelf: "stretch",
          position: "relative",
          width: 40,
          flexShrink: 0,
          "&:hover .spider-drop": { transform: "translateY(6px)" },
        }}
      >
        <Box
          component="svg"
          viewBox="0 0 40 56"
          aria-hidden
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            width: 40,
            height: 56,
            overflow: "hidden",
          }}
        >
          <Box
            component="g"
            sx={{
              transformOrigin: "20px 0px",
              animation: `${swing} 3.2s ease-in-out infinite alternate`,
            }}
          >
            <Box
              component="g"
              className="spider-drop"
              sx={{ transition: "transform 300ms ease-out" }}
            >
              <Box
                component="line"
                x1={20}
                y1={-20}
                x2={20}
                y2={30}
                sx={{
                  stroke: (theme) => theme.palette.text.secondary,
                  strokeWidth: 1,
                }}
              />
              <Box
                component="g"
                sx={{
                  fill: "none",
                  stroke: (theme) => theme.palette.secondary.main,
                  strokeWidth: 1.6,
                  strokeLinecap: "round",
                }}
              >
                {LEGS.map((d) => (
                  <path key={d} d={d} />
                ))}
                {LEGS.map((d) => (
                  <path
                    key={`r-${d}`}
                    d={d}
                    transform="translate(40 0) scale(-1 1)"
                  />
                ))}
              </Box>
              <Box
                component="ellipse"
                cx={20}
                cy={40.5}
                rx={6}
                ry={7}
                sx={{ fill: (theme) => theme.palette.secondary.dark }}
              />
              <Box
                component="circle"
                cx={20}
                cy={32.5}
                r={3.8}
                sx={{ fill: (theme) => theme.palette.secondary.dark }}
              />
              {/* Brillo y ojos de calabaza. */}
              <ellipse
                cx={17.8}
                cy={38}
                rx={1.4}
                ry={2.6}
                fill="#fff"
                opacity={0.18}
              />
              <Box
                component="g"
                sx={{
                  fill: (theme) => theme.palette.primary.main,
                  transformOrigin: "20px 32px",
                  animation: `${blink} 4.5s ease-in-out infinite`,
                }}
              >
                <circle cx={18.6} cy={32.2} r={1} />
                <circle cx={21.4} cy={32.2} r={1} />
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </Tooltip>
  );
}
