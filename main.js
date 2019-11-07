// global consts
var box2DScale = 30; // convert meter to pixel
var bgColor = 0x181818;
var borderSize = 1;
var numItems = 50;

// global vars
var renderer, stage, b2dWorld, stageContainer, itemsContainer, hero, items;

// kick off on load
window.onload = init;

function init(){
	// create a renderer instance with transparency
	renderer = new PIXI.CanvasRenderer( 800, 600, null, true );

	// add the renderer canvas element to the DOM
	document.body.appendChild( renderer.view );

	// create an instance of an interactive pixi stage
	stage = new PIXI.Stage( bgColor, true );

	// create the stage container
	stageContainer = new PIXI.DisplayObjectContainer();
	stage.addChild( stageContainer );

	// create the physics world with no gravity
	var gravity = new Box2D.Common.Math.b2Vec2( 0, 0 );
	b2dWorld = new Box2D.Dynamics.b2World( gravity , true );

	// create the items container
	itemsContainer = new PIXI.DisplayObjectContainer();
	stageContainer.addChild( itemsContainer );

	// create items
	items = [];
	for( var i = 0; i < numItems; i++ ){
		var item = new Item( i );
		itemsContainer.addChild( item.view );
		items.push( item );
	};

	// create the hero
	hero = new Hero();
	stageContainer.addChild( hero.view );

	// add resize listener
	window.onresize = resize;
	resize();

	// start render
	render();
};

function resize(){
	// get window size
	var width = document.documentElement.clientWidth;
	var height = document.documentElement.clientHeight;

	// center align stage container
	stageContainer.position.x = Math.round( width / 2 );
	stageContainer.position.y = Math.round( height / 2 );

	// resize and render canvas
	renderer.resize( width, height );
	renderer.render( stage );
};

function render(){
	// physics update
	b2dWorld.Step( 1 / 40, 10, 10 );
	b2dWorld.ClearForces();

	// constant rotation of items
	itemsContainer.rotation += 0.00025;

	// render items
	for( var i = 0; i < numItems; i++){
		items[ i ].render();
	}

	// render stage
	renderer.render( stage );

	// loop
	requestAnimFrame( render );
};

function Hero(){
	// var
	var radius = 162.5;
	var margin = 40;

	// create view
	var el = new PIXI.DisplayObjectContainer();

	// create image
	var imageSize = Math.ceil( radius * 2 ) + 2;
	var imageSrc = "http://placehold.it/327x327.gif/1f282d/FFFFFF&text=Hello";
	var texture = PIXI.Texture.fromImage( imageSrc );
	var imageEl = new PIXI.Sprite( texture );
	imageEl.anchor.x = 0.5;
	imageEl.anchor.y = 0.5;
	el.addChild( imageEl );

	// create mask
	var maskEl = new PIXI.Graphics();
	maskEl.beginFill( 0x000000 );
	maskEl.drawCircle( 0, 0, radius );
	maskEl.endFill();
	el.addChild( maskEl );
	imageEl.mask = maskEl;

	// create border
	var borderEl = new PIXI.Graphics();
	borderEl.lineStyle( borderSize, bgColor );
	borderEl.drawCircle( 0, 0, radius );
	borderEl.endFill();
	el.addChild( borderEl );

	// create physics
	var fixDef = new Box2D.Dynamics.b2FixtureDef();
	fixDef.density = 1.0;
	fixDef.friction = 0.5;
	fixDef.restitution = 0.2;
	var bodyDef = new Box2D.Dynamics.b2BodyDef();
	fixDef.shape = new Box2D.Collision.Shapes.b2CircleShape( ( radius + margin ) / box2DScale );
	var body = b2dWorld.CreateBody( bodyDef );
	body.CreateFixture( fixDef );

	// public
	this.view = el;
};

