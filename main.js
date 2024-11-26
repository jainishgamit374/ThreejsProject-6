import * as THREE from "three";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader";
import CustomShaderMaterial from "three-custom-shader-material/vanilla";
import vertex from "./shaders/vertex.glsl";
import fragment from "./shaders/fragment.glsl";
import { Text } from "troika-three-text";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import textVertex from "./shaders/textVertex.glsl";
import gsap from "gsap";

// Environment setup with loading manager
const loadingManager = new THREE.LoadingManager();
const rgbeLoader = new RGBELoader(loadingManager);
const textureLoader = new THREE.TextureLoader(loadingManager);

// Creating blobs values
const blobs = [
  {
    name: "Color Fusion",
    background: "#9D73F7",
    config: {
      uPositionFrequency: 1,
      uPositionStrength: 0.3,
      uSmallWavePositionFrequency: 0.5,
      uSmallWavePositionStrength: 0.7,
      roughness: 1,
      metalness: 0,
      envMapIntensity: 0.5,
      clearcoat: 0,
      clearcoatRoughness: 0,
      transmission: 0,
      flatShading: false,
      wireframe: false,
      map: "cosmic-fusion",
    },
  },
  {
    name: "Purple Mirror",
    background: "#5300B1",
    config: {
      uPositionFrequency: 0.584,
      uPositionStrength: 0.276,
      uSmallWavePositionFrequency: 0.899,
      uSmallWavePositionStrength: 1.266,
      roughness: 0,
      metalness: 1,
      envMapIntensity: 2,
      clearcoat: 0,
      clearcoatRoughness: 0,
      transmission: 0,
      flatShading: false,
      wireframe: false,
      map: "purple-rain",
    },
  },
  {
    name: "Alien Goo",
    background: "#45ACD8",
    config: {
      uPositionFrequency: 1.022,
      uPositionStrength: 0.99,
      uSmallWavePositionFrequency: 0.378,
      uSmallWavePositionStrength: 0.341,
      roughness: 0.292,
      metalness: 0.73,
      envMapIntensity: 0.86,
      clearcoat: 1,
      clearcoatRoughness: 0,
      transmission: 0,
      flatShading: false,
      wireframe: false,
      map: "lucky-day",
    },
  },
];

let isAnimating = false;
let currentIndex = 0;

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color("#3a3535");
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);
camera.position.z = 3;

// rgb loader
rgbeLoader.load(
  "https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/studio_small_08_1k.hdr",
  (texture) => {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    scene.environment = texture;
    scene.background = null;
  }
);

const uniforms = {
  uTime: { value: 0 },
  uPositionFrequency: { value: blobs[currentIndex].config.uPositionFrequency },
  uPositionStrength: { value: blobs[currentIndex].config.uPositionStrength },
  uTimeFrequency: { value: .3 },
  uSmallWavePositionFrequency: { value: blobs[currentIndex].config.uSmallWavePositionFrequency },
  uSmallWavePositionStrength: { value: blobs[currentIndex].config.uSmallWavePositionStrength },
  uSmallWaveTimeFrequency: { value: .3 },
};



// Object creation
const material = new CustomShaderMaterial({
  baseMaterial: new THREE.MeshPhysicalMaterial,
  vertexShader: vertex,
  map: textureLoader.load(`./gradients/${blobs[currentIndex].config.map}.png`),
  metalness: blobs[currentIndex].config.metalness,
  roughness: blobs[currentIndex].config.roughness,
  envMapIntensity: blobs[currentIndex].config.envMapIntensity,
  clearcoat: blobs[currentIndex].config.clearcoat,
  clearcoatRoughness: blobs[currentIndex].config.clearcoatRoughness,
  transmission: blobs[currentIndex].config.transmission,
  flatShading: blobs[currentIndex].config.flatShading,
  wireframe: blobs[currentIndex].config.wireframe,
  uniforms,
});

const mergeGeometry = mergeVertices(new THREE.IcosahedronGeometry(1, 90, 90));
mergeGeometry.computeTangents();

const cube = new THREE.Mesh(mergeGeometry, material);
scene.add(cube);

// Renderer setup
const canvas = document.querySelector("#draw");
const renderer = new THREE.WebGLRenderer({ canvas });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;
renderer.outputEncoding = THREE.sRGBEncoding;


