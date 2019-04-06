'use strict';

class Vector {
  constructor (x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }
  plus(addVector) {
    if (!isVector(addVector)) {
      throw new Error('Можно прибавлять к вектору только вектор типа Vector');
    }
    return new Vector(this.x + addVector.x, this.y + addVector.y);
  }
  times(multiplier) {
    return new Vector(this.x * multiplier, this.y * multiplier);
  }
}

class Actor {
  constructor (pos = new Vector(0,0), size = new Vector(1,1), speed = new Vector(0,0)) {
    if ((!isVector(pos)) || (!isVector(size)) || (!isVector(speed))) {
      throw new Error ('Позиция, размер и скорость должны быть объектами Vector');
    } else {
      this.pos = pos;
      this.size = size;
      this.speed = speed;
    }
  }
  get left() {
    return this.pos.x;
  }
  get right() {
    return this.pos.x + this.size.x;
  }
  get top() {
    return this.pos.y;
  }
  get bottom() {
    return this.pos.y + this.size.y;
  }
  get type() {
    return 'actor';
  }
  act() {}
  isIntersect(actor) {
    if (!isActor(actor)) {
      throw new Error('Аргументом метода isIntersect должен быть объект Actor');
    } else {
      if (this === actor) {
        return false;
      } else {
        return ((this.left < actor.right) && (actor.left < this.right) && (this.bottom > actor.top) && (actor.bottom > this.top));
      }
    }
  }
}

class Level  {
  constructor(grid, actors) {
    this.grid = grid;
    this.actors = actors;
    this.player = findPlayer(actors);
    this.height = (grid === undefined) ? 0 : grid.length;
    this.width = widthOfGrid(grid);
    this.status = null;
    this.finishDelay = 1;
  }
  isFinished() {
    return ((this.status !== null) && (this.finishDelay < 0));
  }
  actorAt(actor) {
    if ((!isActor(actor)) || (actor === undefined)) {
      throw new Error('Аргументом метода actorAt должен быть объект Actor');
    }
    if ((this.grid === undefined) && (this.actors === undefined)) {
      return undefined;
    }
    let intActor;
    this.actors.forEach(function(item) {
      if (actor.isIntersect(item)) {
        intActor = item;
      }
    });
    return intActor;
  }
  obstacleAt(pos, size) {
    if ((!isVector(pos)) || (!isVector(size))) {
      throw new Error('Аргументами метода obstacleAt должны быть Vector');
    }
    let actor = new Actor(pos, size);
    if ((actor.left < 0) || (actor.right + 1 > this.width) || (actor.top < 0)) {
      return 'wall';
    }
    if  (actor.bottom + 1 > this.height) {
      return 'lava';
    }
    // вложенные for'ы, наверное, не самое удачное решение...
    let obstacle;
    for (var i = Math.floor(actor.top); i < Math.ceil(actor.bottom); i++) {
      for (var j = Math.floor(actor.left); j < Math.ceil(actor.right); j++) {
        if ((this.grid[i][j] === 'wall') || (this.grid[i][j] === 'lava')) {
          obstacle = this.grid[i][j];
        }
      }
    }
    return obstacle;
  }
  removeActor(actor) {
    this.actors.splice(this.actors.indexOf(actor), 1);
  }
  noMoreActors(actorType) {
    if (this.actors === undefined) {
      return true;
    }
    let nMA = true;
    for(let actor of this.actors) {
      if (actor.type === actorType) {
        nMA = false;
      }
    }
    return nMA;
  }
  playerTouched(obstacle, actor) {
    if (this.status === null) {
      if ((obstacle === 'lava') || (obstacle === 'fireball')) {
        this.status = 'lost';
      } else if (obstacle === 'coin') {
        this.removeActor(actor);
        if (this.noMoreActors('coin')) {
          this.status = 'won';
        }
      }
    }
  }
}

