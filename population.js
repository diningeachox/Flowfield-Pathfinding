
/** Each agent object has (x, y) coords and a movement speed
Also has a goal (which is an rectangular region given by 4 vertices)
**/
function Agent(pos, speed, goal, size, index){
		this.pos = pos;
		this.speed = speed;
		this.goal = goal;
		this.size = size;
		this.index = index;
		this.vel = new Vector2D(0, 0);
}

Agent.prototype.getPos = function(){
		return this.pos;
}

Agent.prototype.setPos = function(p){
		this.pos = p;
}

Agent.prototype.getVel = function(){
		return this.vel;
}

Agent.prototype.setVel = function(v){
		this.vel = v;
}

Agent.prototype.gridCoords = function(){
		return new Vector2D(Math.floor(this.pos.x / gridWidth), Math.floor(this.pos.y / gridWidth));
}

/* Find the next closest grid center to the southwest of agent*/
Agent.prototype.closestGrid = function(){
		var grid = this.gridCoords();
		var gridCenter = getCenter(grid); //Center of current grid agent is on
		if (this.pos.x > gridCenter.x && this.pos.y < gridCenter.y){
				//Agent is in northeastern quarter so closest is agent's own grid
				return gridCenter;
		} else if (this.pos.x > gridCenter.x && this.pos.y >= gridCenter.y){
				//Agent is in southeastern quarter so closest is the grid below current grid
				return gridCenter.add(new Vector2D(0, gridWidth));
		} else if (this.pos.x <= gridCenter.x && this.pos.y < gridCenter.y){
				//Agent is in northwestern quarter so closest is the grid left of current grid
				return gridCenter.add(new Vector2D(-1 * gridWidth, 0));
		}
		//Agent is in southwestern quarter so closest is the grid 1 below and 1 to the left of current grid
		return gridCenter.add(new Vector2D(-1 * gridWidth, gridWidth));
}
