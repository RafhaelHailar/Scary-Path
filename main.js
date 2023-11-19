import map from "./map.js";

const canvas = document.createElement("canvas");
const context = canvas.getContext("2d");

canvas.width = canvas.height = 700;
document.body.appendChild(canvas);

const size = canvas.width / map[0].length;
let checkpoint;

let audio = document.getElementById("audio");
const bgAudio = document.getElementById("bg-audio");
const wallHitAudio = document.getElementById("wall-hit");

const AUDIO = {
    lead: document.getElementById("lead"),
    ambience: document.getElementById("ambience"),
    wallCollission: document.getElementById("wall-hit")
};

function inRange(number,from,to) {
	return number >= from && number < to;
}

class World {
    constructor(map) {
        this.map = map;
        this.map_row = map[0].length;

        this.CHECKPOINTS = {
            1: [23,24]
        }

        this.level = 1;
    }

    drawMap() {
        context.fillStyle = "black";
        context.fillRect(0,0,canvas.width,canvas.height);

        this.map.forEach((row,y) => {
            row.forEach((element,x) => {
                if (element == 1) this.drawOne(x,y,"white");
            });
        });

        const [checkX,checkY]= this.CHECKPOINTS[this.level];
        this.drawOne(checkX,checkY,"green");
    }

    drawOne(x,y,color) {
        context.fillStyle = color;
        context.fillRect((canvas.width / this.map_row) * x,(canvas.height / map.length) * y,size,size);
    }

    isPath(x,y) {
        return this.map[y][x] != 0;
    }
}

class Player {
    constructor(world,x,y,color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.world = world;
        this.angle = 0;
        this.to = {
            x: 0,
            y: 0
        };
        this.movingTo = {
            x: 0,
            y: 0
        };
	this.facingAt = "up";
        this.facingTo = 0;
        this.movingAt = 20;
    }

    facing(to) {
        this.angle += to;

        if (this.angle < 0) this.angle = 360;
        else if (this.angle > 360) this.angle = 0;
         
	let Directions = {
       "up": [[315,361],[0,46]],
	   "right": [[46,90],[90,136]],
	   "down": [[136,180],[180,226]],
	   "left": [[226,270],[270,315]]
	};
   	
	for (let direction in  Directions) {
	    for (let [start,end] of  Directions[direction]) {
	       if (inRange(this.angle,start,end)) {
		  if (this.facingAt != direction) {
	             const prevX = this.to.x;
	    	     
		     /*
		    	This will swap the amount of number that we add / decrease that is  needed to make a move on either,
			horizontally or vertically.

			this.to.x = -1 moving left , 1 moving right
			this.to.y = -1 moving up, 1 moving down

			//Adding the this everytime I wrote this two variables is so painful. so yeah to.y means this.to.y in the,
			//explanation below.
			to.y = this.to.y; 
			to.x = this.to.x;

			if either the to.x or to.y reaches the needed amount to make a move(this.movingAt which is 20) it will,
			cause a move.

			But in cases where we change where we facing at for example,we are facing "up" then decided to face at "left",
			the previous addition / reduction to to.x or to.y will also going to have to change, to make the simulation,
			of a 3d world happen.
			Like imagine that, you are in a road where there are blocks / cell that was inscribed / printed on the road,
			and you are inside a cell and facing forward, then you are walking  backward (you are a back walker hehehe),
			then you are about to cross the cell that was at your back , but out of whim decided to face in other direction,
			you face at left, it doesn't make you close at the back of the current direction where we facing at, which is the,
			right direction, but rather you are close to the left cell (which is the previous back cell when we are facing,
			forward) now.

			So that was what I was trying to accmoplsih here.
		 	
			previously facing = this.facingAt;
			if we previously facing at the up there are only two other directions we can change to which is the left or right,
			this make changing the to.x to to.y.
            to = -1 for moving the head counter clockwise , 1 for moving the head clockwise.
			Diagram:
			    ^ -< previously facing
			   < > -- other direction we can face to
			    | --- we can't jump to the down / backward since we have to go through left / right first.
		        Since it was guaranteed that when we change what direction our facing, the to.x and to.y will be swapped.
                So the calculations for our new to.x and to.y is:
                the new to.x is the previous to.y multiplied by the to, it is because when we are facing up, and moving up making the to.y to be a number less than 0 (since up is -1 again),
                then decided to face at right, making the "to" to be +1 (because to be able to face to right, when you are facing up you have to rotate your head clockwise),
                Now that we are facing at right moving up we decrease the to.x by 1,and we have to have a negative number to move up.
                
                the new to.y is the previous to.x multiplied by the inverse to, we applied the same logic as getting the new to.x but the to is inverse.
		     */	
		   //  if (this.facingAt === "up") {
		   // this.to.x = this.to.y * to;
		   // this.to.y = prevX * (to * -1);
		   //  } else if (this.facingAt === "right") {
		   // this.to.x = this.to.y * to;
		   // this.to.y = prevX * (to * -1);
		   //  } else if (this.facingAt === "down") {
		   // this.to.x = this.to.y * to;
		   // this.to.y = prevX * (to * -1);
		   //  } else if (this.facingAt === "left") {
		   // this.to.x = this.to.y * to;
		   // this.to.y = prevX * (to * -1);
		   //  } 
             this.to.x = this.to.y * to;
             this.to.y = prevX * (to * -1);
		     this.facingAt = direction;
		  }
		  break;
	       }
	    }
	}
	
        document.getElementById("faceAt").innerHTML = this.angle;
	document.getElementById("faceDirection").innerHTML = this.facingAt;
        drawCompass(this.angle);
    }

