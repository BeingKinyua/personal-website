import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { useReducedMotion } from "../../hooks/useReducedMotion";

export const HeroCanvas: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion || !containerRef.current) return;

    // Check WebGL availability
    try {
      const canvasTest = document.createElement("canvas");
      const gl = canvasTest.getContext("webgl") || canvasTest.getContext("experimental-webgl");
      if (!gl) return;
    } catch (e) {
      return;
    }

    const container = containerRef.current;
    let width = container.clientWidth || window.innerWidth;
    let height = container.clientHeight || 450;

    // Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 18;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Root Group
    const systemGroup = new THREE.Group();
    scene.add(systemGroup);

    // 1. Central Icosahedron Wireframe
    const icoGeo = new THREE.IcosahedronGeometry(4.2, 1);
    const icoMat = new THREE.MeshBasicMaterial({
      color: 0x3b82f6,
      wireframe: true,
      transparent: true,
      opacity: 0.22
    });
    const icosahedron = new THREE.Mesh(icoGeo, icoMat);
    systemGroup.add(icosahedron);

    // 2. Inner Architectural Octahedron
    const octaGeo = new THREE.OctahedronGeometry(2.5, 0);
    const octaMat = new THREE.MeshBasicMaterial({
      color: 0x93c5fd,
      wireframe: true,
      transparent: true,
      opacity: 0.35
    });
    const octahedron = new THREE.Mesh(octaGeo, octaMat);
    systemGroup.add(octahedron);

    // 3. Floating Node Points
    const nodeCount = 38;
    const nodePositions = new Float32Array(nodeCount * 3);
    for (let i = 0; i < nodeCount; i++) {
      const radius = 5.5 + Math.random() * 2.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      nodePositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      nodePositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      nodePositions[i * 3 + 2] = radius * Math.cos(phi);
    }
    const nodeGeo = new THREE.BufferGeometry();
    nodeGeo.setAttribute("position", new THREE.BufferAttribute(nodePositions, 3));
    const nodeMat = new THREE.PointsMaterial({
      color: 0x60a5fa,
      size: 0.16,
      transparent: true,
      opacity: 0.6
    });
    const nodes = new THREE.Points(nodeGeo, nodeMat);
    systemGroup.add(nodes);

    // 4. Subtle Orbital Ring
    const ringGeo = new THREE.RingGeometry(6.5, 6.55, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.08
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 3;
    systemGroup.add(ring);

    // Mouse Parallax
    let targetRotationX = 0;
    let targetRotationY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      targetRotationY = ((e.clientX / innerWidth) - 0.5) * 0.4;
      targetRotationX = ((e.clientY / innerHeight) - 0.5) * 0.3;
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    // Animation Loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Slow ambient rotations
      icosahedron.rotation.x += 0.0012;
      icosahedron.rotation.y += 0.0018;

      octahedron.rotation.x -= 0.0022;
      octahedron.rotation.y -= 0.0015;

      nodes.rotation.y += 0.0008;
      ring.rotation.z += 0.0005;

      // Smooth mouse easing
      systemGroup.rotation.y += (targetRotationY - systemGroup.rotation.y) * 0.05;
      systemGroup.rotation.x += (targetRotationX - systemGroup.rotation.x) * 0.05;

      renderer.render(scene, camera);
    };

    animate();

    // Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: newWidth, height: newHeight } = entry.contentRect;
        if (newWidth && newHeight) {
          camera.aspect = newWidth / newHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(newWidth, newHeight);
        }
      }
    });

    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("mousemove", handleMouseMove);
      resizeObserver.disconnect();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      icoGeo.dispose();
      icoMat.dispose();
      octaGeo.dispose();
      octaMat.dispose();
      nodeGeo.dispose();
      nodeMat.dispose();
      ringGeo.dispose();
      ringMat.dispose();
      renderer.dispose();
    };
  }, [prefersReducedMotion]);

  if (prefersReducedMotion) {
    return (
      <div className="w-full h-full flex items-center justify-center opacity-30 pointer-events-none">
        <div className="w-48 h-48 rounded-full border border-blue-500/20 border-dashed animate-none" />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      id="hero-3d-canvas"
      className="w-full h-full min-h-[320px] pointer-events-none select-none relative"
      aria-hidden="true"
    />
  );
};
