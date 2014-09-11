precision mediump float;

varying float vindex;
varying vec3  vpos;

#pragma glslify: hsv = require(glsl-hsv2rgb)

void main() {
  gl_FragColor = mix(
      vec4(0.1, 0.5, 0.7, 1.0)
    , vec4(0.8, 0.3, 0.1, 1.0)
    , clamp((vpos.z + 1.0) * 0.5, 0.0, 1.0)
  );
}
