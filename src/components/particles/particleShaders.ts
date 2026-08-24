export const narrativeVertexShader = /* glsl */ `
  attribute vec3 aSource;
  attribute vec3 aRelease;
  attribute vec3 aFormation;
  attribute float aSeed;

  uniform float uTime;
  uniform float uProgress;
  uniform float uPhase;
  uniform float uPointSize;
  uniform float uMotion;

  varying float vAlpha;

  float easeOut(float t) {
    return 1.0 - pow(1.0 - t, 3.0);
  }

  void main() {
    float progress = easeOut(clamp(uProgress, 0.0, 1.0));
    vec3 transformed = aSource;
    vAlpha = 0.92;

    if (uPhase > 0.5 && uPhase < 1.5) {
      transformed = mix(aSource, aRelease, progress);
    } else if (uPhase >= 1.5 && uPhase < 2.5) {
      float reformProgress = smoothstep(0.08, 0.92, progress);
      transformed = mix(aRelease, aFormation, reformProgress);
      float releaseFade = 1.0 - smoothstep(0.0, 0.16, progress);
      float formationFade = smoothstep(0.2, 0.38, progress);
      vAlpha = max(releaseFade, formationFade);
    } else if (uPhase >= 2.5) {
      vec3 handoff = aFormation + vec3(0.0, -0.58, 1.45);
      transformed = mix(aFormation, handoff, progress);
      vAlpha = 1.0 - progress;
    }

    float turbulence = sin(uTime * 1.2 + aSeed * 29.0 + transformed.y * 3.0);
    transformed.x += turbulence * 0.045 * uMotion;
    transformed.y += cos(uTime * 0.9 + aSeed * 17.0) * 0.035 * uMotion;
    transformed.z += sin(uTime * 0.7 + aSeed * 11.0) * 0.025 * uMotion;

    vec4 modelPosition = modelMatrix * vec4(transformed, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    gl_Position = projectionMatrix * viewPosition;
    gl_PointSize = uPointSize * (1.0 + aSeed * 0.8) * (7.0 / max(1.0, -viewPosition.z));
  }
`;

export const narrativeFragmentShader = /* glsl */ `
  uniform vec3 uColor;
  varying float vAlpha;

  void main() {
    float distanceToCenter = distance(gl_PointCoord, vec2(0.5));
    float particle = 1.0 - smoothstep(0.08, 0.5, distanceToCenter);
    float glow = 1.0 - smoothstep(0.0, 0.5, distanceToCenter);
    gl_FragColor = vec4(uColor + glow * 0.28, particle * vAlpha);
  }
`;

export const constellationVertexShader = /* glsl */ `
  attribute float aSeed;
  uniform float uTime;
  uniform float uPointSize;
  uniform float uMotion;
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vec3 transformed = position;
    transformed.x += sin(uTime * 0.32 + aSeed * 21.0) * 0.028 * uMotion;
    transformed.y += cos(uTime * 0.27 + aSeed * 17.0) * 0.035 * uMotion;
    transformed.z += sin(uTime * 0.41 + aSeed * 13.0) * 0.025 * uMotion;
    vColor = color;
    vAlpha = 0.48 + aSeed * 0.52;
    vec4 viewPosition = modelViewMatrix * vec4(transformed, 1.0);
    gl_Position = projectionMatrix * viewPosition;
    gl_PointSize = uPointSize * (0.7 + aSeed) * (7.0 / max(1.0, -viewPosition.z));
  }
`;

export const constellationFragmentShader = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    float distanceToCenter = distance(gl_PointCoord, vec2(0.5));
    float particle = 1.0 - smoothstep(0.06, 0.5, distanceToCenter);
    gl_FragColor = vec4(vColor, particle * vAlpha);
  }
`;
