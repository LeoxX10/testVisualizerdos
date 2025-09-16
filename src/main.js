// Ocultar la pantalla de transición después de 2 segundos
window.addEventListener('load', () => {
  const transitionScreen = document.getElementById('transition-screen');
  setTimeout(() => {
    transitionScreen.classList.add('hide');
    // Eliminar el elemento después de que termine la animación
    setTimeout(() => {
      transitionScreen.style.display = 'none';
    }, 1000); // Tiempo igual a la duración de la transición en CSS
  }, 0); // 2 segundos
});

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { FocusShader } from 'three/addons/shaders/FocusShader.js';

// 1. Configuración básica de la escena
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xdddddd);

// 2. Obtener el contenedor de la escena y configurar la cámara
const vestidorScene = document.getElementById('vestidor-scene');
const camera = new THREE.PerspectiveCamera(
  50,
  vestidorScene.clientWidth / vestidorScene.clientHeight,
  0.1,
  1000
);

// Posición inicial de la cámara para vista general
camera.position.set(0, 0.5, 2.5);

// 3. Configuración del renderizador
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(vestidorScene.clientWidth, vestidorScene.clientHeight);
document.getElementById('vestidor-scene').appendChild(renderer.domElement);

// Configuración del EffectComposer para el efecto de blur
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

// Configuración del shader de enfoque
const focusShader = new ShaderPass(FocusShader);
focusShader.uniforms.screenWidth.value = vestidorScene.clientWidth;
focusShader.uniforms.screenHeight.value = vestidorScene.clientHeight;
composer.addPass(focusShader);

// 4. Añadir luces a la escena
const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(1, 1, 1);
scene.add(directionalLight);

// 5. Cargar el avatar
const loader = new GLTFLoader();
let avatar = null;
let currentAvatar = 1;

// Función para cargar un avatar
function cargarAvatar(modelPath) {
  if (avatar) {
    scene.remove(avatar);
  }

  loader.load(
    modelPath,
    (gltf) => {
      avatar = gltf.scene;
      avatar.scale.set(0.7, 0.7, 0.7);
      avatar.position.set(0, -0.68, 0);
      avatar.rotation.y = Math.PI / -5;
      scene.add(avatar);
      camera.lookAt(0, 0, 0);
    },
    undefined,
    (error) => {
      console.error('Error al cargar el avatar:', error);
    }
  );
}

// Cargar el primer avatar
cargarAvatar('/models/avatar_base.glb');

// 6. Configurar controles de órbita con límites
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enablePan = false;

// Límites de zoom para la vista general
controls.minDistance = 1.5;
controls.maxDistance = 1.5;

// Límites de rotación vertical
controls.minPolarAngle = Math.PI / 4;
controls.maxPolarAngle = Math.PI / 1.5;

// Función para enfocar en una parte específica del avatar con animación
function focusOn(part) {
  let targetPosition;
  let cameraPosition;
  let zoomLevel;

  switch (part) {
    case 'head':
      targetPosition = { x: 0, y: 0.5, z: 0 };
      cameraPosition = { x: 0, y: 0.8, z: 0.5 };
      zoomLevel = 0.5;
      break;
    case 'chest':
      targetPosition = { x: 0, y: 0, z: 0 };
      cameraPosition = { x: 0, y: 0.3, z: 0.5 };
      zoomLevel = 0.5;
      break;
    case 'legs':
      targetPosition = { x: 0, y: -0.8, z: 0 };
      cameraPosition = { x: 0, y: -0.5, z: 0.5 };
      zoomLevel = 0.5;
      break;
    case 'reset':
      targetPosition = { x: 0, y: 0, z: 0 };
      cameraPosition = { x: 0, y: 1, z: 1.5 };
      zoomLevel = 1.5;
      break;
  }

  // Animación para mover la cámara suavemente
  new TWEEN.Tween(camera.position)
    .to(cameraPosition, 1000)
    .easing(TWEEN.Easing.Quadratic.InOut)
    .start();

  new TWEEN.Tween(controls.target)
    .to(targetPosition, 1000)
    .easing(TWEEN.Easing.Quadratic.InOut)
    .start();

  // Aplicar efecto de blur
  if (part !== 'reset') {
    focusShader.uniforms.sampleDistance.value = 0.5;
    focusShader.uniforms.waveFactor.value = 0;
  } else {
    focusShader.uniforms.sampleDistance.value = 0;
    focusShader.uniforms.waveFactor.value = 0;
  }

  // Ajustar los límites de zoom temporalmente
  controls.minDistance = zoomLevel;
  controls.maxDistance = zoomLevel;
}

// Importar TWEEN para animaciones
import TWEEN from 'three/addons/libs/tween.module.js';

// 7. Función para cargar prendas
function cargarPrenda(modelPath) {
  loader.load(
    modelPath,
    (gltf) => {
      const prenda = gltf.scene;
      prenda.scale.set(0.7, 0.7, 0.7);
      prenda.position.set(0, -1, 0);
      scene.add(prenda);
    },
    undefined,
    (error) => {
      console.error('Error al cargar la prenda:', error);
    }
  );
}

// 8. Eventos para las miniaturas de ropa
document.querySelectorAll('.ropa-item').forEach(item => {
  item.addEventListener('click', () => {
    const modelPath = item.getAttribute('data-model');
    cargarPrenda(modelPath);
  });
});

// 9. Evento para cambiar de avatar
document.getElementById('change-avatar').addEventListener('click', () => {
  if (currentAvatar === 1) {
    cargarAvatar('/models/avatar_base2.glb');
    currentAvatar = 2;
  } else {
    cargarAvatar('/models/avatar_base.glb');
    currentAvatar = 1;
  }
});

// 10. Eventos para los botones de zoom
document.getElementById('zoom-head').addEventListener('click', () => focusOn('head'));
document.getElementById('zoom-chest').addEventListener('click', () => focusOn('chest'));
document.getElementById('zoom-legs').addEventListener('click', () => focusOn('legs'));
document.getElementById('zoom-reset').addEventListener('click', () => focusOn('reset'));

// 11. Ajustar al redimensionar la ventana
window.addEventListener('resize', () => {
  camera.aspect = vestidorScene.clientWidth / vestidorScene.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(vestidorScene.clientWidth, vestidorScene.clientHeight);
  composer.setSize(vestidorScene.clientWidth, vestidorScene.clientHeight);
  focusShader.uniforms.screenWidth.value = vestidorScene.clientWidth;
  focusShader.uniforms.screenHeight.value = vestidorScene.clientHeight;
});

// 12. Animación principal
function animate() {
  requestAnimationFrame(animate);
  TWEEN.update();
  controls.update();
  composer.render();
}
animate();
