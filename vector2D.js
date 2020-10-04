function Vector2D(x, y){
		this.x = x;
		this.y = y;
}

//Get the angle of a 2D vector
Vector2D.prototype.angle = function(){
		if (this.x == 0)
			return Math.asin(Math.abs(this.y) / this.y);
		else
			return Math.atan2(this.y, this.x);
}

//Add vectors
Vector2D.prototype.add = function(w){
  return new Vector2D(this.x + w.x, this.y + w.y);
}

//Scalar multiply vectors
Vector2D.prototype.scalarMult = function(t){
  return new Vector2D(t * this.x, t * this.y);
}

Vector2D.prototype.subtract = function(w){
  return this.add(w.scalarMult(-1.0));
}

//Dot product with the vector w
Vector2D.prototype.dot = function(w){
  return (this.x * w.x) + (this.y * w.y);
}

//Project onto the vector w
Vector2D.prototype.project = function(w){
  return w.scalarMult(this.dot(w));
}

Vector2D.prototype.modulus = function(){
	return Math.sqrt((this.x * this.x) + (this.y * this.y));
}

Vector2D.prototype.normalize = function(){
	return new Vector2D (this.x / this.modulus(), this.y / this.modulus());
}
