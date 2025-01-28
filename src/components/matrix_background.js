import React, { useEffect, useRef } from "react";
import * as THREE from "three";

const vertexShader = `
varying vec2 vUv;
varying vec3 vPosition;

void main()	{
    vUv = uv;
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = `
varying vec2 vUv;
varying vec3 vPosition;

uniform float time;
uniform sampler2D font;

float random(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
}

void main()	{

  vec2 uv = vUv;

  // dilate the texture coordinates a bit
  uv.xy *= 1.7;

  // scroll up with time and be sure to handle the wrap around case
  uv.y += 0.1 * time;

  // Create a perspective effect using vPosition
  float depth = abs(vPosition.z);
  uv /= depth * 0.1 + 1.0; // Compress UVs with distance for a tunnel effect

  float truncated_time = time - fract(time);
  float fps = 0.1;
  truncated_time = time - fract(time * fps)/fps;

  // compute the block the current uv value lies in
  vec2 block = floor(uv.xy * 16.0);

  // select random character
  float rindex = floor(random(block + fps) * 224.0 + 15.0); // Character index (0 to 255)

  // random choice between the selected character and a completely random character
  float threshold = random(block + truncated_time * 0.02) * 0.6;
  float outcome = random(block + time * 0.02);
  float choice = floor(outcome * 224.0 + 15.0);

  if (outcome > threshold + 0.4) {
    rindex = choice;
  }

  // convert selection to indices
  float col = mod(rindex, 16.0); // Column (0 to 15)
  float row = floor(rindex * 0.0625); // Row (0 to 15)
  
  // compute base uv offset for selected character
  vec2 rindex_uv = vec2(col, row) * 0.0625;

  // compute the uv offset of the current fragment
  vec2 frag_uv = fract(uv * 16.0) * 0.0625;

  // compute translated uv
  vec2 trans_uv = rindex_uv + frag_uv;

  // text color
  vec4 text_color = vec4(0.9, 0.6, 0.0, 1.0);

  // sample the bitmap
  vec4 color = 0.95 * texture(font, fract(trans_uv)) * text_color;
  vec4 scanlines = vec4(vec3(0.1*sin(uv.y * 3.14 * 50.0 + time * 10.2)), 0.0);
  color = color * vec4(vec3(abs(sin(random(block) * 6.28 + 3.14 * time))), 1.0) + scanlines;
  gl_FragColor = color;
}
`

const MatrixBackground = () => {
  const mountRef = useRef(null);

  useEffect(() => {
    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = -5
    camera.fov = 75;

    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    mountRef.current.appendChild(renderer.domElement);

    renderer.debug.onShaderError = ( gl, program, vertexShader, fragmentShader ) => {
  
      const vertexShaderSource = gl.getShaderSource( vertexShader );
      const fragmentShaderSource = gl.getShaderSource( fragmentShader );
      
      console.groupCollapsed( "vertexShader" )
      console.log( vertexShaderSource )
      console.groupEnd()
      
      console.groupCollapsed( "fragmentShader" )
      console.log( fragmentShaderSource )
      console.groupEnd()
  
    }

    // Uniforms
    const uniforms = {
      time: { value: 0 },
      font: { value: new THREE.TextureLoader().load('data:image/png;base64,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') },
    };

    // Geometry
    const planeGeometry = new THREE.PlaneGeometry(10, 10);
    const shaderMaterial = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms,
    });

    const leftPlane = new THREE.Mesh(planeGeometry, shaderMaterial);
    leftPlane.position.set(-5.5, 0, -10);
    leftPlane.rotation.y = Math.PI / 2;

    const rightPlane = new THREE.Mesh(planeGeometry, shaderMaterial);
    rightPlane.position.set(5.5, 0, -10);
    rightPlane.rotation.y = -Math.PI / 2;

    scene.add(leftPlane);
    scene.add(rightPlane);

    // Animation loop
    const clock = new THREE.Clock();
    const animate = () => {
      requestAnimationFrame(animate);
      uniforms.time.value = clock.getElapsedTime();
      renderer.render(scene, camera);
    };

    animate();

    // Resize handling
    const onResize = () => {
      const { innerWidth, innerHeight } = window;
      camera.aspect = innerWidth / innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(innerWidth, innerHeight);
    };

    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      scene.remove(leftPlane);
      scene.remove(rightPlane);
      if (mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div id="canvas" ref={mountRef} />;
};

export default MatrixBackground;
