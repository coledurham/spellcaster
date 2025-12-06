import models from '/assets/models.json' with { type: 'json' }

// const pipeline = new Worker("/scripts/pipeline.js")

const { pyramid: model } = models

const canvas = document.querySelector("canvas")
const ctx = canvas.getContext("2d")
const shift = 400, width = 800, height = 800, depth = 10, cameraTilt = 20 * (Math.PI / 180), modelTilt = 20 * (Math.PI / 180)

const palette = ["#708090", "#0000FF", "#9932CC", "#2F4F4F", "#FF00FF", "#00FF00", "#708090", "#FFA500"]
let facePalette = []

let angle = 0,
    angleInc = 2.5,
    direction = -1,
    prev = null,
    animate = true,
    deltaX = 0,
    deltaY = 0,
    deltaTime = 0,
    deltaInc = 400,
    eye = [0, 0, 1, 1],
    fill = "#08047dff",
    stroke = palette[palette.length - 3],
    filled = true,
    culled = true

function pointsToVec(p1, p2) {
    if (!p1 || !p2 || p1.length < 3 || p2.length < 3)
        return null

    return [
        p2[0] - p1[0],
        p2[1] - p1[1],
        p2[2] - p1[2]
    ]
}

function crossProduct(v1, v2) {
    if (!v1 || !v2 || v1.length < 3 || v2.length < 3)
        return NaN

    // Note: +0 prevents -0 case
    return [((v1[1] * v2[2]) - (v1[2] * v2[1]) + 0), ((v1[2] * v2[0]) - (v1[0] * v2[2])) + 0, ((v1[0] * v2[1]) - (v1[1] * v2[0])) + 0]
}

function dotProduct(v1, v2) {
    if (!v1 || !v2 || v1.length < 3 || v2.length < 3)
        return NaN

    return (v1[0] * v2[0]) + (v1[1] * v2[1]) + (v1[2] * v2[2])
}

function getUnitVec4(v) {
    // TODO: Expand to arbitrary dimenison and allow omisisons of 0..N fields starting at end
    const magnitude = Math.sqrt(Math.pow(v[0], 2) + Math.pow(v[1], 2) + Math.pow(v[2], 2))

    return [v[0] / magnitude, v[1] / magnitude, v[2] / magnitude, 1]
}

function genNormal(p1, p2, p3) {
    const v1 = pointsToVec(p2, p1), v2 = pointsToVec(p2, p3)

    return crossProduct(v1, v2)
}

function matrixMult(m, n) {
    const results = []

    if (!m || !n)
        throw new Error("ERROR: Matrix is missing or undefined")

    if (m[0].length !== n.length)
        throw new Error(`ERROR: Mismatched matrix lengths :: m :: ${m.length} x ${m[0].length} | n :: ${n.length} x ${n[0].length}`)

    for (let i = 0; i < m.length; i++) {
        let row = []

        for (let j = 0; j < n[0].length; j++) {
            let sum = 0

            for (let k = 0; k < m[i].length; k++) {
                sum += m[i][k] * n[k][j]
            }
            row.push(sum)
        }
        results.push(row)
    }

    return results
}

const modelRotateVertical = [
    [1, 0, 0, 0],
    [0, Math.cos(modelTilt), -Math.sin(modelTilt), 0],
    [0, Math.sin(modelTilt), Math.cos(modelTilt), 0],
    [0, 0, 0, 1]
]

const camRotationVertical = [
    [1, 0, 0, 0],
    [0, Math.cos(cameraTilt), -Math.sin(cameraTilt), 0],
    [0, Math.sin(cameraTilt), Math.cos(cameraTilt), 0],
    [0, 0, 0, 1]
]

const eyeRotationVertical = [
    [1, 0, 0, 0],
    [0, Math.cos(cameraTilt), -Math.sin(cameraTilt), 0],
    [0, Math.sin(cameraTilt), Math.cos(cameraTilt), 0],
    [0, 0, 0, 1]
]

const eyeInversionVertical = [
    [Math.cos(cameraTilt), -Math.sin(cameraTilt), 0, 0],
    [Math.sin(cameraTilt), Math.cos(cameraTilt), 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 1]
]

