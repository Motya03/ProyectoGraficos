var gl, program;
var currentRenderMode = 0;


var MaterialTurquoise = {
    mat_ambient: [0.1, 0.1, 0.1],
    mat_diffuse: [0.0, 0.7, 0.7],
    mat_specular: [0.8, 0.8, 0.8],
    alpha: 32.0
};

function setMode(mode) {
    currentRenderMode = mode;

    document.querySelectorAll('button').forEach((b, i) => {
        b.className = (i === mode) ? 'active' : '';
    });
    requestAnimationFrame(drawScene);
}


function getSphereData(radius, latBands, longBands) {
    let vertices = [];
    let indices = [];

    for (let lat = 0; lat <= latBands; lat++) {
        let theta = lat * Math.PI / latBands;
        let sinTheta = Math.sin(theta);
        let cosTheta = Math.cos(theta);

        for (let long = 0; long <= longBands; long++) {
            let phi = long * 2 * Math.PI / longBands;
            let sinPhi = Math.sin(phi);
            let cosPhi = Math.cos(phi);

            let x = cosPhi * sinTheta;
            let y = cosTheta;
            let z = sinPhi * sinTheta;

            // Position (radius * normal)
            vertices.push(radius * x, radius * y, radius * z);
            // Normal (x, y, z) - already unit length
            vertices.push(x, y, z);
        }
    }

    for (let lat = 0; lat < latBands; lat++) {
        for (let long = 0; long < longBands; long++) {
            let first = (lat * (longBands + 1)) + long;
            let second = first + longBands + 1;

            indices.push(first, second, first + 1);
            indices.push(second, second + 1, first + 1);
        }
    }
    return { vertices: vertices, indices: indices };
}

var exampleCube = getSphereData(1.0, 30, 30);

function getWebGLContext() {
    try { return document.getElementById("myCanvas").getContext("webgl2"); } catch (e) { }
    return null;
}

function initShaders() {
    const vs = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vs, document.getElementById("myVertexShader").textContent);
    gl.compileShader(vs);
    const fs = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fs, document.getElementById("myFragmentShader").textContent);
    gl.compileShader(fs);

    if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(fs));
        return;
    }

    program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    gl.useProgram(program);

    program.posAttr = gl.getAttribLocation(program, "VertexPosition");
    program.normAttr = gl.getAttribLocation(program, "VertexNormal");
    gl.enableVertexAttribArray(program.posAttr);
    gl.enableVertexAttribArray(program.normAttr);

    program.uModelView = gl.getUniformLocation(program, "modelViewMatrix");
    program.uProjection = gl.getUniformLocation(program, "projectionMatrix");
    program.uNormalMat = gl.getUniformLocation(program, "normalMatrix");


    program.uRenderMode = gl.getUniformLocation(program, "uRenderMode");
    program.uTime = gl.getUniformLocation(program, "uTime");
    program.uIsSun = gl.getUniformLocation(program, "uIsSun");
    program.uTextureType = gl.getUniformLocation(program, "uTextureType");
    program.uBlockerPos = gl.getUniformLocation(program, "uBlockerPos");
    program.uBlockerRadius = gl.getUniformLocation(program, "uBlockerRadius");

    program.uKa = gl.getUniformLocation(program, "Material.Ka");
    program.uKd = gl.getUniformLocation(program, "Material.Kd");
    program.uKs = gl.getUniformLocation(program, "Material.Ks");
    program.uAlpha = gl.getUniformLocation(program, "Material.alpha");

    program.uLa = gl.getUniformLocation(program, "Light.La");
    program.uLd = gl.getUniformLocation(program, "Light.Ld");
    program.uLs = gl.getUniformLocation(program, "Light.Ls");
    program.uLightPos = gl.getUniformLocation(program, "Light.Position");
}

function initBuffers(model) {
    model.vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, model.vbo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(model.vertices), gl.STATIC_DRAW);
    model.ibo = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.ibo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(model.indices), gl.STATIC_DRAW);
}

