/**
 * The WebGL2 shaders behind ContourField. A few slow gaussian "masses" plus low-amplitude noise
 * make contour lines that read like a body-composition scan; a horizontal scan band travels down
 * the field and lifts the lines it crosses into the signal colour. GLSL keeps its short math names.
 */

export const VERTEX_SHADER = `#version 300 es
in vec2 p;
void main(){ gl_Position = vec4(p,0.,1.); }`;

export const FRAGMENT_SHADER = `#version 300 es
precision highp float;
out vec4 o;
uniform vec2 uRes;
uniform float uT;
uniform vec2 uPtr;
uniform float uPtrAmt;
uniform vec3 uLine;
uniform vec3 uSig;
uniform float uLineA;
uniform float uSigA;
uniform float uDensity;
uniform float uScan;
uniform float uSeed;
uniform float uDpr;

float h(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)) + uSeed) * 43758.5453); }
float n(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f*f*(3.-2.*f);
  return mix(mix(h(i), h(i+vec2(1,0)), u.x), mix(h(i+vec2(0,1)), h(i+vec2(1,1)), u.x), u.y);
}
float fbm(vec2 p){
  float a = .5, s = 0.;
  for(int i=0;i<4;i++){ s += a*n(p); p = p*2.03 + 7.1; a *= .5; }
  return s;
}
float mass(vec2 p, vec2 c, float r){ vec2 d = p-c; return exp(-dot(d,d)/(r*r)); }

void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  float asp = uRes.x / uRes.y;
  vec2 p = vec2((uv.x-.5)*asp, uv.y-.5);
  float t = uT * .045;

  float f = 0.;
  f += 1.05*mass(p, vec2(-.18*asp + .06*sin(t*1.3), .10 + .05*cos(t)), .42);
  f += .80*mass(p, vec2(.22*asp + .05*cos(t*.9), -.16 + .06*sin(t*1.1)), .36);
  f += .55*mass(p, vec2(.04*asp + .08*sin(t*.7+1.), .30 + .04*sin(t*1.7)), .24);
  f += .45*mass(p, vec2(-.30*asp, -.34 + .05*cos(t*1.2)), .30);
  vec2 pp = vec2((uPtr.x-.5)*asp, uPtr.y-.5);
  f += .38*uPtrAmt*mass(p, pp, .20);
  f += .34*fbm(p*2.2 + vec2(t*.6, -t*.4));

  float k = f * uDensity;
  float w = fwidth(k);
  // crisp isolines about one device pixel wide
  float g = abs(fract(k - .5) - .5) / max(w, 1e-4);
  float line = 1. - clamp(g - .15*uDpr, 0., 1.);

  // every fifth isoline is an index contour, slightly stronger
  float idx = abs(fract(k/5. - .5) - .5) / max(w/5., 1e-4);
  float index = 1. - clamp(idx - .35*uDpr, 0., 1.);

  float scanY = 1.15 - fract(uT * .055) * 1.5;
  float band = uScan * exp(-pow((uv.y - scanY) * 9., 2.));
  float edge = smoothstep(0., .18, uv.x) * smoothstep(1., .82, uv.x);

  float a = (line * uLineA + index * uLineA * .9);
  vec3 col = uLine;
  float sig = band * max(line, index) * uSigA * (.55 + .45*edge);
  col = mix(col, uSig, clamp(sig * 2.2, 0., 1.));
  a = max(a, sig);
  o = vec4(col * a, a);
}`;