const orthoProjection = [
    [2 / width, 0, 0, 0],
    [0, 2 / height, 0, 0],
    [0, 0, 2 / (depth - 1), -(depth + 1) / (depth - 1)],
    [0, 0, 0, 1]
]

const translateModel = (model, dx = 0, dy = 0, dz = 0) => {
    const translationMatrix = [
        [1, 0, 0, dx],
        [0, 1, 0, dy],
        [0, 0, 1, dz],
        [0, 0, 0, 1]
    ]

    const translated = []

    for (let k = 0; k < model.length; k++) {
        translated.push(matrixMult(translationMatrix, model[k].map(el => [el])).flat())
    }

    return translated
}

function genRotateMatrix(theta) {
    const radians = theta * (Math.PI / 180)
    return [
        [Math.cos(radians), 0, Math.sin(radians), 0],
        [0, 1, 0, 0],
        [-Math.sin(radians), 0, Math.cos(radians), 0],
        [0, 0, 0, 1]
    ]
}

function genInversionMatrix(theta) {
    const radians = theta * (Math.PI / 180)
    return [
        [1, 0, 0, 0],
        [0, Math.cos(radians), -Math.sin(radians), 0],
        [0, Math.sin(radians), Math.cos(radians), 0],
        [0, 0, 0, 1]
    ]
}

function rotateModelVetical(model){
    const rotatedModel= []

    // Rotate model in world space
    for (let k = 0; k < model.length; k++) {
        rotatedModel.push(matrixMult(modelRotateVertical, model[k].map(el => [el])).flat())
    }

    return rotatedModel
}

function rotateWorld(model) {
    const rotatedWorld = []

    // Rotate model in world space
    for (let k = 0; k < model.length; k++) {
        rotatedWorld.push(matrixMult(camRotationVertical, model[k].map(el => [el])).flat())
    }

    return rotatedWorld
}

function rotateEye(eye) {
    const rotatedEye = []

    // Rotate camera opposite in world space
    for (let k = 0; k < eye.length; k++) {
        rotatedEye.push(matrixMult(eyeRotationVertical, eye[k].map(el => [el])).flat())
    }

    return rotatedEye
}

function invertModel(model, angle) {
    const inverted = genInversionMatrix(angle)

    const invertedObj = []

    // Invert object in model space
    for (let k = 0; k < model.length; k++) {
        invertedObj.push(matrixMult(inverted, model[k].map(el => [el])).flat())
    }

    return invertedObj
}

function rotateModel(model, angle) {
    const rotated = genRotateMatrix(angle)

    const rotatedObj = []

    // Rotate object in model space
    for (let k = 0; k < model.length; k++) {
        rotatedObj.push(matrixMult(rotated, model[k].map(el => [el])).flat())
    }

    return rotatedObj
}

function normalizeModel(model) {
    const culledModel = []

    // Scale to NDC orthogrpahic space
    const unitModel = model.map(el => getUnitVec4(el))

    for (let j = 0; j < unitModel.length; j += 4) {
        const verts = unitModel.slice(j, j + 4)
        const vecs = [pointsToVec([...verts[1]], [...verts[2]]), pointsToVec([...verts[1]], [...verts[0]])]
        const normal = crossProduct(...vecs)
        const cullDot = dotProduct(eye, normal)

        if(!culled && !filled){
            culledModel.push({ vertices: [...verts], index: j })
            continue
        }
        else if (cullDot > 0) {
            culledModel.push({ vertices: [...verts], index: j })
        }
    }

    return culledModel
}

function projectModel(model, x = 0, y = 0) {
    const screenProjection = [
        [width / 2, 0, 0, width / 2],
        [0, height / 2, 0, height / 2],
        [0, 0, depth / 2, depth / 2],
        [0, 0, 0, 1]
    ]

    let points2D = []
    let points = []

    // Scale to screen
    for (let i = 0; i < model.length; i++) {
        points = []

        for (let j = 0; j < model[i].vertices.length; j++) {
            points.push(matrixMult([model[i].vertices[j]], screenProjection).flat().slice(0, 3).map((el, k) => k == 0 ? el + x : el + y))
        }
        points2D.push({ vertices: [...points], index: model[i].index })
    }

    return points2D
}

