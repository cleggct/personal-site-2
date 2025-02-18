import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { GPUComputationRenderer } from 'three/addons/misc/GPUComputationRenderer.js';

const WIDTH = 16;

const NUM_BOIDS = WIDTH * WIDTH;

const vertexShader = `
varying vec2 vUv;
varying vec3 vPosition;

void main()	{
    vUv = uv;
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const velocityShader = `
uniform vec2 mousePos;

void main() {
  vec2 dims = vec2(${WIDTH}.0);
  vec2 boid_idx = gl_FragCoord.xy / dims;

  // data values for the current boid
  vec2 boid_pos = texture2D(positionData, boid_idx).xy;
  vec2 boid_vel = texture2D(velocityData, boid_idx).xy;

  // we need to sum the positions to compute the average
  vec2 sum_pos = vec2(0.0);

  // we will also compute the average velocity
  vec2 sum_vel = vec2(0.0);

  // this value is for computing the direction to move away from nearby boids
  vec2 c = vec2(0.0);

  // iterate over all the boids
  for (int i = 0; i < ${WIDTH}; ++i) {
    for (int j = 0; j < ${WIDTH}; ++j) {
      vec2 other_boid_coord = vec2(float(i), float(j)) / dims;
      vec2 other_boid_pos = texture2D(positionData, other_boid_coord).xy;
      vec2 other_boid_vel = texture2D(velocityData, other_boid_coord).xy;

      sum_pos = sum_pos + other_boid_pos;
      sum_vel = sum_vel + other_boid_vel;

      vec2 diff = other_boid_pos - boid_pos;
      float distance = diff.x * diff.x + diff.y * diff.y;

      if (distance < 0.00005) {
        c = c - diff;
      }
    }
  }

  // obtain the sum of positions without the current boid
  vec2 partial_sum_pos = sum_pos - boid_pos;

  // obtain the sum of velocities without the current boid
  vec2 partial_sum_vel = sum_vel - boid_vel;

  // now obtain the averages
  vec2 avg_pos = partial_sum_pos / (${NUM_BOIDS}.0 - 1.0);
  vec2 avg_vel = partial_sum_vel / (${NUM_BOIDS}.0 - 1.0);

  // now subtract these from the current boid's values and scale them
  vec2 v1 = (avg_pos - boid_pos) / 10000.0;
  vec2 v2 = (avg_vel - boid_vel) / 80.0;
  vec2 v3 = c / 100.0;

  // this term will push the boids away from the edges
  vec2 v4 = vec2(0.0);
  if (boid_pos.x < 0.1) {
    v4 = v4 + vec2(0.1 - boid_pos.x, 0.0) * 0.01;
  }
  if (boid_pos.x > 0.9) {
    v4 = v4 + vec2(0.9 - boid_pos.x, 0.0) * 0.01;
  }
  if (boid_pos.y < 0.1) {
    v4 = v4 + vec2(0.0, 0.1 - boid_pos.y) * 0.01;
  }
  if (boid_pos.y > 0.9) {
    v4 = v4 + vec2(0.0, 0.9 - boid_pos.y) * 0.01;
  }

  // make them follow the mouse
  vec2 mouse_dir = mousePos - boid_pos;
  float mouse_dir_mag = sqrt(mouse_dir.x * mouse_dir.x + mouse_dir.y * mouse_dir.y);
  vec2 v5 = mouse_dir / mouse_dir_mag * 0.0001;

  // compute the new position and velocity
  vec2 new_vel = boid_vel + v1 + v2 + v3 + v4 + v5;

  float mag = sqrt(new_vel.x * new_vel.x + new_vel.y * new_vel.y);

  if (mag > 0.005) {
    new_vel = new_vel / mag * 0.005;
  }

  gl_FragColor = vec4(new_vel, 0.0, 0.0);
}
`;

const positionShader = `
void main() {
  vec2 dims = vec2(${WIDTH}.0);
  vec2 boid_idx = gl_FragCoord.xy / dims;

  // data values for the current boid
  vec2 boid_pos = texture2D(positionData, boid_idx).xy;
  vec2 boid_vel = texture2D(velocityData, boid_idx).xy;

  vec2 new_pos = boid_pos + boid_vel;

  gl_FragColor = vec4(new_pos, 0.0, 0.0);
}
`;

const fragmentShader = `
varying vec2 vUv;
varying vec3 vPosition;

uniform float time;

uniform sampler2D framebufTexture;
uniform sampler2D velocityTexture;
uniform sampler2D positionTexture;