    moving([toX,toY]) {
        this.world.drawMap();

        this.to.x += toX;
        this.to.y += toY;

        document.getElementById("toX").innerHTML = this.to.x;
        document.getElementById("toY").innerHTML = this.to.y;

        let addX = 0,
            addY = 0;

        /*
         Pressing the a or d button makes a subtraction or  addition respectively to the to.x value.
         When to to.x reach the require value need to make a move which is the this.movingAt the movement / changes of the position
         is depend on what we are currently facing at, to simulate the 3d world.
         So our calculation for movement in this code below (when the to.x meets this.movingAt)
         When facing left
             the right side is the up,
             the left side is the down.
                      ^
 Currently facing -->< > 
                      | // it is down just kind find an arrow down symbol in my keyboard
             so when we meets the this.movingAt and we meet it at negative, we moves down
             meeting at positive we move up.
         So thats how I do it.
         I'm not going to do it with the rest, do it if you want though.
        */
        if (Math.abs(this.to.x) >= this.movingAt) {
            switch (this.facingAt) {
               case "left":
                    addY = -toX;
                    break;
               case  "up":
                    addX = toX;
                    break;
               case  "right":
                    addY = toX;
                    break;
               case  "down":
                    addX = -toX;
                    break;
            }
            this.to.x = 0;
        }    

        /*
         The calculation for movement in this code below (when the to.y meets this.movingAt)
         When facing down
              the up side is down,
              the down side is up.
                       ^
                      < >
  Currently facing --> | 
             So when we meets the this.movingAt and we meet it at negative, we moves down
             meeting at positive we move up.

             Because moving forward is negative, moving backward is positive.
        */

        if (Math.abs(this.to.y) >= this.movingAt) {
            switch (this.facingAt) {
               case "left":
                    addX = toY;
                    break;
               case  "up":
                    addY = toY;
                    break;
               case  "right":
                    addX = -toY;
                    break;
               case  "down":
                    addY = -toY;
                    break;
            }
            
            this.to.y = 0;
        }

        let newX = this.x + addX,
            newY = this.y + addY;

        if (this.world.isPath(newX,newY)) {
            this.x = newX;
            this.y = newY;
        } else AUDIO.wallCollission.play();

        this.draw();

    }

    draw() {
        this.world.drawOne(this.x,this.y,this.color);
    }

