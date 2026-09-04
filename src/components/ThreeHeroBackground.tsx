import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function ThreeHeroBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Graceful delay so it gets fully noticed after ~3 seconds
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 1200); // Trigger a bit earlier to feel responsive

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Scene Setup
    const scene = new THREE.Scene();

    // 2. Camera Setup
    const width = container.clientWidth;
    const height = container.clientHeight;
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.set(0, 5, 28);
    camera.lookAt(0, 0, 0);

    // 3. Renderer Setup with transparent background
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // 4. Create Neural network + blueprint nodes
    const nodeCount = 55;
    const nodeGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(nodeCount * 3);
    const velocities: { x: number; y: number; z: number }[] = [];

    // Distribute points in a spherical/ellipsoid cloud
    for (let i = 0; i < nodeCount; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 8 + Math.random() * 6; // distance from center

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta) * 0.7; // slight squish
      const z = r * Math.cos(phi);

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      velocities.push({
        x: (Math.random() - 0.5) * 0.015,
        y: (Math.random() - 0.5) * 0.012,
        z: (Math.random() - 0.5) * 0.015,
      });
    }

    nodeGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    // Custom circular points material
    const pointsMaterial = new THREE.PointsMaterial({
      color: 0xc3c0ff,
      size: 0.18,
      transparent: true,
      opacity: 0.7,
      sizeAttenuation: true,
    });

    const points = new THREE.Points(nodeGeometry, pointsMaterial);
    scene.add(points);

    // 5. Connecting lines wireframe
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x8d89ff,
      transparent: true,
      opacity: 0.15,
      linewidth: 1,
    });

    // Create a mesh/line layout updated per frame
    const lineGeometry = new THREE.BufferGeometry();
    const maxConnections = (nodeCount * (nodeCount - 1)) / 2;
    const linePositions = new Float32Array(maxConnections * 2 * 3);
    lineGeometry.setAttribute("position", new THREE.BufferAttribute(linePositions, 3));

    const lineSegments = new THREE.LineSegments(lineGeometry, lineMaterial);
    scene.add(lineSegments);

    // 6. Architectural Blueprint Blueprint Grids
    // A subtle rotating wireframe grid below the center
    const gridHelperY = new THREE.GridHelper(24, 12, 0xc3c0ff, 0x48466d);
    gridHelperY.position.y = -6;
    if (Array.isArray(gridHelperY.material)) {
      gridHelperY.material.forEach((mat) => {
        mat.transparent = true;
        mat.opacity = 0.08;
      });
    } else {
      gridHelperY.material.transparent = true;
      gridHelperY.material.opacity = 0.08;
    }
    scene.add(gridHelperY);

    // A subtle concentric structural ring to suggest systems planning
    const ringGroup = new THREE.Group();
    const ringColors = [0xc3c0ff, 0x8d89ff];
    for (let r = 4; r <= 16; r += 6) {
      const circleGeo = new THREE.RingGeometry(r, r + 0.04, 64);
      const circleMat = new THREE.MeshBasicMaterial({
        color: ringColors[r % ringColors.length],
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.04,
      });
      const ringMesh = new THREE.Mesh(circleGeo, circleMat);
      ringMesh.rotation.x = Math.PI / 2;
      ringMesh.position.y = -4;
      ringGroup.add(ringMesh);
    }
    scene.add(ringGroup);

    // 7. Dynamic interaction with Mouse Movements
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const handleMouseMove = (event: MouseEvent) => {
      mouseX = (event.clientX / window.innerWidth) * 2 - 1;
      mouseY = -(event.clientY / window.innerHeight) * 2 - 1;
    };

    window.addEventListener("mousemove", handleMouseMove);

    // 8. Animation loop
    let animationFrameId: number;
    let time = 0;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      time += 0.001;

      // Slow orbital rotation
      points.rotation.y += 0.0007;
      points.rotation.x += 0.0003;
      ringGroup.rotation.z -= 0.0004;
      gridHelperY.rotation.y += 0.0003;

      // Update node positions with their velocities
      const posAttr = nodeGeometry.getAttribute("position") as THREE.BufferAttribute;
      const arr = posAttr.array as Float32Array;

      for (let i = 0; i < nodeCount; i++) {
        // Move points
        arr[i * 3] += velocities[i].x;
        arr[i * 3 + 1] += velocities[i].y;
        arr[i * 3 + 2] += velocities[i].z;

        // Contain points inside spherical boundary box
        const currentDist = Math.sqrt(
          arr[i * 3] * arr[i * 3] +
            arr[i * 3 + 1] * arr[i * 3 + 1] +
            arr[i * 3 + 2] * arr[i * 3 + 2]
        );

        if (currentDist > 16) {
          velocities[i].x *= -1;
          velocities[i].y *= -1;
          velocities[i].z *= -1;
        }
      }
      posAttr.needsUpdate = true;

      // Dynamically calculate lines connecting close points
      let lineIdx = 0;
      const linesArray = lineGeometry.getAttribute("position").array as Float32Array;

      // Only check links between nearby nodes
      for (let i = 0; i < nodeCount; i++) {
        const x1 = arr[i * 3];
        const y1 = arr[i * 3 + 1];
        const z1 = arr[i * 3 + 2];

        for (let j = i + 1; j < nodeCount; j++) {
          const x2 = arr[j * 3];
          const y2 = arr[j * 3 + 1];
          const z2 = arr[j * 3 + 2];

          const dist = Math.sqrt(
            (x1 - x2) ** 2 + (y1 - y2) ** 2 + (z1 - z2) ** 2
          );

          if (dist < 6.8) {
            // Vertex A
            linesArray[lineIdx++] = x1;
            linesArray[lineIdx++] = y1;
            linesArray[lineIdx++] = z1;
            // Vertex B
            linesArray[lineIdx++] = x2;
            linesArray[lineIdx++] = y2;
            linesArray[lineIdx++] = z2;
          }
        }
      }

      // Rest of the array slots are zeroed out so they don't render
      const totalPointsCount = maxConnections * 2 * 3;
      for (let k = lineIdx; k < totalPointsCount; k++) {
        linesArray[k] = 0;
      }
      lineGeometry.getAttribute("position").needsUpdate = true;

      // Dynamic parallax rotation aligned to Mouse moves
      targetX = mouseX * 2.2;
      targetY = mouseY * 2.2;

      // Lerp camera target rotations for ultra silk feel
      camera.position.x += (targetX - camera.position.x) * 0.02;
      camera.position.y += (5 + targetY - camera.position.y) * 0.02;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };

    animate();

    // Scroll reaction: scale 1 -> 0.82, Opacity 100% -> 35%
    const scrollAnimation = gsap.fromTo(container,
      { scale: 1, opacity: 1 },
      {
        scale: 0.82,
        opacity: 0.35,
        scrollTrigger: {
          trigger: "#hero",
          start: "top top",
          end: "bottom top",
          scrub: true,
          invalidateOnRefresh: true,
        }
      }
    );

    // 9. Resize Handling via ResizeObserver
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(container);

    // 10. Cleanups
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrameId);
      scrollAnimation.scrollTrigger?.kill();
      scrollAnimation.kill();
      resizeObserver.unobserve(container);
      resizeObserver.disconnect();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      // dispose geometries/materials
      nodeGeometry.dispose();
      pointsMaterial.dispose();
      lineGeometry.dispose();
      lineMaterial.dispose();
      gridHelperY.dispose();
      ringGroup.children.forEach((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach((mat) => mat.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      id="three-hero-web-canvas"
      className={`absolute inset-0 w-full h-full z-0 pointer-events-none transition-all duration-[3000ms] ease-out ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
    />
  );
}