function clearScreen() {
    ctx.save()
    ctx.clearRect(0, 0, width, height)
    ctx.restore()
}

function fillScreen() {
    ctx.save()
    ctx.fillStyle = fill
    ctx.fillRect(0, 0, width, height)
    ctx.restore()
}

function drawYAxis() {
    const rotatedAxis = []

    return rotatedAxis
}

function renderObj(size, projected, facePalette) {
    // if (size < 3)
    //     return
    for (let j = 0; j < projected.length; j++) {
        // let points = projected.slice(j, j + size)
        let points = projected[j].vertices

        // if (points.length < size)
        //     break

        ctx.beginPath()
        ctx.strokeStyle = stroke

        ctx.moveTo(points[0][0] + shift, points[0][1] + shift)

        for (let k = 1; k < points.length; k++) {
            ctx.lineTo(points[k][0] + shift, points[k][1] + shift)
        }

        ctx.closePath()

        if (filled) {
            ctx.fillStyle = facePalette[projected[j].index / size]
            ctx.fill()
        }

        ctx.stroke()
    }
}

function draw(timestamp) {
    if (!prev)
        prev = timestamp

    deltaTime = timestamp - prev
    prev = timestamp

    if (deltaTime >= 16.67) {
        if (animate)
            angle += angleInc

        angle = Math.abs(angle) > 360 ? 0 : angle

        if (!facePalette || !facePalette.length) {
            /* const paletteSize = model.length / 4

            for (let i = 0; i < paletteSize; i++) {
                facePalette.push(palette[Math.floor(Math.random() * palette.length)])
            } */

            facePalette = ["red", "green", "blue", "purple", "orange"]
        }

        const transformed = rotateModel(model, angle * direction)
        //const rotated = rotateModelVetical(transformed)
        const pushed = translateModel(transformed, 0, 0, 410)
        //const worldTransformed = rotateWorld(pushed)
        const inverted = invertModel(pushed, 180)
        const normalized = normalizeModel(inverted)
        const projected = projectModel(normalized, deltaX, deltaY)

        fillScreen()
        renderObj(4, projected, facePalette)
    }
    window.requestAnimationFrame(draw)
}

// eye = matrixMult(eyeRotationVertical, eye.map(el => [el])).flat()

window.requestAnimationFrame(draw)

document.querySelector("#animate").addEventListener("click", (e) => {
    animate = !animate
    document.querySelector('input[type="range"]#rotation').value = 0
})

document.querySelector("#direction").addEventListener("click", (e) => {
    direction *= -1
})

document.querySelector("#filled").addEventListener("click", (e) => {
    filled = !filled
})

document.querySelector("#culled").addEventListener("click", (e) => {
    culled = !culled
})

document.querySelector("#angle").addEventListener("change", (e) => {
    if (isNaN(parseFloat(e.target.value))) {
        parseFloat(e.target.value) = angleInc
    }
    else {
        angleInc = parseFloat(e.target.value)
    }
})

document.querySelector('input[type="range"]#rotation').addEventListener("change", (e) => {
    animate = false
    angle = isNaN(parseFloat(e.target.value)) ? 0 : parseFloat(e.target.value)
})

document.addEventListener("keydown", (e) => {
    switch (e.key.toLowerCase()) {
        case "arrowdown":
        case "s":
            deltaY += deltaInc * deltaTime / 1000
            break;
        case "arrowup":
        case "w":
            deltaY -= deltaInc * deltaTime / 1000
            break;
        case "arrowleft":
        case "a":
            deltaX -= deltaInc * deltaTime / 1000
            break;
        case "arrowright":
        case "d":
            deltaX += deltaInc * deltaTime / 1000
            break;
        case "h":
            deltaX = 0
            deltaY = 0
            break;
        case " ":
            animate = !animate
    }
})

// pipeline.postMessage("project")
// pipeline.onmessage = (e) => console.log("message from worker is :: ", e.data)