uniform float dt;   

void main() {

    if(gl_FragCoord.x <= 1.0) {
        vec2 uv = gl_FragCoord.xy / resolution;
        vec3 pos = texture2D(positionTex, uv).xyz;
        vec3 vel = texture2D(velocityTex, uv).xyz;

        pos += vel * dt;
        gl_FragColor = vec4(pos, 1.0);

    } else {

        vec2 bUv = (gl_FragCoord.xy - vec2(1.0)) / resolution;
        vec3 pos = texture2D(positionTex, bUv).xyz;

        gl_FragColor = vec4(pos, 1.0);
    }
}