void main() {
  
  bool is_boid = false;
  vec2 uv = vUv.xy;
  vec2 dims = vec2(${WIDTH}.0);

  for (int i = 0; i < ${WIDTH}; ++i) {
    for (int j = 0; j < ${WIDTH}; ++j) {
      vec2 boid_coord = vec2(float(i), float(j)) / dims;

      vec2 boid_pos = texture2D(positionTexture, boid_coord).xy;
      vec2 diff = uv - boid_pos;

      if (diff.x * diff.x + diff.y * diff.y < 0.000001) {
        is_boid = true;
      }
    }
  }

  if (is_boid) {
    gl_FragColor = vec4(1.0);
  }
  else {
    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
  }
}
`

const handleResize = (camera, renderer, width, height) => {
  const aspect = width / height;
  camera.aspect = aspect;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
};

const handleMouseMove = (width, height, event) => {
  const mouseX = ( event.clientX ) / width;
  const mouseY = 1 - (( event.clientY ) / height);

  return [mouseX, mouseY];
};

const handleRenderError = ( gl, program, vertexShader, fragmentShader ) => {
  
  const vertexShaderSource = gl.getShaderSource( vertexShader );
  const fragmentShaderSource = gl.getShaderSource( fragmentShader );
  
  console.groupCollapsed( "vertexShader" )
  console.log( vertexShaderSource )
  console.groupEnd()
  
  console.groupCollapsed( "fragmentShader" )
  console.log( fragmentShaderSource )
  console.groupEnd()

};

const Boids = () => {
    const mountRef = useRef(null);

    useEffect(() => {

        // get screen dimensions
        const width = window.innerWidth;
        const height = window.innerHeight;

        // Scene setup
        const scene = new THREE.Scene();
        const camera = new THREE.OrthographicCamera( - 1, 1, 1, - 1, 0, 1 );
        const renderer = new THREE.WebGLRenderer();
        
        renderer.setSize(width, height);

        renderer.debug.onShaderError = handleRenderError; 

        // Resize handling
        const onResize = () => handleResize(camera, renderer, width, height);
        window.addEventListener("resize", onResize);

        let mousePos = [0, 0];
        const onMouseMove = (event) => {
          mousePos = handleMouseMove(width, height, event);
        };
        window.addEventListener("mousemove", onMouseMove);

        // add the renderer to the component
        mountRef.current.appendChild(renderer.domElement);
        
        // initialize our compute pipeline
        const gpuCompute = new GPUComputationRenderer( WIDTH, WIDTH, renderer );

        // create textures for the compute data
        const positionTexture = gpuCompute.createTexture();
        const velocityTexture = gpuCompute.createTexture();

        // initialize the compute data
        const positionData = positionTexture.image.data;
        positionData.map((_, idx) => {
          positionData[idx] = Math.random();
        });
        const velocityData = velocityTexture.image.data;
        velocityData.map((_, idx) => {
          velocityData[idx] = (Math.random() - 0.5);
        });

        const velocityVariable = gpuCompute.addVariable( 'velocityData', velocityShader, velocityTexture);
        const positionVariable = gpuCompute.addVariable( 'positionData', positionShader, positionTexture);

        gpuCompute.setVariableDependencies(positionVariable, [velocityVariable, positionVariable]);
        gpuCompute.setVariableDependencies(velocityVariable, [velocityVariable, positionVariable]);

        velocityVariable.wrapS = THREE.RepeatWrapping;
				velocityVariable.wrapT = THREE.RepeatWrapping;
				positionVariable.wrapS = THREE.RepeatWrapping;
				positionVariable.wrapT = THREE.RepeatWrapping;


        const error = gpuCompute.init();

        if (error) {
          console.error(error);
        }

        // initialize the framebuf texture
        const framebufTexture = new THREE.FramebufferTexture( width, height );
        // initialize the uniforms (this must be done before we can initialize 
        //  the geometry)
        const uniforms = {
          time: {value: 0},
          framebufTexture: { value: null },
          velocityTexture: {value: null},
          positionTexture: {value: null},
        };

        // Geometry
        const planeGeometry = new THREE.PlaneGeometry(2, 2);
        const shaderMaterial = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms,
        });
        //shaderMaterial.needsUpdate = true;

        const plane = new THREE.Mesh(planeGeometry, shaderMaterial);
        scene.add(plane);

        const velocityUniforms = velocityVariable.material.uniforms;
        velocityUniforms['mousePos'] = {value: new THREE.Vector2(mousePos[0], mousePos[1])};

        // Animation loop
        const clock = new THREE.Clock();
        const animate = () => {
            requestAnimationFrame(animate);
            gpuCompute.compute();
            uniforms.time.value = clock.getElapsedTime();
            velocityUniforms['mousePos'].value = new THREE.Vector2(mousePos[0], mousePos[1]);
            uniforms.framebufTexture.value = framebufTexture.image;
            uniforms.velocityTexture.value = gpuCompute.getCurrentRenderTarget( velocityVariable ).texture;
            uniforms.positionTexture.value = gpuCompute.getCurrentRenderTarget( positionVariable ).texture;
            renderer.copyFramebufferToTexture(framebufTexture);
            renderer.render(scene, camera);

            shaderMaterial.needsUpdate = true;
        };

        animate();

        return () => {
            mountRef.current.removeChild(renderer.domElement);
            window.removeEventListener("resize", onResize);
            framebufTexture.dispose();
            shaderMaterial.dispose();
            scene.remove(plane);
            renderer.dispose();
          };
            
    }, []);

    return (<div>
                <div id="canvas" ref={mountRef} />
            </div>);
};

export default Boids;
