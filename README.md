# Graficos WebGL
Proyecto Sistema Solar de la Asignatura Graficos por Computador.

## Nombres de los integrantes y de sus Usuarios GitHub
Matvei Shestakov -- Motya03


## Objetivo del proyecto

Este proyecto consiste en una simulacion interactiva del Sistema Solar implementada desde cero utilizando WebGL2 y JavaScript. El objetivo principal es lograr representaciones visuales realistas y detalladas de los planetas y otros objetos celestes. Se puede navegar libremente por el sistema solar y observar los planetas orbitando y rotando, con superficies generadas proceduralmente.

## Plan de Sprints

| 1 | Creacion de la idea del proyecto.
| 2 | Implamentacion de los objetos y Programacion de ls movimientos.
| 3 | Pulido de detalles, boton pausa, etc.


## Bitacora de trabajo 

| Fecha | Trabajo realizado | Problemas / Decisiones |
|--------|----------------------|-------------------------------|
| 29/12/2025 | Creacion de la idea del proyecto y creados el repositorio con el ReadME |  |
| 30/12/2025 | Sol con su emision de luz y movimiento de camara con WASD |  |
| 02/01/2026 | Modelo de Tierra que gira alrededor del sol y sobre su eje, Luna que gira alrededor de Tierra y de su eje. Y como le afecta la luz solar| La luna recibia luz aun estando detras de la Terra en ralacion al sol |
| 05/01/2026 | Los demas planetas, con tamanos , velocidades ajustados a la vida real. Luz ajustada. | Dificultados a la hora de representar bien los tamanos y movimientos de las orbitas  |
| 11/01/2026 | Detalles pulidos como asteroides, el boton de pausa y la orbita  visible |  |

## Resultados Finales

### Detalle Procedural
[![Novyj-risunok.png](https://i.postimg.cc/SNCbDggH/Novyj-risunok.png)](https://postimg.cc/KRGWYDS5)
 Detalle del shader de la Tierra. Los continentes, oceanos con profundidad simulada y capas de nubes, todo generado mediante funciones de ruido.*

[![Novyj-risunok-(1).png](https://i.postimg.cc/bJsKbgGV/Novyj-risunok-(1).png)](https://postimg.cc/JDC6Cb5j)
 Visualizacion de saturno con sus asteroides.*

[![Novyj-risunok-(2).png](https://i.postimg.cc/28pPb4zz/Novyj-risunok-(2).png)](https://postimg.cc/jCX8Bnw9)
 El Sol utiliza un shader animado con el tiempo para simular el plasma en su superficie.

[![Novyj-risunok-(3).png](https://i.postimg.cc/6344Ss2c/Novyj-risunok-(3).png)](https://postimg.cc/phxdh6B5)
 Todo el sistema solar con sus orbitas.

 ## Herramientas y Tecnologias
*   **HTML5 & CSS3**: Estructura base y estilizacion del canvas y la interfaz.
*   **JavaScript (ES6+)**: Logica de la aplicacion, bucle de renderizado, manejo de eventos y control de camara.
*   **WebGL 2.0**: API grafica de bajo nivel para el renderizado 3D acelerado por hardware.
*   **GLSL ES 3.0**: Lenguaje de programacion de shaders utilizado para calcular la geometria y, crucialmente, el coloreado procedural de cada pixel.
*   **gl-matrix**: Libreria externa para facilitar las operaciones de matrices 4x4 y vectores.

### Curiosidades y Detalles Tecnicos

1.  **Texturizado  Procedural**:
   * No se carga ninguna imagen para las texturas. Cada planeta se pinta matematicamente en el Fragment Shader.

2.  **Sistema de Iluminacion**:
    *   Implementacion del modelo de iluminacion Phong (Ambient + Diffuse + Specular).
    *   Calculo de atenuacion de la luz basado en la distancia al Sol.
    *   El sistema calcula intersecciones esfera-rayo en el shader para permitir que los cuerpos celestes proyecten sombras (eclipses) simples.

3.  **Camara y Control**:
    *   Se implemento una camara de vuelo libre  controlada con el teclado (WASD) y el raton.
4.  **Pausa y Orbita**:
    *   Con el espacio se pausa el sistema , y con el R aparecen los nombres y la orbita. 


###  Tareas pendientes / mejoras futuras
- [Proyecto completado] 








