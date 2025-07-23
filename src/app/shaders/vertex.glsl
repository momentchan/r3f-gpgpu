uniform sampler2D uPositionTex;
varying vec4 vColor;

void main() {
    vec3 pos = texture2D(uPositionTex, uv).xyz;
    vColor = vec4(1.0, 0.0, 0.0, 1.0);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos + position, 1.0);
}




