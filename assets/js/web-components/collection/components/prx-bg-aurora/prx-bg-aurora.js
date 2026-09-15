import { Renderer, Program, Mesh, Color, Triangle } from "ogl";
import { Host, h } from "@stencil/core";
const VERT = `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;
const FRAG = `#version 300 es
precision highp float;

uniform float uTime;
uniform float uAmplitude;
uniform vec3 uColorStops[3];
uniform vec2 uResolution;
uniform float uBlend;

out vec4 fragColor;

vec3 permute(vec3 x) {
  return mod(((x * 34.0) + 1.0) * x, 289.0);
}

float snoise(vec2 v){
  const vec4 C = vec4(
      0.211324865405187, 0.366025403784439,
      -0.577350269189626, 0.024390243902439
  );
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);

  vec3 p = permute(
      permute(i.y + vec3(0.0, i1.y, 1.0))
    + i.x + vec3(0.0, i1.x, 1.0)
  );

  vec3 m = max(
      0.5 - vec3(
          dot(x0, x0),
          dot(x12.xy, x12.xy),
          dot(x12.zw, x12.zw)
      ),
      0.0
  );
  m = m * m;
  m = m * m;

  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);

  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

struct ColorStop {
  vec3 color;
  float position;
};

#define COLOR_RAMP(colors, factor, finalColor) {              \
  int index = 0;                                            \
  for (int i = 0; i < 2; i++) {                               \
     ColorStop currentColor = colors[i];                    \
     bool isInBetween = currentColor.position <= factor;    \
     index = int(mix(float(index), float(i), float(isInBetween))); \
  }                                                         \
  ColorStop currentColor = colors[index];                   \
  ColorStop nextColor = colors[index + 1];                  \
  float range = nextColor.position - currentColor.position; \
  float lerpFactor = (factor - currentColor.position) / range; \
  finalColor = mix(currentColor.color, nextColor.color, lerpFactor); \
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;

  ColorStop colors[3];
  colors[0] = ColorStop(uColorStops[0], 0.0);
  colors[1] = ColorStop(uColorStops[1], 0.5);
  colors[2] = ColorStop(uColorStops[2], 1.0);

  vec3 rampColor;
  COLOR_RAMP(colors, uv.x, rampColor);

  float height = snoise(vec2(uv.x * 2.0 + uTime * 0.1, uTime * 0.25)) * 0.5 * uAmplitude;
  height = exp(height);
  height = (uv.y * 2.0 - height + 0.2);
  float intensity = 0.6 * height;

  float midPoint = 0.20;
  float auroraAlpha = smoothstep(midPoint - uBlend * 0.5, midPoint + uBlend * 0.5, intensity);

  vec3 auroraColor = intensity * rampColor;

  fragColor = vec4(auroraColor * auroraAlpha, auroraAlpha);
}
`;
export class PrxBgAurora {
    animateId = 0;
    renderer;
    program;
    mesh;
    el;
    /**
     * An array of three hex colors defining the aurora gradient.
     */
    colorStops = ['#5227FF', '#7cff67', '#5227FF'];
    /**
     * Controls the height intensity of the aurora effect.
     */
    amplitude = 1.0;
    /**
     * Controls the blending of the aurora effect with the background.
     */
    blend = 0.5;
    /**
     * Controls the animation speed. Higher values make the aurora move faster.
     */
    speed = 1.0;
    /**
     * Current time of animation. Use to externally control animation progress.
     */
    time;
    connectedCallback() {
        let canvas = this.el.shadowRoot.querySelector('canvas');
        if (!canvas) {
            canvas = document.createElement('canvas');
            this.el.shadowRoot.appendChild(canvas);
        }
        this.renderer = new Renderer({
            canvas,
            alpha: true,
            premultipliedAlpha: true,
            antialias: true,
            width: this.el.offsetWidth,
            height: this.el.offsetHeight
        });
        const { amplitude, blend, colorStops, renderer } = this;
        const { gl } = renderer;
        gl.clearColor(0, 0, 0, 0);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        gl.canvas.style.backgroundColor = 'transparent';
        const colorStopsArray = colorStops.map(hex => {
            const c = new Color(hex);
            return [c.r, c.g, c.b];
        });
        this.program = new Program(gl, {
            vertex: VERT,
            fragment: FRAG,
            uniforms: {
                uTime: { value: 0 },
                uAmplitude: { value: amplitude },
                uColorStops: { value: colorStopsArray },
                uResolution: { value: [this.el.offsetWidth, this.el.offsetHeight] },
                uBlend: { value: blend }
            }
        });
        const geometry = new Triangle(gl);
        if (geometry.attributes.uv) {
            delete geometry.attributes.uv;
        }
        this.mesh = new Mesh(gl, { geometry, program: this.program });
        this.animateId = requestAnimationFrame(this.update);
        window.addEventListener('resize', this.resize);
        this.resize();
    }
    disconnectCallback() {
        cancelAnimationFrame(this.animateId);
        window.removeEventListener('resize', this.resize);
        const { renderer } = this;
        const { gl } = renderer || {};
        gl.getExtension('WEBGL_lose_context')?.loseContext();
    }
    resize = () => {
        if (!this.el)
            return;
        const width = this.el.offsetWidth;
        const height = this.el.offsetHeight;
        this.renderer.setSize(width, height);
        if (this.program) {
            this.program.uniforms.uResolution.value = [width, height];
        }
        this.renderer.render({ scene: this.mesh });
    };
    update = (t) => {
        this.animateId = requestAnimationFrame(this.update);
        const { program, renderer, amplitude, blend, colorStops, time = t * 0.01, speed = 1.0 } = this;
        program.uniforms.uTime.value = time * speed * 0.1;
        program.uniforms.uAmplitude.value = amplitude;
        program.uniforms.uBlend.value = blend;
        program.uniforms.uColorStops.value = colorStops.map(hex => {
            const c = new Color(hex);
            return [c.r, c.g, c.b];
        });
        renderer.render({ scene: this.mesh });
    };
    render() {
        return (h(Host, { key: '03d1ca57920d9c018a244fa02925f471aaf0dd8a' }));
    }
    static get is() { return "prx-bg-aurora"; }
    static get encapsulation() { return "shadow"; }
    static get originalStyleUrls() {
        return {
            "$": ["prx-bg-aurora.css"]
        };
    }
    static get styleUrls() {
        return {
            "$": ["prx-bg-aurora.css"]
        };
    }
    static get properties() {
        return {
            "colorStops": {
                "type": "unknown",
                "mutable": false,
                "complexType": {
                    "original": "string[]",
                    "resolved": "string[]",
                    "references": {}
                },
                "required": false,
                "optional": false,
                "docs": {
                    "tags": [],
                    "text": "An array of three hex colors defining the aurora gradient."
                },
                "getter": false,
                "setter": false,
                "defaultValue": "['#5227FF', '#7cff67', '#5227FF']"
            },
            "amplitude": {
                "type": "number",
                "mutable": false,
                "complexType": {
                    "original": "number",
                    "resolved": "number",
                    "references": {}
                },
                "required": false,
                "optional": false,
                "docs": {
                    "tags": [],
                    "text": "Controls the height intensity of the aurora effect."
                },
                "getter": false,
                "setter": false,
                "reflect": false,
                "attribute": "amplitude",
                "defaultValue": "1.0"
            },
            "blend": {
                "type": "number",
                "mutable": false,
                "complexType": {
                    "original": "number",
                    "resolved": "number",
                    "references": {}
                },
                "required": false,
                "optional": false,
                "docs": {
                    "tags": [],
                    "text": "Controls the blending of the aurora effect with the background."
                },
                "getter": false,
                "setter": false,
                "reflect": false,
                "attribute": "blend",
                "defaultValue": "0.5"
            },
            "speed": {
                "type": "number",
                "mutable": false,
                "complexType": {
                    "original": "number",
                    "resolved": "number",
                    "references": {}
                },
                "required": false,
                "optional": false,
                "docs": {
                    "tags": [],
                    "text": "Controls the animation speed. Higher values make the aurora move faster."
                },
                "getter": false,
                "setter": false,
                "reflect": false,
                "attribute": "speed",
                "defaultValue": "1.0"
            },
            "time": {
                "type": "number",
                "mutable": false,
                "complexType": {
                    "original": "number",
                    "resolved": "number",
                    "references": {}
                },
                "required": false,
                "optional": false,
                "docs": {
                    "tags": [],
                    "text": "Current time of animation. Use to externally control animation progress."
                },
                "getter": false,
                "setter": false,
                "reflect": false,
                "attribute": "time"
            }
        };
    }
    static get elementRef() { return "el"; }
}
//# sourceMappingURL=prx-bg-aurora.js.map