    update() {
        this.facing(this.facingTo);
        this.moving([this.movingTo.x,this.movingTo.y]); 
        this.draw();
    }
}

class Monster {
    constructor(x,y,color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.paths = [];
    }

    getPath() {
        this.paths = pathFinder([player.x,player.y],[],10);
    }

}
const world = new World(map);

const player = new Player(world,23,39,"red");
let playerToCheckPoint = pathFinder([23,39],[],[23,34]);
console.log(playerToCheckPoint);
console.log(isSameArray([3,2,1],[3,2,1]));
console.log(pathFinder([23,39],[],10));
const KEYSUP = {
    "a": function() {
        player.movingTo.x = -1;
    },
    "w": function() {
        player.movingTo.y = -1;
    },
    "s": function() {
        player.movingTo.y = 1;
    },
    "d": function() {
        player.movingTo.x = 1;
    },
    "ArrowLeft": function() {
        player.facingTo = -1;
    },
    "ArrowRight": function() {
        player.facingTo = 1;
    }
}

const KEYSDOWN = {
    "a": function() {
        player.movingTo.x = 0;
    },
    "w": function() {
        player.movingTo.y = 0;
    },
    "s": function() {
        player.movingTo.y = 0;
    },
    "d": function() {
        player.movingTo.x = 0;
    },
    "ArrowLeft": function() {
        player.facingTo = 0;
    },
    "ArrowRight": function() {
        player.facingTo = 0;
    }
}

window.addEventListener("keydown",function(event) {
    const action = KEYSUP[event.key];
    
    if (action) action();
});

window.addEventListener("keyup",function(event) {
    const action = KEYSDOWN[event.key];
    
    if (action) action();
});

function update() {
    context.clearRect(0,0,canvas.width,canvas.height); 

    world.drawMap(); 
    player.update();
    requestAnimationFrame(update);
}

requestAnimationFrame(update);

function pathFinder(from,paths,to) {
    const places = [{at: from,paths}];
    const directions = [
        [-1,0],[1,0],
        [0,-1],[0,1]
    ];
    const allPaths = [];
    
    for (let i = 0;i < places.length;i++) {
        let {at,paths} = places[i];
        let [atX,atY] = at;
        for (let [addX,addY] of directions) {
            const newPlace = [atX + addX,atY + addY];
            let toX,toY;
            if (typeof to === "object") {
                toX = to[0];
                toY = to[1];
            }
            let newPath = paths.concat([newPlace]);
            if (typeof to === "number" && world.isPath(newPlace[0],newPlace[1]) && newPath.length === to) {
                allPaths.push(newPath);
            } else if (newPlace[0] == toX && newPlace[1] == toY && !(places.some(place => isSameArray(place.at,newPlace)))) allPaths.push(newPath);
            else if (!(places.some(place => isSameArray(place.at,newPlace))) &&
                map[newPlace[1]] != undefined && map[newPlace[1]][newPlace[0]] == 1) places.push({at: newPlace,paths: newPath});
        }
    }
    return allPaths;
}

function isSameArray(first,second) {
    if (first.length != second.length) return false;
    for (let i = 0;i < first.length;i++) {
        if (first[i] !== second[i]) return false;
    }
    return true;
}

/*
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
 */
/* const player = {
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
        
        let startTime = performance.now();
        let path = pathFinder([this.x,this.y],[],[checkpoint.x,checkpoint.y]);
        let endTime = performance.now();
        /*  console.log(endTime - startTime); 
        
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
} */

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

/* window.addEventListener("keydown",function(event) {
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
            audio.play();
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
}); */



canvas.addEventListener("mousemove",function(event) {
    const blockCoord = document.getElementById("blockCoord");
    let mouseX = event.offsetX;
    let mouseY = event.offsetY;
    let blockX = Math.floor(mouseX / (canvas.width / world.map_row));
    let blockY = Math.floor(mouseY / (canvas.height / map.length));
    blockCoord.innerHTML = `X: ${blockX} Y: ${blockY}`;  
});
