/**
Grid system for the 2D map:
g(x, y) = discomfort function
phi(x, y) = potential function: total cost of optimal path to the goal
rho(x, y) = population density (sum of bump functions around each agent)
h(x, y) = height map (we are modelling flat ground so this is 0)
bar(v)(x, y)
= sum (rho_i x_i)/rho
= average velocity field of all individuals, weighted by population density

f(x, y, theta) = speed of individual at a given position and facing a certain direction
C(x, y, theta) = unit cost field, a linear combination of f and g
v(x, y, theta) = velocity of each agent

Each grid encodes (g, phi, rho, h, bar(v)) in the interior
plus (f, C, grad h, grad phi, v) on each edge
**/
function Grid(coord){
		this.coord = coord;
    this.width = 20; //20 x 20 grid
		this.center = new Vector2D((coord.x + 0.5) * this.width,
									(coord.y + 0.5) * this.width); //Center of grid in (x, y)

		this.centerData = {g: 0, rho: 0, phi: 0, h: 0, vbar: new Vector2D(0, 0)};
		this.westFace = {f: 0, c: 0, v: 0};
		this.northFace = {f: 0, c: 0, v: 0};
		this.eastFace = {f: 0, c: 0, v: 0};
		this.southFace = {f: 0, c: 0, v: 0};

}

Grid.prototype.addDensity = function(rho){
		this.centerData.rho += rho;
}

//Reset all the calculations
Grid.prototype.clearData = function(){
		this.centerData = {g: 0, rho: 0, phi: 0, h: 0, vbar: new Vector2D(0, 0)};
		this.westFace = {f: 0, c: 0, v: 0};
		this.northFace = {f: 0, c: 0, v: 0};
		this.eastFace = {f: 0, c: 0, v: 0};
		this.southFace = {f: 0, c: 0, v: 0};
}

/* A rectangular region with its vertices (in grid coords) specified */
function Goal(minX, maxX, minY, maxY){
		this.minX = minX;
		this.maxX = maxX;
		this.minY = minY;
		this.maxY = maxY;
}
