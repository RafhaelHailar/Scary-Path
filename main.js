import map from "./map.js";

const canvas = document.createElement("canvas");
const context = canvas.getContext("2d");

canvas.width = canvas.height = 700;
document.body.appendChild(canvas);

const size = 3;
let checkpoint;

let audio = document.getElementById("audio");
const bgAudio = document.getElementById("bg-audio");
const wallHitAudio = document.getElementById("wall-hit");


function drawMap() {
    context.clearRect(0,0,canvas.width,canvas.height);
    context.fillStyle = "black";
    context.fillRect(0,0,canvas.width,canvas.height);   
    map.forEach((row,y) => {
        row.forEach((element,x) => {
            if (element != 0) {
                context.fillStyle = element == 1 ? "white" : "blue";
                context.fillRect((canvas.width / row.length) * x,(canvas.height / map.length) * y,size,size);
            }

            if (element == 2) checkpoint = {x,y};
        });
    });
}

function pathFinder(from,paths,to) {
    const places = [{at: from,paths}];
    const directions = [
        [-1,0],[1,0],
        [0,-1],[0,1]
    ];
    
    for (let i = 0;i < places.length;i++) {
        let {at,paths} = places[i];
        let [atX,atY] = at;
        for (let [addX,addY] of directions) {
            const newPlace = [atX + addX,atY + addY];
            const [toX,toY] = to;
            if (newPlace[0] == toX && newPlace[1] == toY) return paths.concat([newPlace]);
            if (!places.some(place => place.at[0] == newPlace[0] && place.at[1] == newPlace[1]) &&
                map[newPlace[1]] != undefined && map[newPlace[1]][newPlace[0]] == 1) places.push({at: newPlace,paths: paths.concat([newPlace])});
        }
    }
}

drawMap();

function isInRange([from,to],number) {
    return number >= from && number < to;
}

function getDirectionFacing(angle) {
    const directions = {
        up: [[0,45],[315,361]],
        right: [[45,135]],
        down: [[135,225]],
        left: [[225,315]]
    };

    for (let direction in directions) {
        for (let range of directions[direction]) {
            if (isInRange(range,angle)) return direction;
        }
    }
}

function getShouldFaceAt(from,to) {
    let direction = [to[0] - from[0],to[1] - from[1]];
    if (direction[0] == -1) return "left";
    if (direction[0] == 1) return "right";
    if (direction[1] == -1) return "up";
    if (direction[1] == 1) return "down";
}

