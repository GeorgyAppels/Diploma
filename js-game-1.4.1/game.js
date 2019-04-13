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
    }
    this.pos = pos;
    this.size = size;
    this.speed = speed;
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
    }
    if (this === actor) {
      return false;
    } else {
      return ((this.left < actor.right) && (actor.left < this.right) && (this.bottom > actor.top) && (actor.bottom > this.top));
    }
  }
}

class Level  {
  constructor(grid, actors) {
    this.grid = grid;
    this.actors = (actors === undefined) ? [] : actors;
    this.height = (grid === undefined) ? 0 : grid.length;
    this.status = null;
    this.finishDelay = 1;
  }
  get player() {
    return this.actors.find(function(actor) {
      return (actor.type === 'player');
    });
  }
  get width() {
    if (this.grid === undefined) {
      return 0;
    }
    let maxLength = 0;
    this.grid.forEach(function(string) {
      if (string.length > maxLength) {
        maxLength = string.length;
      }
    });
    return maxLength;
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
    if ((actor.left < 0) || (actor.right > this.width) || (actor.top < 0)) {
      return 'wall';
    }
    if  (actor.bottom > this.height) {
      return 'lava';
    }
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
        if ((actor !== undefined) && ((actor.__proto__ === Actor) || (actor === Actor) || (actor.__proto__ === Fireball))) {
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
    super(pos, new Vector(1,1), speed);
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
  constructor(pos, speed = new Vector(2, 0)) {
    super(pos, speed);
  }
}

class VerticalFireball extends Fireball {
  constructor(pos, speed = new Vector(0, 2)) {
    super(pos, speed);
  }
}

class FireRain extends Fireball {
  constructor(pos, speed = new Vector(0, 3)) {
    super(pos, speed);
    this.initialPos = pos;
  }
  handleObstacle() {
    this.pos = this.initialPos;
  }
}

class Coin extends Actor{
  constructor(pos = new Vector()) {
    super(pos.plus(new Vector(0.2, 0.1)), new Vector(0.6, 0.6));
    this.initialPos = this.pos;
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
  constructor(pos = new Vector()) {
    super(pos.plus(new Vector(0, -0.5)), new Vector(0.8, 1.5), new Vector(0, 0));
  }
  get type() {
    return 'player';
  }
}

//Словарь
const actorDict = {
  '@': Player,
  'o': Coin,
  '=': HorizontalFireball,
  '|': VerticalFireball,
  'v': FireRain
}

//Запуск игры
const parser = new LevelParser(actorDict);
loadLevels()
  .then((schemas) => runGame(JSON.parse(schemas), parser, DOMDisplay)
      .then(() => console.log('Победа!')));

// Вспомогательные функции для реализации классов
function isVector(vector) {
  return (vector instanceof Vector);
}

function isActor(actor) {
  return (actor instanceof Actor);
}
