/* A group is a set of agents with a common goal */
function Group(agents){
    //All the grid variables required for flowfield calculations for the group
    //(density field, avg velocity field and discomfort field is shared by all groups)
    this.agents = agents;
    this.speeds = [];
    this.costs = [];
    this.gradPhi = [];
    this.potential = [];
    this.velocities = []; //Velocities on the faces of the grids
    this.totalVel = []; // Sum of velocities of the faces of the grids
    //Holds status for the fast marching algorithm: 0 - known/accepted, 1 - considered/candidate, 2 - unknown/far
    this.states = [];
    this.goal;
}
//Clear grids for the next calculation
Group.prototype.clearQuantities = function(){
    for (var i = 0; i < this.densityField.length; i++){
        this.velocities[i] = new Array(new Vector2D(0, 0), new Vector2D(0, 0),
            new Vector2D(0, 0), new Vector2D(0, 0));
        this.potential[i] = Infinity;
        this.totalVel[i] = new Vector2D(0, 0);
        this.speeds[i] = new Array(0, 0, 0, 0);
        this.gradPhi[i] = new Array(0, 0, 0, 0);
        this.costs[i] = new Array(0, 0, 0, 0);
        this.states[i] = 2;
    }
    //Goal remains the same (until it is changed by the user)
}


//Update unit cost field
Group.prototype.calcCosts = function(){
    //Topographic speed (for areas of low density) normalized at 1.0
    var speedT = 1.0;
    //We use an offset of one cell in the direction of the velocity
    for (var j = 0; j < gridVer - 1; j++){
        for (var k = 0; k < gridHor - 1; k++){
            //Clamp flow speeds to [0.01, 1]
            speedFlowEast = clamp(small(this.avgVel[(j + 1) * (gridHor + 1) + (k + 2)].x));
            speedEast = speedT +
              clamp((this.densityField[(j + 1) * (gridHor + 1) + (k + 2)] - min) / (max - min)) * (speedFlowEast - speedT);

            speedFlowSouth = clamp(small(this.avgVel[(j + 2) * (gridHor + 1) + (k + 1)].y));
            speedSouth = speedT +
              clamp((this.densityField[(j + 2) * (gridHor + 1) + (k + 1)] - min) / (max - min)) * (speedFlowSouth - speedT);

            speedFlowWest = clamp(small(-1.0 * this.avgVel[(j + 1) * (gridHor + 1) + k].x));
            speedWest = speedT +
              clamp((this.densityField[(j + 1) * (gridHor + 1) + k] - min) / (max - min)) * (speedFlowWest - speedT);

            speedFlowNorth = clamp(small(-1.0 * this.avgVel[j * (gridHor + 1) + (k + 1)].y));
            speedNorth = speedT +
              clamp((this.densityField[j * (gridHor + 1) + (k + 1)] - min) / (max - min)) * (speedFlowNorth - speedT);
            this.speeds[(j + 1) * (gridHor + 1) + (k + 1)][0] = speedEast;
            this.speeds[(j + 1) * (gridHor + 1) + (k + 1)][1] = speedSouth;
            this.speeds[(j + 1) * (gridHor + 1) + (k + 1)][2] = speedWest;
            this.speeds[(j + 1) * (gridHor + 1) + (k + 1)][3] = speedNorth;
            //Now calculate costs

            this.costs[(j + 1) * (gridHor + 1) + (k + 1)][0] =
            ((alpha * speedEast) + beta + (gamma * discomfort[(j + 1) * (gridHor + 1) + (k + 2)])) / (speedEast);
            this.costs[(j + 1) * (gridHor + 1) + (k + 1)][1] =
            ((alpha * speedSouth) + beta + (gamma * discomfort[(j + 2) * (gridHor + 1) + (k + 1)])) / (speedSouth);
            this.costs[(j + 1) * (gridHor + 1) + (k + 1)][2] =
            ((alpha * speedWest) + beta + (gamma * discomfort[(j + 1) * (gridHor + 1) + k])) / (speedWest);
            this.costs[(j + 1) * (gridHor + 1) + (k + 1)][3] =
            ((alpha * speedSouth) + beta + (gamma * discomfort[j * (gridHor + 1) + (k + 1)])) / (speedNorth);
        }
    }
}
//Construct potential and its gradient

