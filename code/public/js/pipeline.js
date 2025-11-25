const shift = 400, width = 800, height = 800, depth = 10, cameraTilt = 20 * (Math.PI / 180)

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

    // Rotate object in model space
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

function projectModel(model, x = 0, y = 0) {
    const screenProjection = [
        [width / 2, 0, 0, width / 2],
        [0, height / 2, 0, height / 2],
        [0, 0, depth / 2, depth / 2],
        [0, 0, 0, 1]
    ]

    let points2D = []

    // Scale to screen
    for (let i = 0; i < model.length; i++) {
        points2D.push(matrixMult([model[i]], screenProjection).flat().slice(0, 2).map((el, i) => i == 0 ? el + x : el + y))
    }

    return points2D
}

function drawYAxis() {
    const rotatedAxis = []

    return rotatedAxis
}


onmessage = (e) => {
    console.log("yaya")
    setTimeout(() => postMessage("blarg brah"), 2000)
}