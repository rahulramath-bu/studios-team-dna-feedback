import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

const HALFTONE_VERTEX_SHADER = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const HALFTONE_FRAGMENT_SHADER = `
  uniform sampler2D tDiffuse;
  uniform vec2 resolution;
  uniform float time;
  uniform float gridSize;
  uniform vec3 rubineColor;
  varying vec2 vUv;

  float drawPlusRounded(vec2 uv, vec2 center, float size, float thickness, float softness) {
    vec2 d = abs(uv - center);
    float horizontal = smoothstep(size + softness, size - softness, d.x) * smoothstep(thickness + softness, thickness - softness, d.y);
    float vertical = smoothstep(size + softness, size - softness, d.y) * smoothstep(thickness + softness, thickness - softness, d.x);
    return max(horizontal, vertical);
  }

  void main() {
    vec2 pixelCoord = vUv * resolution;
    vec2 gridCoord = floor(pixelCoord / gridSize);
    vec2 cellCenter = (gridCoord + 0.5) * gridSize;
    vec2 cellUv = pixelCoord - cellCenter;
    vec2 sampleUv = cellCenter / resolution;
    vec4 sampleColor = texture2D(tDiffuse, sampleUv);

    float intensity = max(sampleColor.r, max(sampleColor.g, sampleColor.b));
    float hasContent = step(0.05, intensity);
    float animPhase = sin(time * 1.5 + gridCoord.x * 0.3 + gridCoord.y * 0.4);
    float animatedIntensity = intensity * (0.85 + 0.15 * animPhase);
    float boostedIntensity = pow(animatedIntensity, 0.6);
    float plusSize = gridSize * 0.35 * boostedIntensity;
    float plusThickness = gridSize * 0.08;
    float softness = gridSize * 0.02;
    float minSize = gridSize * 0.04;
    float plus = drawPlusRounded(cellUv, vec2(0.0), plusSize, plusThickness, softness);
    float showPlus = plus * step(minSize, plusSize) * hasContent;

    gl_FragColor = vec4(rubineColor, showPlus);
  }
`;

const DEFAULT_HALFTONE_SETTINGS = {
  enabled: true,
  gridSize: 12,
  animationSpeed: 1.5,
  color: '#CE0058',
};

function HandModel({ modelScale = 1, rotationProgress }) {
  const groupRef = useRef(null);
  const { scene } = useGLTF('/models/female_hand.glb');

  const clonedScene = useMemo(() => {
    const clone = scene.clone();
    const box = new THREE.Box3().setFromObject(clone);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);

    clone.position.sub(center);
    clone.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.material = new THREE.MeshStandardMaterial({
          color: '#FFFFFF',
          emissive: '#000000',
          emissiveIntensity: 0,
          metalness: 0,
          roughness: 0.6,
        });
      }
    });

    return { clone, maxDim };
  }, [scene]);

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y =
      rotationProgress === undefined
        ? state.clock.elapsedTime * 0.15
        : rotationProgress * Math.PI * 2;
  });

  const scale = (3 * modelScale) / clonedScene.maxDim;

  return (
    <group rotation={[0.15, 0, -0.25]}>
      <group ref={groupRef} scale={[scale, scale, scale]}>
        <primitive object={clonedScene.clone} />
      </group>
    </group>
  );
}

function ConfigurableHalftoneEffect({ settings, backgroundColor = null }) {
  const { gl, scene, camera, size } = useThree();
  const materialRef = useRef(null);
  const renderTargetRef = useRef(null);
  const orthoCamera = useMemo(
    () => new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1),
    []
  );
  const quadScene = useMemo(() => new THREE.Scene(), []);

  useEffect(() => {
    renderTargetRef.current = new THREE.WebGLRenderTarget(size.width, size.height);

    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { value: null },
        resolution: { value: new THREE.Vector2(size.width, size.height) },
        time: { value: 0 },
        gridSize: { value: settings.gridSize },
        rubineColor: { value: new THREE.Color(settings.color ?? '#CE0058') },
      },
      vertexShader: HALFTONE_VERTEX_SHADER,
      fragmentShader: HALFTONE_FRAGMENT_SHADER,
    });
    const quad = new THREE.Mesh(geometry, material);

    materialRef.current = material;
    quadScene.add(quad);

    return () => {
      renderTargetRef.current?.dispose();
      geometry.dispose();
      material.dispose();
      quadScene.remove(quad);
    };
  }, [quadScene, settings.color, settings.gridSize, size.height, size.width]);

  useEffect(() => {
    renderTargetRef.current?.setSize(size.width, size.height);
    materialRef.current?.uniforms.resolution.value.set(size.width, size.height);
  }, [size.height, size.width]);

  useEffect(() => {
    if (!materialRef.current) return;
    materialRef.current.uniforms.gridSize.value = settings.gridSize;
    materialRef.current.uniforms.rubineColor.value.set(settings.color ?? '#CE0058');
  }, [settings.color, settings.gridSize]);

  useFrame((state) => {
    if (!renderTargetRef.current || !materialRef.current) return;

    materialRef.current.uniforms.time.value =
      state.clock.elapsedTime * settings.animationSpeed;

    gl.setRenderTarget(renderTargetRef.current);
    gl.render(scene, camera);
    gl.setRenderTarget(null);

    materialRef.current.uniforms.tDiffuse.value = renderTargetRef.current.texture;
    gl.setClearColor(backgroundColor ?? '#000000', backgroundColor ? 1 : 0);
    gl.clear();
    gl.render(quadScene, orthoCamera);
  }, 1);

  return null;
}

function HandScene({ settings, modelScale, rotationProgress }) {
  return (
    <>
      <color attach="background" args={['#000000']} />
      <ambientLight intensity={0.15} />
      <directionalLight position={[4, 6, 3]} intensity={4} />
      <directionalLight position={[-4, 2, 2]} intensity={0.8} />
      <directionalLight position={[-3, 0, -4]} intensity={1.5} />
      <spotLight position={[0, 4, 5]} intensity={3} angle={0.5} penumbra={0.3} />
      <HandModel modelScale={modelScale} rotationProgress={rotationProgress} />
      {settings.enabled && <ConfigurableHalftoneEffect settings={settings} />}
    </>
  );
}

export function HalftoneHand({
  className = '',
  dpr = [1, 2],
  fadeIn = true,
  modelScale = 1,
  rotationProgress,
  settings = DEFAULT_HALFTONE_SETTINGS,
}) {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setIsLoaded(true), 1000);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div
      className={className}
      style={{
        width: '100%',
        height: '100%',
        background: 'transparent',
        opacity: fadeIn ? (isLoaded ? 1 : 0) : 1,
        transition: fadeIn ? 'opacity 7s ease-out' : 'none',
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 4], fov: 50 }}
        dpr={dpr}
        gl={{
          alpha: true,
          antialias: true,
          premultipliedAlpha: false,
        }}
        style={{ background: 'transparent' }}
      >
        <HandScene
          modelScale={modelScale}
          rotationProgress={rotationProgress}
          settings={settings}
        />
      </Canvas>
    </div>
  );
}

useGLTF.preload('/models/female_hand.glb');
