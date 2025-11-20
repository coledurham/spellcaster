import models from '/assets/models.json' with { type: 'json' }

const { pyramid: model } = models

const canvas = document.querySelector("canvas")
const ctx = canvas.getContext("2d")
const shift = 200, width = 400, height = 400, depth = 10, cameraTilt = 20 * (Math.PI / 180)

const palette = ["#708090", "#0000FF", "#9932CC", "#2F4F4F", "#FF00FF", "#00FF00", "#708090", "#FFA500"]
let facePalette = []

let angle = 0, angleInc = 2.5, direction = -1, prev = null, animate = true, fill = "indigo", stroke = "red"

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

const camRotationVertical = [
    [1, 0, 0, 0],
    [0, Math.cos(cameraTilt), -Math.sin(cameraTilt), 0],
    [0, Math.sin(cameraTilt), Math.cos(cameraTilt), 0],
    [0, 0, 0, 1]
]

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

function rotateWorld(model) {
    const rotatedWorld = []

    // Rotate cube in model space
    for (let k = 0; k < model.length; k++) {
        rotatedWorld.push(matrixMult(camRotationVertical, model[k].map(el => [el])).flat())
    }

    return rotatedWorld
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
    // Project into ndc space as orthographic perspective
    const orthoProjection = [
        [2 / width, 0, 0, 0],
        [0, 2 / height, 0, 0],
        [0, 0, 2 / (depth - 1), -(depth + 1) / (depth - 1)],
        [0, 0, 0, 1]
    ]

    const normalizedModel = []
    // Scale to NDC orthogrpahic space

    for (let i = 0; i < model.length; i++) {
        normalizedModel.push(matrixMult(orthoProjection, model[i].map(el => [el])))
    }

    return normalizedModel
}

function projectModel(model) {
    const screenProjection = [
        [width / 2, 0, 0, width / 2],
        [0, height / 2, 0, height / 2],
        [0, 0, depth / 2, depth / 2],
        [0, 0, 0, 1]
    ]

    let points2D = []

    // Scale to screen
    for (let i = 0; i < model.length; i++) {
        points2D.push(matrixMult([model[i]], screenProjection).flat().slice(0, 2))
    }

    return points2D
}

function clearScreen() {
    ctx.save()
    ctx.clearRect(0, 0, width, height)
    ctx.restore()
}

function drawYAxis() {
    const rotatedAxis = []

    return rotatedAxis
}

function renderObj(size, projected, facePalette) {
    if (size < 3)
        return

    for (let j = 0; j < projected.length; j += size) {
        let points = projected.slice(j, j + size)

        if (points.length < size)
            break

        ctx.beginPath()
        ctx.strokeStyle = "red"

        ctx.moveTo(points[0][0] + shift, points[0][1] + shift)

        for (let k = 1; k < points.length; k++) {
            ctx.lineTo(points[k][0] + shift, points[k][1] + shift)
        }

        ctx.closePath()

        // ctx.fillStyle = facePalette[j/size]
        // ctx.fill()

        ctx.stroke()
    }
}

function draw(timestamp) {
    if (!prev)
        prev = timestamp

    let deltaTime = timestamp - prev
    prev = timestamp

    if (deltaTime >= 16.67) {
        if (animate)
            angle += angleInc

        angle = Math.abs(angle) > 360 ? 0 : angle

        if (!facePalette || !facePalette.length) {
            const paletteSize = model.length / 4

            for (let i = 0; i < paletteSize; i++) {
                facePalette.push(palette[Math.floor(Math.random() * palette.length)])
            }
        }

        const inverted = invertModel(model, 180)
        const transformed = rotateModel(inverted, angle * direction)
        const worldTransformed = rotateWorld(transformed)
        const normalized = normalizeModel(worldTransformed)
        const projected = projectModel(normalized)

        ctx.save()

        ctx.fillStyle = "indigo"
        ctx.fillRect(0, 0, width, height)

        renderObj(4, projected, facePalette)

        ctx.restore()
    }
    window.requestAnimationFrame(draw)
}

window.requestAnimationFrame(draw)

document.querySelector("#animate").addEventListener("click", (e) => {
    animate = !animate
    document.querySelector('input[type="range"]#rotation').value = 0
})

document.querySelector("#direction").addEventListener("click", (e) => {
    direction *= -1
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