Group.prototype.calculatePotential = function(){
    goalarea = [];
    candidates = new Heap(1, phiLookup);
    //Populate the known array with grids inside the goal area
    for (var j = this.goal.minY; j < this.goal.maxY; j++){
        for (var k = this.goal.minX; k < this.goal.maxX; k++){
            //Push the (j, k) coords of grids, to be looked up later in the field arrays
            goalarea.push((j + 1) * (gridHor + 1) + (k + 1));
            this.states[(j + 1) * (gridHor + 1) + (k + 1)] = 0;
            this.potential[(j + 1) * (gridHor + 1) + (k + 1)] = 0;
        }
    }

    function calcNeighbors(neighbors){
        neighbors.forEach(index => {
              if (this.states[index] != 0){ //If not yet known
                  //The neighbor's neighbors' potentials
                  adjacents = neighboringPotential(index)
                  //Min directions
                  minHor = 2 * (this.costs[index][0] + adjacents[0] > this.costs[index][2] + adjacents[2])
                  minVer = 2 * (this.costs[index][1] + adjacents[1] > this.costs[index][3] + adjacents[3]) + 1
                  var phi = Infinity; //The new potential we will calculate
                  var a, b, c = 0;
                  if (adjacents[minHor] < Infinity && adjacents[minVer] < Infinity){
                      //Both directions have well-defined potentials
                      a = Math.pow(1 / this.costs[index][minHor], 2) + Math.pow(1 / this.costs[index][minVer], 2)
                      b = -2 * ((adjacents[minHor] * Math.pow(1 / this.costs[index][minHor], 2))
                      + (adjacents[minVer] * Math.pow(1 / this.costs[index][minVer], 2)))
                      c = Math.pow(adjacents[minHor] / this.costs[index][minHor], 2) + Math.pow(adjacents[minVer] / this.costs[index][minVer], 2) - 1
                  } else if (adjacents[minHor] < Infinity && adjacents[minVer] == Infinity){
                      //Horizontal directions has a well-defined potential
                      a = Math.pow(1 / this.costs[index][minHor], 2)
                      b = -2 * adjacents[minHor] * Math.pow(1 / this.costs[index][minHor], 2)
                      c = Math.pow(adjacents[minHor] / this.costs[index][minHor], 2) - 1
                  } else if (adjacents[minHor] == Infinity && adjacents[minVer] < Infinity){
                      //Horizontal directions has a well-defined potential
                      a = Math.pow(1 / this.costs[index][minVer], 2)
                      b = -2 * adjacents[minVer] * Math.pow(1 / this.costs[index][minVer], 2)
                      c = Math.pow(adjacents[minVer] / this.costs[index][minVer], 2) - 1
                  } else {
                      console.log("Something's wrong because this case can't happen!")
                  }

                  if ((b * b) - (4 * a * c) < 0){
                    //If the discriminant for the quadratic equation is <0, reduce to 1-dimensional case
                    val = Math.min(adjacents[minHor], adjacents[minVer])
                    if (val < Infinity){
                      //Add total cost to the min of the neighboring potentials
                      phi = (adjacents[minHor] <= adjacents[minVer]) * this.costs[index][minHor]
                      + ((adjacents[minHor] > adjacents[minVer]) * this.costs[index][minVer]) + val
                    }
                  } else {
                      phi = solveQuadratic(a, b, c)
                  }
                  //Update the cell's potential
                  if (phi < this.potential[index]){
                      this.potential[index] = phi
                      //Mark as candidate and insert to candidates
                      if (this.states[index] == 2){
                          this.states[index] = 1
                          candidates.insert(index)
                      }

                  }
              }
        });
    }
    //Add neighbors of currently known cells to candidates array
    for (var i = 0; i < goalarea.length; i++){
        calcNeighbors(getNeighbors(goalarea[i]));
    }

    //Run fast marching algorithm until all candidates have been marked as known
    while (!candidates.isEmpty()){
        //Get the candidate cell with the smallest potential
        candidate = candidates.del();
        //Label this cell as known/accepted
        this.states[candidate] = 0;
        calcNeighbors(getNeighbors(candidate));
    }
}

