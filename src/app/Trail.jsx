import React, { useRef, useEffect, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import GPGPU from "../r3f-gist/gpgpu/GPGPU";

import posComputeShader from "./shaders/posCompute.glsl"
import velComputeShader from "./shaders/velCompute.glsl"
import { getRandomVectorInsideSphere } from "../r3f-gist/utility/Utilities"
import vertexShader from "./shaders/vertex.glsl"
import fragmentShader from "./shaders/fragment.glsl"

function initData(count, radius) {
    const data = new Float32Array(count * 4)
    for (let i = 0; i < count; i += 4) {
        const position = getRandomVectorInsideSphere(radius)
        data[i] = position.x
        data[i + 1] = position.y
        data[i + 2] = position.z
        data[i + 3] = 0
    }
    return data
}

export default function Trail() {

    const num = 100
    const length = 1000
    const { gl, scene } = useThree()

    const posCompute = new THREE.ShaderMaterial({
        fragmentShader: posComputeShader,
        uniforms: {
            dt: { value: 0.01 },
        }
    })
    const velCompute = new THREE.ShaderMaterial({
        fragmentShader: velComputeShader,
        uniforms: {
            time: { value: 0 },
        }
    })

    const gpgpu = useMemo(() => {
        const gpgpu = new GPGPU(gl, num, length)

        gpgpu.addVariable("positionTex", initData(num, 10), posCompute)
        gpgpu.addVariable("velocityTex", initData(num, 10), velCompute)

        gpgpu.setVariableDependencies("positionTex", ["positionTex", "velocityTex"])
        gpgpu.setVariableDependencies("velocityTex", ["positionTex", "velocityTex"])

        gpgpu.init()
        return gpgpu
    }, [gl, num, length])


    const uni = {
        uPositionTex: { value: null },
        uVelocityTex: { value: null },
        uTime: { value: 0 },
    }


    const mat = useMemo(() => {
        return new THREE.ShaderMaterial({
            uniforms: uni,
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
        })
    }, [uni])


    const trail = useMemo(() => {
        const geo = new THREE.BufferGeometry()

        const pos = new Float32Array(num * length * 3);
        const indices = new Uint32Array((num * length - 1) * 3);
        const uv = new Float32Array(num * length * 2);


        for (let i = 0; i < num; i++) {
            for (let j = 0; j < length; j++) {
                const c = i * length + j;
                const n = c * 3;
                pos[n] = 0;
                pos[n + 1] = 0;
                pos[n + 2] = 0;

                uv[c * 2] = j / length;
                uv[c * 2 + 1] = i / num;

                indices[n] = c;
                indices[n + 1] = Math.min(c + 1, i * length + length - 1);
                indices[n + 2] = Math.min(c + 1, i * length + length - 1);
            }
        }

        geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
        geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
        geo.setIndex(new THREE.BufferAttribute(indices, 1));

        mat.wireframe = true

        const mesh = new THREE.Mesh(geo, mat)
        mesh.matrixAutoUpdate = false
        mesh.updateMatrixWorld()

        scene.add(mesh)

        return mesh
    }, [num, length, mat])

    useFrame((state, delta) => {
        gpgpu.setUniform('velocityTex', 'time', state.clock.elapsedTime)

        gpgpu.setUniform('positionTex', 'dt', delta)
        gpgpu.compute()

        mat.uniforms.uPositionTex.value = gpgpu.getCurrentRenderTarget("positionTex")
        mat.uniforms.uVelocityTex.value = gpgpu.getCurrentRenderTarget("velocityTex")
    })

    return <></>
}