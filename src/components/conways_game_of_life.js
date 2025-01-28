import React, { useEffect, useState, useRef } from "react";
import * as THREE from "three";


const populateGrid = (grid, radius, rowNum, colNum) => {
    // randomly initialize a section in the middle
    let gridcp = [...grid];
    for (let i = -radius; i <= radius; i++) {
        for (let j = -radius; j <= radius; j++) {
            if (Math.sqrt(i*i + j*j) <= radius) {
                const indx = (Math.floor(colNum/2) + i + colNum) % colNum;
                const indy = (Math.floor(rowNum/2) + j + rowNum) % rowNum;
                gridcp[indx + indy * colNum] = (Math.random() > 0.5 ? 255 : 0);
            }
        }
    }
    return gridcp;
};

const nextGen = (rows, cols, currentGrid) => {
    return currentGrid.map((cell, idx) => {
    const row = Math.floor(idx / cols);
    const col = idx % cols;

    const neighbors = [
        currentGrid[((row - 1 + rows) % rows) * cols + ((col - 1 + cols) % cols)],
        currentGrid[((row - 1 + rows) % rows) * cols + col],
        currentGrid[((row - 1 + rows) % rows) * cols + ((col + 1) % cols)],
        currentGrid[row * cols + ((col - 1 + cols) % cols)],
        currentGrid[row * cols + ((col + 1) % cols)],
        currentGrid[((row + 1) % rows) * cols + ((col - 1 + cols) % cols)],
        currentGrid[((row + 1) % rows) * cols + col],
        currentGrid[((row + 1) % rows) * cols + ((col + 1) % cols)],
    ];

    const aliveNeighbors = neighbors.filter((n) => n === 255).length;

    if (cell === 255 && (aliveNeighbors < 2 || aliveNeighbors > 3)) {
        return 0;
    }
    if (cell === 0 && aliveNeighbors === 3) {
        return 255;
    }
    return cell;
    });
};

const GameOfLife = () => {
    const mountRef = useRef(null);
    const textureRef = useRef(null);
    const clockRef = useRef(null);
    const interval = 0.033;
    const mousePressed = useRef(false);
    const mousePosX = useRef(0);
    const mousePosY = useRef(0);

    useEffect(() => {
        // Scene setup
        const scene = new THREE.Scene();
        const camera = new THREE.OrthographicCamera( - 1, 1, 1, - 1, 0, 1 );
        const renderer = new THREE.WebGLRenderer();
        renderer.setSize(window.innerWidth, window.innerHeight);
        mountRef.current.appendChild(renderer.domElement);
        
        const width = window.innerWidth;
        const height = window.innerHeight;
        const aspect = width / height;
        const rowNum = Math.round(width/3.5);
        const colNum = Math.round(rowNum * aspect);

        let grid = new Uint8Array(rowNum * colNum).fill(0);

        grid.set(populateGrid(grid, 150, rowNum, colNum));

        let texture = new THREE.DataTexture(grid, colNum, rowNum, THREE.RedFormat, THREE.UnsignedByteType);
        texture.magFilter = THREE.LinearFilter;
        texture.minFilter = THREE.LinearFilter;
        //texture.repeat.set(width, height);
        texture.needsUpdate = true;
        textureRef.current = texture;

        // Geometry
        const planeGeometry = new THREE.PlaneGeometry(2, 2);
        //const shaderMaterial = new THREE.ShaderMaterial({
        //    vertexShader,
        //    fragmentShader,
        //    uniforms,
        //});
        //shaderMaterial.needsUpdate = true;

        const material = new THREE.MeshBasicMaterial({map: texture});

        const plane = new THREE.Mesh(planeGeometry, material);

        scene.add(plane);

        // Animation loop
        const clock = new THREE.Clock();
        clockRef.current = clock;
        let time_passed = 0;
        const animate = () => {

            if (mousePressed?.current == true && mousePosX.current && mousePosY.current) {
                const posX = mousePosX.current;
                const posY = mousePosY.current;
                
                let gridcp = [...grid];
                for (let i = -10; i <= 10; i++) {
                    for (let j = -10; j <= 10; j++) {
                        if (Math.sqrt(i*i + j*j) <= 10) {
                            const indx = (posX + i + colNum) % colNum;
                            const indy = (posY + j + rowNum) % rowNum;
                            gridcp[indx + indy * colNum] = (Math.random() > 0.5 ? 255 : 0);
                        }
                    }
                }

                grid.set(gridcp);
                texture.needsUpdate = true;
                material.needsUpdate = true;
            }

            time_passed += clock.getDelta();
            if (time_passed > interval) {
                grid.set(nextGen(rowNum, colNum, grid));
                texture.needsUpdate = true;
                material.needsUpdate = true;
                time_passed = 0;
            }
            requestAnimationFrame(animate);
            renderer.render(scene, camera);
        };

        animate();

        // Resize handling
        const onResize = () => {

            camera.aspect = aspect;
            camera.updateProjectionMatrix();
            renderer.setSize(width, height);
        };

        window.addEventListener("resize", onResize);

        const handleMouseDown = (event) => {
            mousePressed.current = true;
        };
    
        const handleMouseUp = (event) => {
            mousePressed.current = false;
        };

        const handleMouseMove = (event) => {
            const mouseX = ( event.clientX / width );
            const mouseY = - ( event.clientY / height );

            const posX = Math.floor(mouseX * colNum);
            const posY = Math.floor(mouseY * rowNum);

            mousePosX.current = posX;
            mousePosY.current = posY;

        };

        const handleMouseLeave = () => {
            mousePressed.current = false;
        };
    
        window.addEventListener("mouseLeave", handleMouseLeave);
        window.addEventListener("mousedown", handleMouseDown);
        window.addEventListener("mouseup", handleMouseUp);
        window.addEventListener("mousemove", handleMouseMove);
      

        return () => {
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

export default GameOfLife;