function drawSolid(model) {
    gl.bindBuffer(gl.ARRAY_BUFFER, model.vbo);
    gl.vertexAttribPointer(program.posAttr, 3, gl.FLOAT, false, 24, 0);
    gl.vertexAttribPointer(program.normAttr, 3, gl.FLOAT, false, 24, 12);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.ibo);
    gl.drawElements(gl.TRIANGLES, model.indices.length, gl.UNSIGNED_SHORT, 0);
}


// Variables de cámara FPS
var camPos = [0, 0, 10];
var camYaw = -90;
var camPitch = 0;
var camSpeed = 10.0;

// Input
var keys = {};
var drag = false, lastX = 0, lastY = 0;

function handleKeys(deltaTime) {
    const speed = camSpeed * deltaTime;

    // Convertir a radianes
    const yawRad = camYaw * Math.PI / 180;
    const pitchRad = camPitch * Math.PI / 180; // Usado para dirección real

    // Frente: (cosY cosP, sinP, sinY cosP)
    const front = [
        Math.cos(yawRad) * Math.cos(pitchRad),
        Math.sin(pitchRad),
        Math.sin(yawRad) * Math.cos(pitchRad)
    ];
    // Normalizar
    const len = Math.sqrt(front[0] * front[0] + front[1] * front[1] + front[2] * front[2]);
    front[0] /= len; front[1] /= len; front[2] /= len;

    // Derecha = Cross(Front, Up)
    const right = [0, 0, 0];
    vec3.cross(right, front, [0, 1, 0]);
    vec3.normalize(right, right);

    // W
    if (keys['KeyW']) {
        vec3.scaleAndAdd(camPos, camPos, front, speed);
    }
    // S
    if (keys['KeyS']) {
        vec3.scaleAndAdd(camPos, camPos, front, -speed);
    }
    // A
    if (keys['KeyA']) {
        vec3.scaleAndAdd(camPos, camPos, right, -speed);
    }
    // D
    if (keys['KeyD']) {
        vec3.scaleAndAdd(camPos, camPos, right, speed);
    }
}

function updateUniforms(modelMatrix, time, isSun, textureType, color, blockerPosWorld, blockerRadius) {
    // View Matrix
    const yawRad = camYaw * Math.PI / 180;
    const pitchRad = camPitch * Math.PI / 180;

    const front = [
        Math.cos(yawRad) * Math.cos(pitchRad),
        Math.sin(pitchRad),
        Math.sin(yawRad) * Math.cos(pitchRad)
    ];

    const target = [
        camPos[0] + front[0],
        camPos[1] + front[1],
        camPos[2] + front[2]
    ];

    const view = mat4.create();
    mat4.lookAt(view, camPos, target, [0, 1, 0]);

    const proj = mat4.create();
    mat4.perspective(proj, Math.PI / 4, gl.canvas.width / gl.canvas.height, 0.1, 100.0);

    const mv = mat4.create();
    mat4.multiply(mv, view, modelMatrix);

    gl.uniformMatrix4fv(program.uModelView, false, mv);
    gl.uniformMatrix4fv(program.uProjection, false, proj);

    if (program.uTime) gl.uniform1f(program.uTime, time);
    if (program.uIsSun) gl.uniform1i(program.uIsSun, isSun ? 1 : 0);
    if (program.uTextureType) gl.uniform1i(program.uTextureType, textureType);

    const nm = mat3.create();
    mat3.normalFromMat4(nm, mv);
    gl.uniformMatrix3fv(program.uNormalMat, false, nm);

    // Light Position (View Space)
    const lightWorldPos = [0.0, 0.0, 0.0];
    const lightViewPos = vec3.create();
    vec3.transformMat4(lightViewPos, lightWorldPos, view);
    gl.uniform3fv(program.uLightPos, lightViewPos);

    // Blocker (Shadow) Logic
    if (program.uBlockerPos && program.uBlockerRadius) {
        if (blockerPosWorld && blockerRadius > 0.0) {
            const blockerPosView = vec3.create();
            vec3.transformMat4(blockerPosView, blockerPosWorld, view);
            gl.uniform3fv(program.uBlockerPos, blockerPosView);
            gl.uniform1f(program.uBlockerRadius, blockerRadius);
        } else {
            gl.uniform3fv(program.uBlockerPos, [9999.0, 9999.0, 9999.0]);
            gl.uniform1f(program.uBlockerRadius, 0.0);
        }
    }

    if (program.uRenderMode) gl.uniform1i(program.uRenderMode, 0);

    // Material parameters
    gl.uniform3fv(program.uKa, [0.1, 0.1, 0.1]);
    let diff = color ? color : [0.0, 0.7, 0.7];
    gl.uniform3fv(program.uKd, diff);
    gl.uniform3fv(program.uKs, [0.5, 0.5, 0.5]);
    gl.uniform1f(program.uAlpha, 32.0);

    gl.uniform3f(program.uLa, 0.01, 0.01, 0.01);
    gl.uniform3f(program.uLd, 3.0, 3.0, 3.0);
    gl.uniform3f(program.uLs, 3.0, 3.0, 3.0);
}

