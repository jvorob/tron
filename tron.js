/*In the "Tron" rule, the transition function leaves each 
block unchanged except when all four of its cells have the 
same state, in which case their states are all reversed
*/

console.log("Loading tron.js...")

var Grid = function(width, height) {
	this.width = width;
	this.height = height;
	this.margOffset = false;//-1, -1
	
	//for testing, fill a circle 2 wide radius 5 from 7,7
	var foo = 0;
	//creates a w x h matrix
	//indexed by x, y from the top
	this.data = new Array(width);
	this.dataNext = new Array(width);
	for(var i = 0; i < width; i++){
		this.data[i] = new Array(height);
		this.dataNext[i] = new Array(height);
		for(var j = 0; j < height; j++){
			//element i,j
			this.data[i][j] = 0;
		}
	}
}

Grid.prototype.init = function(f) {
	for(var i = 0; i < this.width; i++){
		for(var j = 0; j < this.height; j++){
			this.data[i][j] = f(i,j);
		}
	}
}

Grid.prototype.isInBounds = function(x, y) {
	return (
		x >= 0 &&
		y >= 0 &&
		x < this.width &&
		y < this.height);
}


Grid.prototype.checkAlive = function(x, y) {
	if(!this.isInBounds(x,y)) { return 0; }
	return this.data[x][y];
}

Grid.prototype.setAlive = function(x, y, life) {
	if(!this.isInBounds(x,y)) { return; }
	this.data[x][y] = life;
}

Grid.prototype.toggle = function(x, y) {
	if(!this.isInBounds(x,y)) { return; }
	this.data[x][y] = !this.data[x][y];
}

Grid.prototype.swapBuffers = function() {
	var temp = this.data;
	this.data = this.dataNext;
	this.dataNext = temp;
}

Grid.prototype.countNeighbors = function(x, y) {
	var count = 0;
	count += this.checkAlive(x - 1, y - 1);
	count += this.checkAlive(x + 1, y - 1);
	count += this.checkAlive(x - 1, y + 1);
	count += this.checkAlive(x + 1, y + 1);
	count += this.checkAlive(x - 1, y);
	count += this.checkAlive(x + 1, y);
	count += this.checkAlive(x    , y - 1);
	count += this.checkAlive(x    , y + 1);
	return count;
}


Grid.prototype.updateConway = function() {
	for(var i = 0; i < this.width; i++){
		for(var j = 0; j < this.height; j++){

			var count = this.countNeighbors(i, j);
			if(!this.data[i][j]) {
				this.dataNext[i][j] = (count == 3);
			} else {
				this.dataNext[i][j] = (count == 3) || (count == 2);
			}

		}
	}
	this.swapBuffers();
}

//Counts alive cells in a block whose TL is x,y
Grid.prototype.countBlock = function(x,y) {

}

Grid.prototype.updateTron = function() {
	if(this.width % 2 || this.height % 2) {
		console.log("Uneven size ")
		return;
	}

	for(var i = 0; 2 * i < this.width; i++){
		for(var j = 0; j < this.height; j++){
			var c = this.countNeighbors(i, j);
			if(!this.data[i][j]) {
				this.dataNext[i][j] = (c == 3);
			} else {
				this.dataNext[i][j] = (c == 3) || (c == 2);
			}
		}
	}
}


Grid.prototype.draw = function(g, cellSize, vstart) {
	g.save();
	g.translate(-vstart.x, -vstart.y);
	
	//Draw cells
	g.fillStyle = "#420"// : "#EEE";
	for(var i = 0; 2 * i < this.width; i++){
		for(var j = 0; j < this.height; j++){
			if(this.data[i][j]) { g.fillRect(i * cellSize, j * cellSize, cellSize, cellSize);}
		}
	}

	//Draw outlines
	g.lineWidth = 1;
	g.strokeStyle = "#888";
	for(var i = 0; 2 * i < this.width; i++){
		for(var j = 0; j < this.height; j++){
			g.strokeRect(i * cellSize + 0.5, j * cellSize + 0.5, cellSize, cellSize);
		}
	}
	g.restore();
}

var Wrapper = new Object();

Wrapper.init = function(grid, canvas, cellsize) {
	Wrapper.playing = 1;
	Wrapper.grid = grid;
	grid.init(function(x,y) {
		return 0;
	})
	Wrapper.canvas = canvas;
	Wrapper.cellSize = cellsize;
	Wrapper.viewStart = new Vector(0,0);
	Wrapper.mouse = new Vector(0,0);
	Wrapper.pan.init(60, 5)

	Wrapper.drawAtFPS(60);
}

//Redraws the screen at intervals when it gets dirty
Wrapper.drawAtFPS = function(fps){
	Wrapper.drawDelay = 1000.0 / fps;
	setInterval(Wrapper.draw, Wrapper.drawDelay)
}

//marks the screen as dirty
Wrapper.redraw = function() {
	Wrapper.redrawFlag = true;
}

Wrapper.tick = function() {
	if(!Wrapper.playing) {return;}
	Wrapper.step()
	setTimeout(Wrapper.tick, 200);
}