class LevelParser {
  constructor(actorsDict) {
    this.actorsDict = actorsDict;
  }
  actorFromSymbol(token) {
    if ((typeof(token) !== 'string') || !(token in this.actorsDict)) {
      return undefined;
    }
    return this.actorsDict[token];
  }
  obstacleFromSymbol(token) {
    if (token === 'x') {
      return 'wall';
    } else if (token === '!') {
      return 'lava';
    }
  }
  createGrid(plan) {
    let gridArray = [];
    for (let str of plan) {
      let stringArray = [];
      for (let i = 0; i < str.length; i++) {
        stringArray.push(this.obstacleFromSymbol(str.charAt(i)));
      }
      gridArray.push(stringArray);
    }
    return gridArray;
  }
  createActors(plan) {
    if (this.actorsDict === undefined) {
      return [];
    }
    let actorsArray = [];
    for (let i = 0; i < plan.length; i++) {
      for (let j = 0; j < plan[i].length; j++) {
        let actor = this.actorFromSymbol(plan[i].charAt(j));
        if ((actor !== undefined) && ((actor.__proto__ === Actor) || (actor === Actor))) {
          actorsArray.push(new actor(new Vector(j, i)));
        }
      }
    }
    return actorsArray;
  }
  parse(plan) {
    return new Level(this.createGrid(plan), this.createActors(plan));
  }
}



class Fireball extends Actor {
  constructor (pos = new Vector(0,0), speed = new Vector(0,0)) {
    super(pos);
    this.speed = speed;
    this.size = new Vector(1,1);
  }
  get type() {
    return 'fireball';
  }
  getNextPosition(time = 1) {
    return this.pos.plus(this.speed.times(time));
  }
  handleObstacle() {
    this.speed = this.speed.times(-1);
  }
  act(time, level) {
    let nextPos = this.getNextPosition(time);
    if (level.obstacleAt(nextPos, this.size) === undefined) {
      this.pos = nextPos;
    } else {
      this.handleObstacle();
    }
  }
}

class HorizontalFireball extends Fireball {
  constructor(pos) {
    super(pos);
    this.speed = new Vector(2, 0);
  }
}

class VerticalFireball extends Fireball {
  constructor(pos) {
    super(pos);
    this.speed = new Vector(0, 2);
  }
}

class FireRain extends Fireball {
  constructor(pos) {
    super(pos);
    this.speed = new Vector(0, 3);
    this.initialPos = pos;
  }
  handleObstacle() {
    this.pos = this.initialPos;
  }
}

class Coin extends Actor{
  constructor(pos) {
    super();
    this.size = new Vector(0.6, 0.6);
    this.pos = pos;//.plus(new Vector(0.2, 0.1));
    this.initialPos = pos;
    this.springSpeed = 8;
    this.springDist = 0.07;
    this.spring = Math.random() * Math.PI * 2;
  }
  get type() {
    return 'coin';
  }
  updateSpring(time = 1) {
    this.spring = this.spring + this.springSpeed * time;
  }
  getSpringVector() {
    return new Vector(0, this.springDist * Math.sin(this.spring));
  }
  getNextPosition(time = 1) {
    this.updateSpring(time);
    return this.initialPos.plus(this.getSpringVector());
  }
  act(time = 1) {
    this.pos = this.getNextPosition(time);
  }
};

class Player extends Actor{
  constructor(pos) {
    super();
    this.size = new Vector(0.8, 1.5);
    this.speed = new Vector(0, 0);
    this.pos = pos.plus(0, 0.5);
    //this.pos;
  }
  get type() {
    return 'player';
  }
}


/*
let dictionary = new Map();
dictionary.set('x', 'wall');
dictionary.set('!', 'lava');
dictionary.set('@', 'player');
dictionary.set('o', 'coin');
dictionary.set('=', 'HorizontalFireball');
dictionary.set('|', 'VerticalFirevall');
dictionary.set('v', 'rain');
*/

// Вспомогательные функции для реализации классов
function isVector(vector) {
  return (vector instanceof Vector) ? true : false;
}

function isActor(actor) {
  return (actor instanceof Actor) ? true : false;
}

//для width в классе Level
function widthOfGrid(grid) {
  if (grid === undefined) {
    return 0;
  }
  let maxLength = 0;
  grid.forEach(function(string) {
    if (string.length > maxLength) {
      maxLength = string.length;
    }
  });
  return maxLength;
}

//для player в классе Level
function findPlayer(actors) {
  let player;
  if (actors !== undefined) {
    player = actors.find(function(actor) {
      return (actor.type === 'player');
    });
  }
  return player;
}