var lastTime = 0;
function drawScene(now) {
    if (!now) now = 0;
    if (lastTime === 0) lastTime = now;

    const deltaTime = (now - lastTime) * 0.001;
    lastTime = now;
    const time = now * 0.001;

    handleKeys(deltaTime);

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // --- SOL ---
    let mSol = mat4.create();
    mat4.translate(mSol, mSol, [0, 0, 0]);
    mat4.rotateY(mSol, mSol, time * 0.2);
    mat4.scale(mSol, mSol, [2.0, 2.0, 2.0]);
    updateUniforms(mSol, time, true, 0, [1, 1, 0], null, 0);
    drawSolid(exampleCube);

    // --- Tierra Data ---
    const rEarth = 6.0;
    const speedEarth = 0.5;
    const earthX = Math.cos(time * speedEarth) * rEarth;
    const earthZ = Math.sin(time * speedEarth) * rEarth;
    const earthWorldPos = [earthX, 0, earthZ];

    // --- TIERRA ---
    let mP1 = mat4.create();
    mat4.translate(mP1, mP1, earthWorldPos);
    mat4.rotateY(mP1, mP1, time * 3.0);
    mat4.scale(mP1, mP1, [0.7, 0.7, 0.7]);
    updateUniforms(mP1, time, false, 1, [0.0, 0.4, 1.0], null, 0);
    drawSolid(exampleCube);

    // --- LUNA ---
    let mMoon = mat4.create();
    mat4.translate(mMoon, mMoon, earthWorldPos);
    mat4.rotateY(mMoon, mMoon, time * 2.0);
    mat4.translate(mMoon, mMoon, [1.5, 0, 0]);
    mat4.rotateY(mMoon, mMoon, time * 1.5);
    mat4.scale(mMoon, mMoon, [0.2, 0.2, 0.2]);
    updateUniforms(mMoon, time, false, 2, [0.6, 0.6, 0.6], earthWorldPos, 0.7);
    drawSolid(exampleCube);

    requestAnimationFrame(drawScene);
}

function initWebGL() {
    gl = getWebGLContext();
    if (!gl) return;
    gl.enable(gl.DEPTH_TEST);
    initShaders();
    initBuffers(exampleCube);

    const cvs = gl.canvas;

    // Teclado
    window.addEventListener('keydown', e => keys[e.code] = true);
    window.addEventListener('keyup', e => keys[e.code] = false);

    // Ratón
    cvs.onpointerdown = e => {
        drag = true;
        lastX = e.clientX;
        lastY = e.clientY;
        cvs.setPointerCapture(e.pointerId);
    };
    cvs.onpointerup = e => {
        drag = false;
        cvs.releasePointerCapture(e.pointerId);
    };
    cvs.onpointermove = e => {
        if (!drag) return;
        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;
        lastX = e.clientX;
        lastY = e.clientY;

        const sensitivity = 0.2;
        camYaw += dx * sensitivity;
        camPitch -= dy * sensitivity;

        if (camPitch > 89.0) camPitch = 89.0;
        if (camPitch < -89.0) camPitch = -89.0;
    };
    // Deshabilitar zoom rueda
    cvs.onwheel = e => e.preventDefault();

    requestAnimationFrame(drawScene);
}

window.onload = initWebGL;
