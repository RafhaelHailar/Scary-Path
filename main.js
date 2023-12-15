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
    wallCollission: document.getElementById("wall-hit"),
    footstep: document.getElementById("footstep"),
    monsterNear: document.getElementById("monster-near")
};

AUDIO.footstep.volume = 0.2;
AUDIO.ambience.volume = 0.5;

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
        this.block_size = 20; // the amount that the player have to move to be able to translate to other block
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

    getCheckpoint() {
        return this.CHECKPOINTS[this.level];
    }

    drawOne(x,y,color) {
        context.fillStyle = color;
        context.fillRect((canvas.width / this.map_row) * x,(canvas.height / map.length) * y,size,size);
    }

    isPath(x,y) {
        //check if the first argument is an array, if it was the array must be [x,y] type then check if,
        //it is a path in the map by first checking the y (for the column)value in the array(since the array is,
        //two dimensional) then checking the x (for the row) if it is null,undefined or 0 it is not a path.
        if (Array.isArray(x)) { //the reason for this is that some code uses the type [x,y] instead of individually x and y.
            let [rX,rY] = x;
            return this.map[rY] && (this.map[rY][rX] > 0);
        }
        return this.map[y] && (this.map[y][x] > 0);
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
        this.movingAt = world.block_size;


        this.isWalking = {
            counter: 0,
            stopAt: 100,
            value: false
        };
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

        if (toX !== 0 || toY !== 0) {
           this.isWalking.value = true;
           this.isWalking.count = 0;
        }
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
    
    createSensors() {
        const blocks = [{at: [this.x,this.y],magnitude: 1}];
        const reducer = 0.97;
        const directions = [
            [-1,0],[1,0], //left right
            [0,-1],[0,1] //top bottom
        ];

        let depth = 0;
        const max_depth = 150;
        const other_max_depth = max_depth;

        for (let i = 0;i < blocks.length;i++) {
            let {at,magnitude} = blocks[i];
            let [atX,atY] = at;
            for (let [addX,addY] of directions) {
                if (depth > max_depth) break;
                let newAt = [atX + addX,atY + addY];
                 
                if (!blocks.some(block => isSameArray(block.at,newAt)) && this.world.isPath(newAt)) {
                        let reducerReducer = 0.9;
                        if ((this.facingAt === "left" && (addX === -1 || newAt[1] === this.y) ) ||
                            (this.facingAt === "right" && (addX === 1 || newAt[1] === this.y) ) || 
                            (this.facingAt === "up" && (addY === -1 || newAt[0] === this.x) ) ||
                            (this.facingAt === "down" && (addY === -1 || newAt[0] === this.x) )) reducerReducer = 1;

                        if (!(depth > other_max_depth &&
                            ((this.facingAt === "left" && (addX !== -1 || newAt[1] !== this.y) ) ||
                            (this.facingAt === "right" && (addX !== 1 || newAt[1] !== this.y) ) ||
                            (this.facingAt === "up" && (addY !== -1 || newAt[0] !== this.x) ) ||
                            (this.facingAt === "down" && (addY !== 1 || newAt[0] !== this.x) ))
                           ))
                                blocks.push({at: newAt,magnitude: magnitude * (reducer * reducerReducer)});
                }
            }
            depth++;
        }
        for (let i = 0;i < blocks.length;i++) {
           const {at,magnitude} = blocks[i]; 
           const [x,y] = at;
           const color = `hsl(${255 * magnitude},100%,50%)`;
           //world.drawOne(x,y,color);
        }
        if (monster && monster.spawned) {
           const monsterBlock = blocks.find(block => isSameArray(block.at,[monster.x,monster.y]));
           if (monsterBlock) {
               AUDIO.monsterNear.volume = monsterBlock.magnitude;
           } else AUDIO.monsterNear.volume = 0.1;
        }
        
        const checkpoint = this.world.getCheckpoint();
        const closestToPlayer = pathFinder(checkpoint,[],[this.x,this.y]);
        const lastPlaces = closestToPlayer.map(paths => paths[paths.length - 2]); 
        const facingToLead = [];
        for (let path of closestToPlayer) {
            for (let [x,y] of path) {
                //this.world.drawOne(x,y,"violet");
            } 
        }
        for (let place of lastPlaces) {
            facingToLead.push(getShouldFaceAt([this.x,this.y],place)); 
            this.world.drawOne(place[0],place[1],"red");
        }
        this.world.drawOne(checkpoint[0],checkpoint[1],"hsl(255,100%,30%)");        
        const leadBlock = blocks.find(block => isSameArray(block.at,checkpoint));
        
        if (leadBlock) {
            AUDIO.lead.volume = leadBlock.magnitude + (facingToLead.includes(this.facingAt) && 0.1);
        } else AUDIO.lead.volume = 0.05 + (facingToLead.includes(this.facingAt) && 0.1);
    }

    draw() {
        this.world.drawOne(this.x,this.y,this.color);

        
    }

    update() {
        this.facing(this.facingTo);
        this.moving([this.movingTo.x,this.movingTo.y]); 
        this.createSensors();
        this.draw();
        
        if (this.isWalking.value) {
            if (this.isWalking.count < this.isWalking.stopAt) {
                this.isWalking.count++;
                if (AUDIO.footstep.currentTime === 0) 
                    AUDIO.footstep.play();
            } else {
                this.isWalking.count = 0;
                AUDIO.footstep.pause();
                AUDIO.footstep.currentTime = 0;
                this.isWalking.value = false;
            }
        }
        


        document.getElementById("playerX").innerHTML = this.x;
        document.getElementById("playerY").innerHTML = this.y;
    }
}