//Calculate potential gradients and velocities
Group.prototype.calculateGradients = function(){
    for (var i = 0; i < this.gradPhi.length; i++){
        adjacents = neighboringPotential(i);
        for (var j = 0; j < 4; j++){
            if (this.potential[i] < Infinity && adjacents[j] < Infinity){
                this.gradPhi[i][j] = adjacents[j] - this.potential[i];
            } else {
              //In all of these cases at least one of the potentials is undefined so the gradient is also undefined
              this.gradPhi[i][j] = Infinity;
            }
        }

        var dx, dy = 0;
        if (this.gradPhi[i][0] < Infinity && this.gradPhi[i][2] < Infinity){
            dx = (this.gradPhi[i][0] - this.gradPhi[i][2]) / 2;
        } else if (this.gradPhi[i][0] < Infinity){
            dx = this.gradPhi[i][0];
        } else if (this.gradPhi[i][2] < Infinity){
            dx = -1 * this.gradPhi[i][2];
        } else {
            //This is either out of bounds or surrounded by obstacles
            //in this case set dx = 0
            dx = 0;
        }

        if (this.gradPhi[i][1] < Infinity && this.gradPhi[i][3] < Infinity){
            dy = (this.gradPhi[i][1] - this.gradPhi[i][3]) / 2;
        } else if (this.gradPhi[i][1] < Infinity){
            dy = this.gradPhi[i][1];
        } else if (this.gradPhi[i][3] < Infinity){
            dy = -1 * this.gradPhi[i][3];
        } else {
            //This is either out of bounds or surrounded by obstacles
            //in this case set dy = 0
            dy = 0;
        }

        //Calculate Velocities
        if (dx != 0 || dy != 0){
            norm_grad = new Vector2D(dx, dy).normalize();
            for (var j = 0; j < 4; j++){
                //Velocity is negative of speed * gradient
                this.velocities[i][j] = norm_grad.scalarMult(-1 * this.speeds[i][j]);
            }
            speed = 0;
            //The direction of the normalized gradient
            theta = norm_grad.angle();
            //Interpolate between the speeds on the 4 faces of the cell
            //Javascript uses the (-pi, pi] branch of theta
            tau = Math.PI / 2; //Finally tau is more useful than pi!
            if (0 < theta && theta <= tau)
                //First quadrant: between east and north
                speed = ((1 - (theta / tau)) * this.speeds[i][0]) + ((theta / tau) * this.speeds[i][3]);
            else if (tau < theta && theta <= Math.PI)
                //First quadrant: between north and west
                speed = ((1 - ((theta - tau) / tau)) * this.speeds[i][3]) + (((theta - tau) / tau) * this.speeds[i][2]);
            else if (-1.0 * Math.PI < theta && theta <= -1.0 * tau)
                //Third quadrant: between west and south
                speed = ((1 - ((theta + Math.PI) / tau)) * this.speeds[i][2]) + (((theta + Math.PI) / tau) * this.speeds[i][1]);
            else if (-1.0 * tau < theta && theta <= 0)
                //Fourth quadrant: between south and east
                speed = ((1 - ((theta + tau) / tau)) * this.speeds[i][1]) + (((theta + tau) / tau) * this.speeds[i][0]);
            //Add up all the velocities at the 4 faces
            this.totalVel[i] = norm_grad.scalarMult(-1.0 * speed);
        } else {
            //Here we cannot normalize the gradient so we set velocity to 0
            for (var j = 0; j < 4; j++){
                //Velocity is negative of speed * gradient
                this.velocities[i][j] = new Vector2D(0, 0);
            }
            //Here total velocity for the cell is also 0
            this.totalVel[i] = new Vector2D(0, 0);
        }
    }
}
//Update agents' locations
Group.prototype.moveAgents = function(){

    //Move each agent by the interpolated velocities
    for (var i = 0; i < this.agents.length; i++){
        agent = this.agents[i];
        //Calculates which cell the agent is in, then the agent is bound
        //by the 4 vertices of that cell
        coords = agent.gridCoords();
        //Gets closest cell center northwest of agent
        closest = agent.closestGrid();
        //Calculate the four cell centers (which are the 4 vertices we put into bilinearInterpolation)
        a = closest.add(new Vector2D(0, -1 * gridWidth));
        b = a.add(new Vector2D(gridWidth, 0));
        c = closest;
        d = c.add(new Vector2D(gridWidth, 0));
        v = bilinearInterpolation(lookup, a, b, c, d, agent.getPos());
        agent.setVel(v);   //Set new Velocities
        agent.setPos(agent.getPos().add(v.scalarMult(agent.speed))); //Move agent according to its speed
    }
}

//Set a rectangular area for the group as the goal
Group.prototype.setGoal = function(minX, maxX, minY, maxY){
    this.goal = new Goal(minX, maxX, minY, maxY);
}
