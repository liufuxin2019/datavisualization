// The fabric of the universe as viewed through Lissajous curves

const iterations = 50;
const distanceThreshold = 0;
const thetaThreshold = 0.001;
const numberOfWorkers = 4;
let symmetry = 0;

const duration = 2.5;
const interval = 1.0;
const omega = 20;
const zeta = 0.75;

const lissajousMax = 6;
let a = 1;
let b = 2;
let d = 0;

let running = true;


function Graph(canvas, array) {
	if (typeof array === "undefined" || array === null) array = [];
	Hyperact.activate(this);
	this.positionArray = array;
	this.path = [];
	this.element = canvas
	this.index = -1;
	this.registerAnimatableProperty("positionArray");
}

Graph.prototype = {
	constructor:Graph,
	reset: function() {
		this.index = -1;
		let thread = numberOfWorkers;
		this.path.length = 0;
		while (thread--) {
			this.path.push([]);
		}
	},
	beginPath: function(index) {
		this.index = index;
	},
	moveTo: function(x,y) {
		if (numberOfWorkers) {
			this.path[this.index].push(x);
			this.path[this.index].push(y);
		} else {
			this.path.push(x);
			this.path.push(y);
		}
	},
	lineTo: function(x,y) {
		this.moveTo(x,y);
	},
	stroke: function() {
		if (numberOfWorkers) {
			let array = []
			for (let i=0; i<numberOfWorkers; i++) {
				array = array.concat( this.path[i] );
			}
			this.positionArray = array;
		} else this.positionArray = this.path.slice(0);
		
	},
	animationForKey: function(key,value) {
		if (key === "positionArray") return {
			type: new Hyperact.HyperArray( new Hyperact.HyperNumber, this.positionArray.length),
			duration: duration,
			easing: easing
		};
	},
	display: function() {
		const canvas = this.element;
		const ctx = canvas.getContext("2d");
		const width = canvas.width;
		const height = canvas.height;
		const centerX = width/2.0;
		const centerY = height/2.0;
		ctx.clearRect(0, 0, width, height);
		const array = this.positionArray;
		const length = array.length;
		if (length > 1) {
			ctx.beginPath();
			ctx.moveTo(centerX+array[0],centerY+array[1]);
			for (let i = 2; i<length; i+=2) {
				ctx.lineTo(centerX+array[i],centerY+array[i+1]);
			}
			ctx.closePath();
			ctx.stroke();
		}
	}
}

let animated = false;


let timer;
let working = 0;
let queued = false;
const workers = [];
let date = performance.now();
let radiusA = 0;
let radiusB = 0;
const canvas = document.createElement("canvas");
document.body.appendChild(canvas);

const blob = new Blob(Array.prototype.map.call(document.querySelectorAll('script[type=\'text\/js-worker\']'), function (oScript) { return oScript.textContent; }),{type: 'text/javascript'});
//const blob = new Blob(["("+work.toString()+")()"], {type: "application/javascript"});
const url = URL.createObjectURL(blob);

for (let i=0; i<numberOfWorkers; i++) {
	const worker = new Worker(window.URL.createObjectURL(blob));
	worker.addEventListener("message", (e) => {
		respond(i,e.data);
	}, false);
	workers.push(worker);
}

window.addEventListener("resize", resize);
canvas.addEventListener("mousedown", (e) => {
	e.stopPropagation();
	e.preventDefault();
	running = false;
	randomize();
	layout();
});

let graph = new Graph(canvas,initial());

resize();

function randomize() {
	const numerator = Math.ceil(Math.random() * 10);
	let denominator = numerator;
	while (denominator === numerator || numerator > denominator) denominator = Math.ceil(Math.random() * 20);
	symmetry = numerator/denominator;
	if (Math.round(Math.random())) {
		const additional = Math.random() / 25000;
		symmetry -= additional;
	}
	a = Math.ceil(Math.random() * lissajousMax);
	b = a + 1;
	d = Math.random() * Math.PI * 2;
}

function manual() {
	let theta = 0;
	const result = [];
	const span = Math.PI * 2;
	const vertices = Math.round(span / thetaThreshold);
	const slice = span / vertices;
	for (let i=0; i<=vertices; i++) {
		const theta = i * slice;
		const array = plot(theta,symmetry,iterations,radiusA,radiusB,a,b,d);
		result.push(array[0]);
		result.push(array[1]);
	}
	return result;
}

function initial() {
	const result = [];
	for (let i=0; i<numberOfWorkers; i++) {
		const start = i/numberOfWorkers * Math.PI * 2;
		const end = start + Math.PI * 2 / numberOfWorkers;
		const span = end - start;
		const ratio = span / Math.PI * 2;
		const vertices = Math.round(span / thetaThreshold * ratio);
		for (let j=0; j<vertices; j++) {
			result.push(0);
			result.push(0);
		}
	}
	return result;
}

function plot(theta,symmetry,iterations,radiusA,radiusB,a,b,d) {
	const phi = symmetry * Math.PI;
	let i = iterations;
	let x = 0;
	let y = 0;
	do {
		const value = (i * theta) - (i * i * phi);
		x += ( Math.sin(a * value + d) / i ) * radiusA;
		y += ( Math.sin(b * value) / i ) * radiusB;
	} while (--i);
	return [x,y];
}
	
function layout() {
	if (working) {
		queued = true;
		return;
	}
	queued = false;
	date = performance.now();
	graph.reset();
	if (running) randomize();
	for (let i=0; i<numberOfWorkers; i++) {
		working++;
		update(i);
	}
	if (!numberOfWorkers) respond(0, manual());
}

function update(index) {
	const worker = workers[index];
	const start = index/numberOfWorkers * Math.PI * 2;
	const end = start + Math.PI * 2 / numberOfWorkers;
	worker.postMessage([symmetry,iterations,radiusA,radiusB,a,b,d,thetaThreshold,distanceThreshold,start,end,index]);
}

function respond(index,points) {
	const length = points.length;
	graph.beginPath(index);
	graph.moveTo(points[0], points[1]);
	for (let i=2; i<length; i+=2) {
		graph.lineTo(points[i], points[i+1]);
	}
	if (numberOfWorkers) working--;
	if (!numberOfWorkers || !working) {
		graph.stroke(index);
		const now = performance.now();
		date = now;
		if (timer && timer.clearTimeout) timer.clearTimeout();
		if (timer && timer.cancelTimeout) timer.cancelTimeout();
		timer = null;
		const clock = Math.random() * interval * 1000;
		if (running) timer = setTimeout(layout, clock);
		else if (queued) layout();
	}
}

function resize(e) {
	const width = window.innerWidth;
	const height = window.innerHeight;
	canvas.width = width;
	canvas.height = height
	radiusA = width / 6;
	radiusB = height / 6;
	layout();
}

function easing(progress) {
	const beta = Math.sqrt(1.0 - zeta * zeta);
	progress = 1 - Math.cos(progress * Math.PI / 2);
	progress = 1 / beta * Math.exp(-zeta * omega * progress) * Math.sin( beta * omega * progress + Math.atan(beta / zeta));
	return 1 - progress;
}