Wrapper.step = function() {
	Wrapper.grid.updateConway();
	Wrapper.redraw();
}

Wrapper.draw = function() {
	var w = Wrapper;

	if(!w.redrawFlag) { return; }
	var g = w.canvas.getContext("2d");

	g.clearRect(0,0,w.canvas.width, w.canvas.height);
	w.grid.draw(g, w.cellSize, w.viewStart);

	//Draw mouse outline
	if(w.mouse.onScreen && w.grid.isInBounds(w.mouse.x, w.mouse.y)) {
		g.save();
		g.translate(-w.viewStart.x, -w.viewStart.y);
		
		//Draw outlines
		g.lineWidth = 5;
		g.strokeStyle = "#0A0";
		g.strokeRect(
				w.mouse.x * w.cellSize + 0.5, 
				w.mouse.y * w.cellSize + 0.5, 
				w.cellSize, w.cellSize);
		g.restore();
	}

	//Draw panning bounds
	g.lineWidth = 0.5;
	g.strokeStyle = "#800";
	for(var i = 0; i < w.pan.zones.length; i++) {
		w.pan.zones[i].bounds.draw(g);
	}

	w.redrawFlag = false;
}

Wrapper.playPause = function () {
	if(Wrapper.playing) {
		Wrapper.playing = 0;
		document.getElementById("pauseButton").value="Play";
	} else {
		Wrapper.playing = 1;
		document.getElementById("pauseButton").value="Pause";
	}
	Wrapper.tick();
}

Wrapper.clear = function () {
	Wrapper.grid.init(function() { return 0;});
	Wrapper.redraw();
}

Wrapper.mouseToTile = function(v) {
	var v2 = v.clone();
	v2.addV( Wrapper.viewStart);
	v2.scale(1. / Wrapper.cellSize);

	return Vector.floor(v2);
}

//interprets a click on the canvas
Wrapper.doClick = function(m){
	m = Wrapper.mouseToTile(m);

	Wrapper.grid.toggle(m.x, m.y);
	Wrapper.redraw();
}

Wrapper.doMove = function(m){
	Wrapper.mouse.pixelCoords = m.clone();
	m = Wrapper.mouseToTile(m);
	Wrapper.pan.checkPan();
	Wrapper.mouse.onScreen = true;
	Wrapper.mouse.setV(m);
	Wrapper.redraw();
}

Wrapper.doMouseOut = function(){
	Wrapper.mouse.onScreen = false;
	Wrapper.pan.checkPan();
	Wrapper.redraw();
}


Wrapper.pan = new Object();
Wrapper.pan.init = function(limit, speed){
	Wrapper.pan.panLimit = limit; //number of pixels from edge s.t. you pan
	Wrapper.pan.panSpeed = speed

	Wrapper.pan.panDirection = new Vector(0,0);
	
	var cSize = Wrapper.canvas.getBoundingClientRect();
	var w = cSize.width;
	var h = cSize.height;
	var lim = limit;

	Wrapper.pan.zones = [
		//Left
		{	bounds:		new Bounds(new Vector(0,0), new Vector(lim,h)),
			direction:	new Vector(-1, 0)},
		//Top
		{	bounds:		new Bounds(new Vector(0,0), new Vector(w,lim)),
			direction:	new Vector(0, -1)},
		//Right
		{	bounds:		new Bounds(new Vector(w - lim, 0), new Vector(lim,h)),
			direction:	new Vector(1, 0)},
		//Bottom
		{	bounds:		new Bounds(new Vector(0, h - lim), new Vector(w,lim)),
			direction:	new Vector(0, 1)},
	];

	Wrapper.pan.doPan();
}

//Get the direction to pan based on mouse coords
Wrapper.pan.checkPan = function(){
	var p = Wrapper.pan;

	var result = new Vector(0,0);
	if(Wrapper.mouse.onScreen) {
		for(var i = 0; i < p.zones.length; i++) {
			if(p.zones[i].bounds.contains(Wrapper.mouse.pixelCoords)) {
				result.addV(p.zones[i].direction);
			}
		}
	}
	Wrapper.pan.panDirection = result;
}

//Pan the screen every amount of time
Wrapper.pan.doPan = function() {
	if(!Wrapper.pan.panDirection.equals(0,0)) {
		Wrapper.viewStart.addScaledV(Wrapper.pan.panSpeed, Wrapper.pan.panDirection);
		Wrapper.redraw();
	}
	setTimeout(Wrapper.pan.doPan, 20);
}

function Bounds(pos,size){//pos and size are vectors
	this.pos = pos;
	this.size = size;}
Bounds.prototype.contains = function(pos){
	return pos.x > this.pos.x && pos.y > this.pos.y && pos.x < this.pos.x + this.size.x && pos.y < this.pos.y + this.size.y;}
Bounds.prototype.draw = function(g){
	g.strokeRect(this.pos.x, this.pos.y, this.size.x, this.size.y);
}

console.log("Done");
