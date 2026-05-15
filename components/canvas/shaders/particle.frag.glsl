varying vec3 vColor;
varying float vIntroAlpha;

void main() {
  // Soft circular point with alpha falloff
  vec2 center = gl_PointCoord - vec2(0.5);
  float dist = length(center);
  if (dist > 0.5) discard;

  float alpha = smoothstep(0.5, 0.3, dist) * 0.85;
  gl_FragColor = vec4(vColor, alpha * vIntroAlpha);
}
