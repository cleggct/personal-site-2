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

uniform vec2 bot_left;
uniform vec2 top_right;

void main() {
    vec2 dims = top_right.xy - bot_left.xy;
    vec2 coord = bot_left.xy + vUv.xy * dims.xy;

    int iteration = 0;
    int max = 1000;

    float x = 0.0;
    float y = 0.0;

    float val = 0.0;

    vec3 black = vec3(0.0, 0.0, 0.0);
    vec3 blue = vec3(0.0, 0.1, 1.0);
    vec3 orange = vec3(0.9, 0.5, 0.1);
    vec3 white = vec3(1.0, 1.0, 1.0);

    while ((x * x + y * y < float(1 << 16)) && (iteration < max)) {
        float xtemp = x * x - y * y + coord.x;
        y = 2.0 * x * y + coord.y;
        x = xtemp;
        iteration = iteration + 1;
    }

    if (iteration < max) {
        float logz_n = log(x * x + y * y) / 2.0;
        float nu = log(logz_n / log(2.0)) / log(2.0);
        val = float(iteration) + 1.0 - nu;
    }

    val = val / 10.0;

    float t1 = mod(floor(val), 4.0);
    
    float l2 = fract(val);
    float l1 = 1.0 - fract(val);

    vec3 color = vec3(1.0, 1.0, 1.0);

    if (t1 < 1.0) {
        color =  l1 * black + l2 * blue;
    }
    else if (t1 < 2.0) {
        color =  l1 * blue + l2 * white;
    }
    else if (t1 < 3.0) {
        color =  l1 * white + l2 * orange;
    }
    else {
        color = l1 * orange + l2 * black;
    }

    gl_FragColor = vec4(color, 1.0);
}
`;

const Mandelbrot = () => {
    const mountRef = useRef(null);
    const mousePos = useRef(null);
    const mouseDownPos = useRef(null);
    const mouseUpPos = useRef(null);
    const stateRef = useRef(null);

    useEffect(() => {
        // Scene setup
        const scene = new THREE.Scene();
        const camera = new THREE.OrthographicCamera( - 1, 1, 1, - 1, 0, 1 );
        const renderer = new THREE.WebGLRenderer();
        renderer.setSize(window.innerWidth, window.innerHeight);
        mountRef.current.appendChild(renderer.domElement);

        const width = window.innerWidth;
        const height = window.innerHeight;

        const aspect = height / width;

        renderer.debug.onShaderError = ( gl, program, vertexShader, fragmentShader ) => {
  
            const vertexShaderSource = gl.getShaderSource( vertexShader );
            const fragmentShaderSource = gl.getShaderSource( fragmentShader );
            
            console.groupCollapsed( "vertexShader" )
            console.log( vertexShaderSource )
            console.groupEnd()
            
            console.groupCollapsed( "fragmentShader" )
            console.log( fragmentShaderSource )
            console.groupEnd()
        
        };

        const bl_coords = [-2.5, -1.4];
        const w_start = 5.0;
        const h_start = aspect * w_start;
        const uniforms = {
            bot_left: {value: bl_coords},
            top_right: {value: [bl_coords[0] + w_start, bl_coords[1] + h_start]}
        };
        
        const state = {
            bot_left: bl_coords,
            top_right: [bl_coords[0] + w_start, bl_coords[1] + h_start],
            prev: null
        }

        stateRef.current = state;

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

        // Resize handling
        const onResize = () => {
            camera.aspect = aspect;
            camera.updateProjectionMatrix();
            renderer.setSize(width, height);
        };

        window.addEventListener("resize", onResize);

        const handleMouseDown = (event) => {

            const mouseX = ( event.clientX );
            const mouseY = ( event.clientY );
            mouseDownPos.current = {
                x: mouseX,
                y: mouseY
            };

        };
    
        const handleMouseUp = (event) => {

            if (event.button !== 0) {
                return;
            }

            const mouseX = ( event.clientX );
            const mouseY = ( event.clientY );
            mouseUpPos.current = {
                x: mouseX,
                y: mouseY
            };

            if (mouseDownPos.current && mouseUpPos.current) {

                const w = uniforms.top_right.value[0] - uniforms.bot_left.value[0];

                const scale = w / width;

                const old_bot_left = uniforms.bot_left.value;
                
                const mouse_down_x = mouseDownPos.current.x;
                const mouse_down_y = height - mouseDownPos.current.y;

                const mouse_up_x = mouseUpPos.current.x;
                const mouse_up_y = height - mouseUpPos.current.y;

                // lets not do anything if the selection is very small
                if (Math.abs(mouse_up_x - mouse_down_x) < 5) {
                    return;
                }

                const new_height = (mouse_up_x - mouse_down_x) * aspect;

                const sgn_x = mouse_up_x > mouse_down_x ? 1 : -1;
                const sgn_y = mouse_up_y > mouse_down_y ? 1 : -1;

                let new_bot_left = [0, 0];
                let new_top_right = [0, 0];

                if ( sgn_x > 0 && sgn_y > 0) {
                    new_bot_left = [old_bot_left[0] + scale * mouse_down_x, old_bot_left[1] + scale * mouse_down_y];

                    new_top_right = [old_bot_left[0] + scale * mouse_up_x, new_bot_left[1] + scale * new_height];
                }
                else if ( sgn_x < 0 && sgn_y > 0) {
                    new_top_right = [old_bot_left[0] + scale * mouse_down_x, old_bot_left[1] + scale * mouse_up_y];

                    new_bot_left = [old_bot_left[0] + scale * mouse_up_x, new_top_right[1] + scale * new_height];
                }
                else if (sgn_x < 0 && sgn_y < 0) {
                    new_top_right = [old_bot_left[0] + scale * mouse_down_x, old_bot_left[1] + scale * mouse_down_y];

                    new_bot_left = [old_bot_left[0] + scale * mouse_up_x, new_top_right[1] + scale * new_height];
                }
                else {
                    new_bot_left = [old_bot_left[0] + scale * mouse_down_x, old_bot_left[1] + scale * mouse_up_y];

                    new_top_right = [old_bot_left[0] + scale * mouse_up_x, new_bot_left[1] + scale * new_height];
                }

                uniforms.bot_left.value = new_bot_left;
                uniforms.top_right.value = new_top_right;

                const newState = {
                    bot_left: new_bot_left,
                    top_right: new_top_right,
                    prev: stateRef.current
                }

                stateRef.current = newState;
                
                renderer.render(scene, camera);

            }

        };

        const handleMouseMove = (event) => {
            const mouseX = ( event.clientX );
            const mouseY = ( event.clientY );
            mousePos.current = {
                x: mouseX,
                y: mouseY
            };
        };

        const handleRightClick = (event) => {
            event.preventDefault();
            if (stateRef.current.prev) {
                const prevState = stateRef.current.prev;
                const prev_bot_left = prevState.bot_left;
                const prev_top_right = prevState.top_right;

                console.log('(',prev_bot_left,', ', prev_top_right,')');

                uniforms.bot_left.value = prev_bot_left;
                uniforms.top_right.value = prev_top_right;

                stateRef.current = prevState;

                renderer.render(scene, camera);
            }
            return false;
        };
    
        window.addEventListener("mousedown", handleMouseDown);
        window.addEventListener("mouseup", handleMouseUp);
        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("contextmenu", handleRightClick);

        renderer.render(scene, camera);
      

        return () => {
            window.removeEventListener("contextmenu", handleRightClick);
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mousedown", handleMouseDown);
            window.removeEventListener("mouseup", handleMouseUp);
            window.removeEventListener("resize", onResize);
            renderer.dispose();
            scene.remove(plane);
            if (mountRef.current) {
                mountRef.current.removeChild(renderer.domElement);
            }
            };
    }, []);

    return (<div>
                <div id="canvas" ref={mountRef} />
            </div>);
};

export default Mandelbrot;