// Window resize event listener
window.addEventListener("resize", function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Animation function
const clock = new THREE.Clock();

const textMaterial = new THREE.ShaderMaterial({
  fragmentShader: `void main() { gl_FragColor = vec4(1.0); }`,
  vertexShader: textVertex,
  side: THREE.DoubleSide,
  uniforms: {
    progress: { value: 0.0 }, // We have to animate it from 0.1 to 0.5
    direction: { value: 1 },
  },
});

const texts = blobs.map((blob, index) => {
  const myText = new Text();
  myText.text = blob.name;
  myText.font = `./aften_screen.woff`;
  myText.anchorX = "center";
  myText.anchorY = "middle";
  myText.material = textMaterial;
  myText.position.set(0, 0, 2);
  if (index !== 0) myText.scale.set(0, 0, 0);
  myText.letterSpacing = -0.08;
  myText.fontSize = window.innerWidth / 4000;
  myText.glyphGeometryDetail = 20;
  myText.sync();
  scene.add(myText);
  return myText;
});

// Wheel event listener

window.addEventListener("wheel", (e) => {
  if (isAnimating) return;
  isAnimating = true;
  let direction = Math.sign(e.deltaY);
  let next = (currentIndex + direction + blobs.length) % blobs.length;

  texts[next].scale.set(1, 1, 1);
  texts[next].position.x = direction * 3.5;

  gsap.to(textMaterial.uniforms.progress, {
    value: 0.5,
    duration: 1,
    ease: "power2.inOut",
    onComplete: () => {
      currentIndex = next;
      isAnimating = false;
      textMaterial.uniforms.progress.value = 0;
    },
  });

  gsap.to(texts[currentIndex].position, {
    x: -direction * 3,
    duration: 1,
    ease: "power2.inOut",
  });

  gsap.to(cube.rotation, {
    y: cube.rotation.y + Math.PI * 4 * -direction,
    duration: 1,
    ease: 'power2.inOut',
  })


  gsap.to(texts[next].position, {
    x: 0,
    duration: 1,
    ease: "power2.inOut",
  });

  // Update background color
  const bg = new THREE.Color(blobs[next].background);
  scene.background = bg;
  updateBlob(blobs[next].config);

});

function updateBlob(config) {
  if (config.uPositionFrequency !== undefined) gsap.to(material.uniforms.uPositionFrequency, { value: config.uPositionFrequency, duration: 1, ease: 'power2.inOut' });
  if (config.uPositionStrength !== undefined) gsap.to(material.uniforms.uPositionStrength, { value: config.uPositionStrength, duration: 1, ease: 'power2.inOut' });
  if (config.uSmallWavePositionFrequency !== undefined) gsap.to(material.uniforms.uSmallWavePositionFrequency, { value: config.uSmallWavePositionFrequency, duration: 1, ease: 'power2.inOut' });
  if (config.uSmallWavePositionStrength !== undefined) gsap.to(material.uniforms.uSmallWavePositionStrength, { value: config.uSmallWavePositionStrength, duration: 1, ease: 'power2.inOut' });
  if (config.uSmallWaveTimeFrequency !== undefined) gsap.to(material.uniforms.uSmallWaveTimeFrequency, { value: config.uSmallWaveTimeFrequency, duration: 1, ease: 'power2.inOut' });
  if (config.map !== undefined) {
    setTimeout(() => {
      material.map = textureLoader.load(`./gradients/${config.map}.png`);
    }, 400);
  }
  if (config.roughness !== undefined) gsap.to(material, { roughness: config.roughness, duration: 1, ease: 'power2.inOut' });
  if (config.metalness !== undefined) gsap.to(material, { metalness: config.metalness, duration: 1, ease: 'power2.inOut' });
  if (config.envMapIntensity !== undefined) gsap.to(material, { envMapIntensity: config.envMapIntensity, duration: 1, ease: 'power2.inOut' });
  if (config.clearcoat !== undefined) gsap.to(material, { clearcoat: config.clearcoat, duration: 1, ease: 'power2.inOut' });
  if (config.clearcoatRoughness !== undefined) gsap.to(material, { clearcoatRoughness: config.clearcoatRoughness, duration: 1, ease: 'power2.inOut' });
  if (config.transmission !== undefined) gsap.to(material, { transmission: config.transmission, duration: 1, ease: 'power2.inOut' });
  if (config.flatShading !== undefined) gsap.to(material, { flatShading: config.flatShading, duration: 1, ease: 'power2.inOut' });
  if (config.wireframe !== undefined) gsap.to(material, { wireframe: config.wireframe, duration: 1, ease: 'power2.inOut' });
}

loadingManager.onLoad = () => {
  function animate() {
    const delta = clock.getDelta();
    // controls.update();
    uniforms.uTime.value = clock.getElapsedTime();
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  const bg = new THREE.Color(blobs[currentIndex].background);
  gsap.to(scene.background, {
    r: bg.r,
    g: bg.g,
    b: bg.b,
    duration: 1,
    ease: "linear",
  });
  animate();
};