class Monster {
    constructor(world,color) {
        this.x = this.y = null;
        this.color = color;
        this.paths = [];
        this.world = world;
        this.steps = 0;
        this.moveAt = this.world.block_size + 120;
        this.spawningRate = 60;
        this.spawnCount = 0;
        this.spawned = false;
        this.toPlayer = 1; // monster direction state 1 going to player, 0 going away to player and others hide the monster
        this.spawn();
    }


    despawn() {
        this.spawned = false;
        this.x = this.y = null;
        this.paths = [];

        AUDIO.monsterNear.pause();
        AUDIO.monsterNear.currentTime = 0;
    }

    spawn() {
        this.spawned = true;
        this.toPlayer = 1;
        this.getPath();
        
  //      AUDIO.monsterNear.play();
    }

    getPath() {
        const offsetPlayer = 10; //the distance to the player the monster will be placed at
        this.paths = pathFinder([player.x,player.y],[],offsetPlayer);
        this.pathTaken = [[player.x,player.y],...this.paths[Math.floor(Math.random() * this.paths.length)]]; //upto the player, including the player position
        this.currentStep = 0;
        let pathTakenStart = this.pathTaken[this.pathTaken.length - 1];
        this.x = pathTakenStart[0];
        this.y = pathTakenStart[1];
        document.getElementById("monsPaths").innerHTML = JSON.stringify(this.pathTaken);
    }

    moveBlock() {
        this.currentStep++;
        
        if (this.currentStep > this.pathTaken.length - 1) {
            // -1 because, the function starts adding the current step before getting the path by it.
            // so if we starts at 0,the path that will be taken is the path 1 or the second insted of the first(the 0).
            this.currentStep = -1; 
            this.toPlayer--;
            // get the last path so it will be differnt than the first one picked
            this.pathTaken = this.paths[Math.floor(Math.random() * this.paths.length)];
            document.getElementById("monsPaths").innerHTML = JSON.stringify(this.pathTaken);
            return;
        }
        
        /*
         if the direction state (this.toPlayer) is 1, which is going to the player,
         the path that will be move is from the last of the array to the start,
         which is from away to the player, to the player.
         formula(1) (this.pathTaken.length - 1) - this.currentStep
         the higher the currentStep is the closer we are to the player.
         if the direction state is 0, which is going away to the player,
         the path will be move is from the start of the array to the end,
         which is from the player,to away from the player.
         formula(0) this.currentStep
         the lower the currentStep the closer we are to the player.
         
         to make the computation change whenever we change state,
         ((this.pathTaken.length - 1) * this.toPlayer) -> we make it gone whenever we are going away to the player,
         so that we can do the "this.currentStep" computation, and if we are going to player we make it present
         both by the this.toPlayer (0 == gone, 1 == present) then,  
         + (1 - (this.toPlayer * 2)) * this.currentStep -> we make the this.currentStep a positive when going away,
         and negative when going to the player, by multiplying the this.toPlayer which will outcome either,
         (0 == 0,1 == 2) then subtracting 1 by it, we can produce either a positive 1 (0) or negative 1 (1).
         so we can do the -this.currentStep from the formula (1) 
         and the this.currentStep from the formula (0).

        */
        let path = this.pathTaken[((this.pathTaken.length - 1) * this.toPlayer) + (1 - (this.toPlayer * 2)) *this.currentStep];

        this.x = path[0];
        this.y = path[1];

        document.getElementById("monsterTo").innerHTML = `X: ${this.x},Y: ${this.y}`;
    }

