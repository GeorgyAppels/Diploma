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
      Object.defineProperty(this, 'type', {
        value: 'actor',
        writable: false,
        enumerable: false,
        configurable: false
      });
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
    return this.pos.y + this.size.x;
  }
  act() {}
  isIntersect(actor) {
    if (!isActor(actor)) {
      throw new Error('Аргументом функции isIntersect должен быть объект Actor');
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
      console.log('� actorAt ����� ���������� ������ ������ ���� Actor');
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
      console.log('� obstacleAt ����� ���������� ������ ������� ���� Vector');
    }
    let actor = new Actor(pos, size);
    if (this.width < actor.right) {
      return 'wall';
    }
    if  (actor.height > this.bottom) {
      return 'lava';
    }
    return this.grid[actor.pos.y][actor.pos.x]; //���� ��������� ��� �������, ������� �������� ������, � �� ������ ��������� ��� ����������
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
      }
      if (this.noMoreActors('coin')) {
        this.status = 'won';
      }
    }
  }
}

const grid = [
  new Array(3),
  ['wall', 'wall', 'lava', 'rrrr']
];
const level = new Level(grid, []);
console.log(level.width);


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
  let player;// = new Actor();
  /*Object.defineProperty(player, 'type', {
    value: 'player',
    writable: false,
    enumerable: false,
    configurable: false
  });*/
  //if (actors !== undefined) {
//    player = actors.find()
//  }
  return player;
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


class LevelParser {
  contructor(actorsDict) {
    this.actorsDict = actorsDict;
  }
  actorFromSymbol(token) {
    return actorsDict[token];
  }
  obstacleFromSymbol(token) {
    if (token === 'x') {
      return 'wall';
    } else if (token === '!') {
      return 'lava';
    }
  }
  createGrid()
}
*/