const player = {
    x: 30,
    y: 40,
    toX: 0,
    toY: 0,
    faceAt: 0,
    facing(number) {
        const oldFacingAt = getDirectionFacing(this.faceAt);
        this.faceAt += number;

        if (this.faceAt > 360) this.faceAt = 0;
        else if (this.faceAt < 0) this.faceAt = 360;

        const newFacingAt = getDirectionFacing(this.faceAt);

        if (oldFacingAt == "left") {
            if (newFacingAt == "up") {
                const tempToY = this.toY;
                this.toY = -this.toX;
                this.toX = tempToY;
            } else if (newFacingAt == "down") {
                const tempToY = this.toY;
                this.toY = this.toX;
                this.toX = tempToY;
            }
        } else if (oldFacingAt == "right") {
            if (newFacingAt == "up") {
                const tempToY = this.toY;
                this.toY = this.toX;
                this.toX = -tempToY;
            } else if (newFacingAt == "down") {
                const tempToY = this.toY;
                this.toY = -this.toX;
                this.toX = -tempToY;
            }
        } else if (oldFacingAt == "up") {
            if (newFacingAt == "left") {
                const tempToY = this.toY;
                this.toY = this.toX;
                this.toX = -tempToY;
            } else if (newFacingAt == "right") {
                const tempToY = this.toY;
                this.toY = -this.toX;
                this.toX = tempToY;
            }
        } else if (oldFacingAt == "down") {
            if (newFacingAt == "left") {
                const tempToY = this.toY;
                this.toY = -this.toX;
                this.toX = tempToY;
            } else if (newFacingAt == "right") {
                const tempToY = this.toY;
                this.toY = -this.toX;
                this.toX = -tempToY;
            }
        }

        this.draw();
    },
    moving(direction,number) {
        if (direction == "x") this.toX += number;
        else this.toY += number;

        const limit = 3;

        let addY = 0,addX = 0;

        if (Math.abs(this.toX) >= limit) {
            addX = this.toX > 0 ? 1 : -1;
            this.toX = 0;
        }
        
        if (Math.abs(this.toY) >= limit) {
            addY += this.toY > 0 ? 1 : -1;
            this.toY = 0;
        }
        
        switch(getDirectionFacing(this.faceAt)) {
            case "left":
                (() => {                  
                    let tempX = this.x;
                    let tempY = this.y;
                    tempX += addY;
                    tempY += -addX;
                    if (map[this.y][tempX] == 1) this.x = tempX;
                    else wallHitAudio.play();
                    if (map[tempY][this.x] == 1) this.y = tempY;
                    else wallHitAudio.play();
                })();
                break;
            case "right":
                (() => {                  
                    let tempX = this.x;
                    let tempY = this.y;
                    tempX += -addY;
                    tempY += addX;
                    if (map[this.y][tempX] == 1) this.x = tempX;
                    else wallHitAudio.play();
                    if (map[tempY][this.x] == 1) this.y = tempY;
                    else wallHitAudio.play();
                })();
                break;
            case "up":
                (() => {                  
                    let tempX = this.x;
                    let tempY = this.y;
                    tempX += addX;
                    tempY += addY;
                    if (map[this.y][tempX] == 1) this.x = tempX;
                    else wallHitAudio.play();
                    if (map[tempY][this.x] == 1) this.y = tempY;
                    else wallHitAudio.play();
                })();
                break;
            case "down":
                (() => {                  
                    let tempX = this.x;
                    let tempY = this.y;
                    tempX += -addX;
                    tempY += -addY;
                    if (map[this.y][tempX] == 1) this.x = tempX;
                    else wallHitAudio.play();
                    if (map[tempY][this.x] == 1) this.y = tempY;
                    else wallHitAudio.play();
                })();
                break;
        }

        this.draw();
    },
    draw() {
        drawMap();
        
        let startTime = performance.now();
        let path = pathFinder([this.x,this.y],[],[checkpoint.x,checkpoint.y]);
        let endTime = performance.now();
        /*  console.log(endTime - startTime); */
        
        for (let [x,y] of path) {
            context.fillStyle = "gold";
            context.fillRect((canvas.width / map[0].length) * x,(canvas.height / map.length) * y,size,size);
        }

        console.log(path)

        let volume = 1 - (Math.floor(path.length / 5) * 0.1);
        volume = volume < 0 ? 0 : volume;
        
        if (getDirectionFacing(this.faceAt) != getShouldFaceAt([this.x,this.y],[path[0][0],path[0][1]])) volume *= 0.3;
        audio.volume = volume;

        context.fillStyle = "red";
        context.fillRect((canvas.width / map[0].length) * this.x,(canvas.height / map.length) * this.y,size,size);

        drawCompass(this.faceAt);

        document.getElementById("toX").innerHTML = this.toX;
        document.getElementById("toY").innerHTML = this.toY;
        document.getElementById("faceAt").innerHTML = this.faceAt;
        document.getElementById("faceDirection").innerHTML = getDirectionFacing(this.faceAt);
        document.getElementById("shouldFace").innerHTML = getShouldFaceAt([this.x,this.y],[path[0][0],path[0][1]]);
    }
}

player.draw();

function as() {
    audio.play();
}

const keys = {
    left: false,
    right: false,
    up: false,
    down: false,
}

function drawCompass(angle) {
    const containerSize = 70;
    context.fillStyle = "rgba(177,177,177,0.8)";
    context.fillRect(canvas.width - containerSize,0,containerSize,containerSize);  
    const barWidth = 3;
    const barHeight = 18;
    context.save();
        context.fillStyle = "red";
        context.translate(canvas.width - (containerSize / 2) - (barWidth / 2),(containerSize / 2));
        context.rotate(angle * Math.PI / 180);
        context.fillRect(0,-barHeight,barWidth,barHeight);
    context.restore();
}

window.addEventListener("keydown",function(event) {
    switch(event.key) {
        case "a": 
            keys.left = true;
            player.moving("x",-1);
            break;
        case "d": 
            keys.right = true;
            player.moving("x",1);
            break;
        case "w": 
            keys.up = true;
            player.moving("y",-1);
            break;
        case "s": 
            keys.down = true;
            player.moving("y",1);
            break;
        case "g":
            as();
            break;
        case "e":
            bgAudio.play();
            break;
        case "ArrowLeft":
            player.facing(-1);
            break;
        case "ArrowRight":
            player.facing(1);
            break;
    }
});

window.addEventListener("keyup",function(event) {
    switch(event.key) {
        case "a": 
            keys.left = false;
            break;
        case "d": 
            keys.right = false;
            break;
        case "w": 
            keys.up = false;
            break;
        case "s": 
            keys.down = false;
            break;
    }
});