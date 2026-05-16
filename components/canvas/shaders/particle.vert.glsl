attribute float aSize;
attribute vec3 aColor;
varying vec3 vColor;
uniform float uTime;
uniform float uPixelRatio;
uniform float uIntroAlpha;
varying float vIntroAlpha;

void main() {
  // Particles with aSize ~ 0 should be invisible. The PointSize clamp
  // below would otherwise raise them to 0.5px and leave stale dots
  // where a strand particle is currently un-deployed. Push the vertex
  // outside the clip volume so it gets culled entirely.
  if (aSize <= 0.01) {
    gl_Position = vec4(0.0, 0.0, 2.0, 1.0);
    gl_PointSize = 0.0;
    vColor = vec3(0.0);
    vIntroAlpha = 0.0;
    return;
  }

  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mvPosition;

  // Distance-scaled point size with min/max clamp
  gl_PointSize = aSize * uPixelRatio * (300.0 / -mvPosition.z);
  gl_PointSize = clamp(gl_PointSize, 0.5, 4.0);

  vColor = aColor;
  vIntroAlpha = uIntroAlpha;
}