    move() {
        if (this.toPlayer < 0) {
            this.despawn();
            return; 
        }
        if (this.steps < this.moveAt) this.steps++;
        else { 
            this.moveBlock();
            this.steps = 0;
        }  
    }

    draw() {
        this.world.drawOne(this.x,this.y,this.color);
    }
        
    update() {
        document.getElementById("monsSpawned").innerHTML = this.spawned ? "Spawned" : "De Spawned";
        if (this.x === null || this.y === null) {
            if (this.spawnCount < this.spawningRate) this.spawnCount++;
            else {
                this.spawn();
                this.spawnCount = 0;
            }
            return;
        };
          this.move();
          this.draw();
          document.getElementById("monsterX").innerHTML = this.x;
          document.getElementById("monsterY").innerHTML = this.y;
    }
}
const world = new World(map);

const player = new Player(world,23,39,"red");
const monster = new Monster(world,"blue");
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
    "k": function() {
        AUDIO.lead.play();
    },
    "m": function() {
        AUDIO.ambience.play();
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
    monster.update();
    requestAnimationFrame(update);
}

requestAnimationFrame(update);

//path finding function
/*
 * @params {int[x,y]} from
 * @params {[int[],...,int[]][[x,y],...,[x,y]]} paths
 * @params {int[x,y] | int} to
 * 
 * @return {int[[x,y]...[x,y]] || [int[],...,int[]][[x,y],...,[x,y]] }
*/
function pathFinder(from,paths,to,closest = false) {
    //keep track of all the places been through
    const places = [{at: from,paths}];
    //directions that will be check from the current place 
    const directions = [
        [-1,0],[1,0], //left right
        [0,-1],[0,1] //top bottom
    ];

    //all paths acquired
    const allPaths = [];
    
    for (let i = 0;i < places.length;i++) {
        let {at,paths} = places[i];
        let [atX,atY] = at;
        for (let [addX,addY] of directions) {
            //move to the direction
            const newPlace = [atX + addX,atY + addY];
            
            let toX,toY;
            //check if the to is an array if it is assign the toX,toY
            if (typeof to === "object") {
                toX = to[0];
                toY = to[1];
            }

            //the paths been through including the new place we move
            let newPath = paths.concat([newPlace]);
            
            //if the target(to) is a number, check if the newPath created meet the length which is the target and,
            //check if the place we move to is a path in the world,
            //then if all of them are satisfied,  add it to the paths acquired.
            if (typeof to === "number" && world.isPath(newPlace[0],newPlace[1]) && newPath.length === to) {
                allPaths.push(newPath);
                //if the target(to) is an array, check if the place we move to is a path in the world,
                //and if the new place we move to is not explored yet or we haven't been throught it yet,
                //then if all of them are satisfied, add it to the paths acquired.
            } else if (newPlace[0] == toX && newPlace[1] == toY && !(places.some(place => isSameArray(place.at,newPlace)))) {
                if (closest) return newPath;
                allPaths.push(newPath);
                //if all of the above is conditions are not satisfied, check if we already explore the new place,
                //and if the new place we move to is a pth in the world
                //then if all of them are satisfied, we add the place we move to the places array and the paths,
                //we go through to get to the new place.
            } else if (!(places.some(place => isSameArray(place.at,newPlace))) &&
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

function getShouldFaceAt(from,to) {
    let direction = [to[0] - from[0],to[1] - from[1]];
    if (direction[0] == -1) return "left";
    if (direction[0] == 1) return "right";
    if (direction[1] == -1) return "up";
    if (direction[1] == 1) return "down";
}
 
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
