function Heap(len, func){
    //Format is (key) for each array entry
    //Priority is calculated by passing key into the function f
    this.data = new Array(len);
    this.data[0] = -1;
    this.func = func;
}

Heap.prototype.size = function(x){
    return this.data.length - 1;
}

Heap.prototype.insert = function(x){
    //Insert a new item to the end of the array
    var pos = this.data.length;
    this.data.push(x);
    //Percolate up
    while(pos / 2 > 0 && this.func(this.data[pos]) < this.func(this.data[Math.floor(pos / 2)])){
        temp = this.data[Math.floor(pos / 2)];
        this.data[Math.floor(pos / 2)] = this.data[pos];
        this.data[pos] = temp;
        pos = Math.floor(pos / 2);
    }
}

Heap.prototype.del = function(){
    //Remove head of Array and replace it with the last element
    var removed = this.data[1];
    this.data[1] = this.data[this.data.length - 1];
    this.data = this.data.splice(0, this.data.length - 1);
    //Percolate down
    var pos = 1;
    while(pos * 2 < this.data.length){
        minChild = this.minChild(pos);
        if (this.func(this.data[pos]) > this.func(this.data[minChild])){
            temp = this.data[pos];
            this.data[pos] = this.data[minChild];
            this.data[minChild] = temp;
        }
        pos = minChild;

    }
    return removed;
}

Heap.prototype.minChild = function(i){
    if (i * 2 + 1 > this.data.length)
        return i * 2;
    if (this.func(this.data[i*2]) < this.func(this.data[i*2+1]))
        return i * 2;
    return i * 2 + 1;
}

Heap.prototype.isEmpty = function(){
    return this.data.length <= 1;
}