function Item( index ){
	// var
	var isCircle = (Math.random() <= 0.75);
	var radius = 14.4 + Math.random() * (38.8 - 14.4); // circle
	var size = 35 + Math.random() * (50 - 35); // square
	var margin = 4;
	var speed = 0.5;
	var color = index / 2 === Math.floor( index / 2 ) ? "fa5d33" : "1faa88";
	var isOver = false;

	// create view
	var el = new PIXI.DisplayObjectContainer();

	// create image
	var imageSize;
	if( isCircle ){
		imageSize = Math.ceil( radius * 2 ) + 2;
	}else{
		imageSize = Math.ceil( size ) + 2;
	}
	var imageSrc = "http://placehold.it/" + imageSize + "x" + imageSize + ".gif/" + color + "/FFFFFF&text=" + ( index + 1 );
	var texture = PIXI.Texture.fromImage( imageSrc );
	var imageEl = new PIXI.Sprite( texture );
	imageEl.anchor.x = 0.5;
	imageEl.anchor.y = 0.5;
	el.addChild( imageEl );

	// create mask
	var maskEl = new PIXI.Graphics();
	maskEl.beginFill( 0x000000 );
	if( isCircle ){
		maskEl.drawCircle( 0, 0, radius );
	}else{
		maskEl.drawRect( -size / 2, -size / 2, size, size );
	}
	maskEl.endFill();
	el.addChild( maskEl );
	imageEl.mask = maskEl;

	// create border
	var borderEl = new PIXI.Graphics();
	borderEl.lineStyle( borderSize, bgColor );
	if( isCircle ){
		borderEl.drawCircle( 0, 0, radius );
	}else{
		borderEl.drawRect( -size / 2, -size / 2, size, size );
	}
	borderEl.endFill();
	el.addChild( borderEl );

	// add interaction
	el.setInteractive( true );
	if( isCircle ){
		el.hitArea = new PIXI.Circle( 0, 0, radius );
	}else{
		el.hitArea = new PIXI.Rectangle( -size * 0.5, -size * 0.5, size, size );
	}
	el.mouseover = function(){
		isOver = true;
	};
	el.mouseout = function(){
		isOver = false;
	};

	// create physics
	var force = new Box2D.Common.Math.b2Vec2();
	var fixDef = new Box2D.Dynamics.b2FixtureDef();
	fixDef.density = 1.0;
	fixDef.friction = 1.1;
	fixDef.restitution = 0.2;
	if( isCircle ){
		// circle
		fixDef.shape = new Box2D.Collision.Shapes.b2CircleShape( ( radius + margin ) / box2DScale );
	}else{
		// square
		fixDef.shape = new Box2D.Collision.Shapes.b2PolygonShape();
		fixDef.shape.SetAsBox( ( size + margin * 2 ) / 2 / box2DScale, ( size + margin * 2 ) / 2 / box2DScale );
	}
	var bodyDef = new Box2D.Dynamics.b2BodyDef();
	var body = b2dWorld.CreateBody( bodyDef );
	body.CreateFixture( fixDef );
	body.SetType( Box2D.Dynamics.b2Body.b2_dynamicBody );

	// set random position
	var positionX = -1000 + Math.random() * 2000;
	var positionY = -1000 + Math.random() * 2000;
	body.SetPosition({
		x: positionX / box2DScale,
		y: positionY / box2DScale
	});

	// set random angle
	body.SetAngle( Math.random() * 9999 );

	// public
	this.view = el;

	this.render = function(){
		// apply force
		force.x = -body.GetWorldCenter().x * 2.5;
		force.y = -body.GetWorldCenter().y * 2.5;
		body.ApplyForce( force, body.GetWorldCenter() );

		// store position in property
		positionX = body.GetPosition().x * box2DScale;
		positionY = body.GetPosition().y * box2DScale;

		// set position
		el.position.x += ( positionX - el.position.x) * speed;
		el.position.y += ( positionY - el.position.y) * speed;

		// set rotation
		el.rotation = body.GetAngle();

		// set alpha
		imageEl.alpha += ( (isOver ? 1 : 0.5) - imageEl.alpha) * speed;
	};
};