// Thanks to Thibaud Goiffon for his text particle > https://codepen.io/Gthibaud/pen/pyeNKj
// which was a solid basis of reflection for this very project

// colors collections for particles
const pinkColors = [
  '#9e5d92',
  '#9e7d98',
  '#bf4da9',
  '#bf77b1',
  '#fc6fe2',
  '#e890d7',
  '#d1bccd',
  '#fcb6ef'
];
const flamesColors = [
  '#b20000',
  '#ff0000',
  '#ff5a00',
  '#ff9a00',
  '#ffce00',
  '#ffe808',
  '#fff6a3'
];
const rainbowColors = [
  "#f44336",
  "#e91e63",
  "#9c27b0",
  "#673ab7",
  "#3f51b5",
  "#2196f3",
  "#03a9f4",
  "#00bcd4",
  "#009688",
  "#4CAF50",
  "#8BC34A",
  "#CDDC39",
  "#FFEB3B",
  "#FFC107",
  "#FF9800",
  "#FF5722"
];

// rendering canvas, the one where particles will be drawn
const canvas = document.getElementById("renderingCanvas");
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
canvas.style["left"] = 0;
canvas.style["top"] = 0;
canvas.style["position"] = "absolute";

// constants for the behavior and look of the main type of particles
var pColors = flamesColors;     // particles colors
var pSize = 4;                  // minimum size of particle
var pSizeR = 0.5;               // randomness of the size of particles
var pSizeDecrease = 0.97 ;       // size decrease ratio of particles
var pOriginRand = 10;           // randomness of particle origin at creation (in pixels)
var pDirX = 3;                  // original direction of a particle on axis X
var pDirXR = 0.5;               // direction randomness of a particle on axis X
var pDirY = 0;                  // original direction of a particle on axis Y
var pDirYR = 0.5;               // direction randomness of a particle on axis Y
var pCreationInterval = 20;     // interval in milliseconds between particles creation

// constants for the behavior of the second type of particles
var p2proportions = 0.1         // proportion of second type of particles in the mix
var p2Size = 2;                  // minimum size of particle
var p2SizeR = 0.5;               // randomness of the size of particles
var p2SizeDecrease = 0.995 ;       // size decrease ratio of particles
var p2DirX = 2;                // original direction of a particle on axis X
var p2DirXR = 1;               // direction randomness of a particle on axis X
var p2DirY = 1.5;                 // original direction of a particle on axis Y
var p2DirYR = 1;               // direction randomness of a particle on axis Y

// constants for frame displacement
var followMouse = 0;            // if 1, the frame will follow the mouse, else the below rules apply
var originX = 1;                // starting point for origin on axis x (0 to 1, where 0 is left end and 1 is right end)
var originY = 0.5;              // starting point for origin on axis y (0 to 1, where 0 is bottom end and 1 is upper end)
var originSpeedX = -5;          // speed of the movement on x axis
var originSpeedY = 0;           // speed of the movement on y axis

// frame constants
const framePath = "Frames/";      // path to get the frames
var frameChoice = "Bird/";      // path to chosen gif
const frameExtension = ".png";    // extensions of the images containing the frames
var frameNumber = 24;           // total number of frames
var frameWidth = 275;           // width of the frames (must be the same for all)
var frameHeight = 275;          // height of the frames (must be the same for all)
var frameSize = 1;            // multiplicator for size of the drawn frame (higher is bigger)
var frameGrid = 10;             // definition of the drawn frame (higher means less particles)
var frameDuration = 3;          // how many particle creations per frame

// constants to make colors of particle depending on their size
var colorOnSize = 1;            // 1 means color will depend on the size, 0 means random
var colorSizeGrid = Math.max((pSize + pSizeR),(p2Size + p2SizeR)) / pColors.length; // to make color of particles depend on their size
                                                                                    // considering the maximum size of a particle and
                                                                                    // the number of possible colors

// drawing canvas which is out of the screen, used to read pixels of the current frame
const drawingCanvas = document.getElementById("drawingCanvas");
drawingCanvas.width = frameWidth;
drawingCanvas.height = frameHeight;
drawingCanvas.style["left"] = -frameWidth + "px";
drawingCanvas.style["top"] = -frameHeight + "px";
drawingCanvas.style["position"] = "absolute";
const drawingCtx = drawingCanvas.getContext('2d');

// canvas with the blurry shape, visible, used to create a glowing effect around the particles
const blurCanvas = document.getElementById("blurCanvas");
blurCanvas.width = window.innerWidth + 2*frameWidth*frameSize;
blurCanvas.height = window.innerHeight + 2*frameHeight*frameSize;
blurCanvas.style["left"] = -frameWidth*frameSize + "px";
blurCanvas.style["top"] = -frameHeight*frameSize + "px";
blurCanvas.style["position"] = "absolute";
const ctxBlur = blurCanvas.getContext('2d');

// background canvas, where the gradient takes place
const backgroundCanvas = document.getElementById("backgroundCanvas");
backgroundCanvas.width = window.innerWidth;
backgroundCanvas.height = window.innerHeight;

// array containing all the frames, may be a trouble to get depending on CORS settings
var frames = [];

// current frame
var currentFrame = 0;

// count for how many times the current frame has been drawn
var currentFrameDrawCount = 0;

// array containing all particles
var particlesArray = [];

// origin of the frame positions
var origin;

// timer for particles creations
var intervalTimer;

let mouse = {
  x: null,
  y : null,
}

window.addEventListener('mousemove',
  function(event){
    mouse.x = event.x;
    mouse.y = event.y;
  }
);


// object for the coordinates of the center of the frame
class Origin{
  constructor(){
    if(followMouse){
      this.x = mouse.x;
      this.y = mouse.y;
      this.dirX = 0;
      this.dirY = 0;
    }
    else {
      this.x = originX*(canvas.width + frameWidth*frameSize) - (frameWidth*frameSize/2);
      this.y = originY*(canvas.height + frameHeight*frameSize) - (frameHeight*frameSize/2);
      this.dirX = originSpeedX;
      this.dirY = originSpeedY;
    }
  }

  // method to update the position
  update(){
    if(followMouse){
      this.x = mouse.x;
      this.y = mouse.y;
    }
    else{
      this.x = this.x + this.dirX;
      this.y = this.y + this.dirY;
      // checking if position gets out of bounds,
      // moving it back to the opposite end if it is the case
      if(this.x > canvas.width + frameWidth*frameSize/2){
        this.x -= canvas.width + frameWidth*frameSize;
      }
      else if (this.x < -frameWidth*frameSize/2){
        this.x += canvas.width + frameWidth*frameSize;
      }
      if(this.y > canvas.height + frameHeight*frameSize/2){
        this.y -= canvas.height + frameHeight*frameSize;
      }
      else if (this.y < -frameHeight*frameSize/2){
        this.y += canvas.height + frameHeight*frameSize;
      }
    }
  }
}


// Particle creation
class Particle{
  constructor(x,y){
    // type of particle is 0 for main, 1 for secondary, proportions depend on p2proportions
    this.type = (Math.random() < p2proportions) ? 1 : 0;
    this.x = x + Math.random()*pOriginRand - pOriginRand/2;
    this.y = y + Math.random()*pOriginRand - pOriginRand/2;
    // the next 4 parameters depend on the type of the particle
    this.dirX = this.type ? Math.random() * p2DirXR - p2DirXR/2 + p2DirX : Math.random() * pDirXR - pDirXR/2 + pDirX;
    this.dirY = this.type ? Math.random() * p2DirYR - p2DirYR/2 + p2DirY : Math.random() * pDirYR - pDirYR/2 + pDirY;
    this.size = this.type ? Math.random() * p2SizeR + p2Size : Math.random() * pSizeR + pSize;
    this.color = colorOnSize ? pColors[Math.round(this.size/colorSizeGrid)] : pColors[Math.floor(Math.random() * pColors.length)];
  }
  // method to draw each particle
  draw(){
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI*2, false);
    ctx.fillStyle = this.color;
    ctx.fill();
  }
  // method to check position of particle
  update(){
    // determining the size and directions of particles, depending on their type
    this.dirX += this.type ? Math.random()*p2DirXR - p2DirXR/2 : Math.random()*pDirXR - pDirXR/2;
    this.dirY += this.type ? Math.random()*p2DirYR - p2DirYR/2 : Math.random()*pDirYR - pDirYR/2;
    this.size *= this.type ? p2SizeDecrease : pSizeDecrease;
    if(colorOnSize){
      this.color = pColors[Math.round(this.size/colorSizeGrid)];
    }
    // moving particles
    this.x += this.dirX;
    this.y += this.dirY;
    // draw particle
    this.draw();
  }
}


// create new particles from current frame
function createParticles(){
  // Draw the frame in the drawing canvas
  drawingCtx.drawImage(frames[currentFrame],0,0);
  var idata = drawingCtx.getImageData(0, 0, frameWidth, frameHeight);
  var buffer32 = new Uint32Array(idata.data.buffer);

  // Check for black pixels
  for (var y = 0; y < frameHeight; y += frameGrid) {
    for (var x = 0; x < frameWidth; x += frameGrid) {
      if (buffer32[y * frameWidth + x]) {
        // frameSize will make frame bigger but also increasingly move it away so we also have to offset coordinates
        // with the formulas to ensure it stays centered on the origin
        particlesArray.push(new Particle(origin.x + (x-frameWidth/2)*frameSize, origin.y + (y-frameWidth/2)*frameSize));
      }
    }
  }
  drawingCtx.clearRect(0, 0, frameWidth, frameHeight);
}

// delete particles outside the canvas or too small
function deleteParticles(){
  var newPArray = [];
  for(let i = 0; i < particlesArray.length; i++){
    if(particlesArray[i].x > 0 && particlesArray[i].y > 0 && particlesArray[i].x < canvas.width && particlesArray[i].y < canvas.height && particlesArray[i].size > 1 ){
      newPArray.push(particlesArray[i])
    }
  }
  particlesArray = newPArray;
}

// update blur canvas
function updateBlurCanvas(){
  ctxBlur.clearRect(0, 0, blurCanvas.width, blurCanvas.height);
  // making the image drawing follow the origin
  ctxBlur.drawImage(frames[currentFrame],origin.x + frameWidth*frameSize/2, origin.y + frameHeight*frameSize/2, frameWidth*frameSize, frameHeight*frameSize);
}

// frame management
function nextFrame(){
  // counting how many times the current frame was drawn
  currentFrameDrawCount = (currentFrameDrawCount + 1)%frameDuration;
  // moving onto the next frame if it reached frameDuration parameter
  if(currentFrameDrawCount == 0){
    currentFrame = (currentFrame + 1)%frameNumber;
  }
}

// load frames into array
function loadFrames(){
  var newFrames = [];
  for(let i = 0; i < frameNumber ; i++){
    var img = new Image();
    img.src = framePath + frameChoice + i + frameExtension;
    newFrames.push(img);
  }
  frames = newFrames;
  currentFrame = 0;
  currentFrameDrawCount = 0;
}


// create particle array, positions are randomized
function init(){
  W = canvas.width = window.innerWidth;
  H = canvas.height = window.innerHeight;

  // getting all the frames into the array of frames
  loadFrames();
  // creating the origin object
  origin = new Origin();
}

// update interval timer
function updateIntervalTimer(){
  clearInterval(intervalTimer);
  intervalTimer = setInterval(function(){
    origin.update();
    updateBlurCanvas();
    createParticles();
    deleteParticles();
    nextFrame();
  }, pCreationInterval);
}

// functions to apply the changes of parameters
// background changes
function bgChange(){
  var invert = document.getElementById("bgGradient").value;
  var hue = document.getElementById("bgHue").value;
  var saturation = document.getElementById("bgSaturation").value;
  var brightness = document.getElementById("bgBrightness").value;
  backgroundCanvas.style["filter"] = "invert(" + invert + "%) sepia() hue-rotate(" + hue + "deg) saturate(" + saturation + ") brightness("+ brightness +"%) blur(5px)";
}

// blur canvas changes
function bcChange(){
  var hue = document.getElementById("bcHue").value;
  var saturation = document.getElementById("bcSaturation").value;
  var blur = document.getElementById("bcBlur").value;
  var brightness = document.getElementById("bcBrightness").value;
  blurCanvas.style["filter"] = "invert(100%) sepia() hue-rotate(" + hue + "deg) saturate(" + saturation + ") brightness(" + brightness + "%) blur(" + blur + "px)";
}

// shape changes
function shapeChange(){
  var shChoice = document.getElementById("shChoice").value;
  var shFollowMouse = document.getElementById("shFollowMouse").value;
  var size = document.getElementById("shSize").value;
  var xPos = document.getElementById("shXpos").value;
  var xSpeed = document.getElementById("shXspeed").value;
  var yPos = document.getElementById("shYpos").value;
  var ySpeed = document.getElementById("shYspeed").value;
  var aSpeed = document.getElementById("shAspeed").value;

  switch (shChoice) {
    case "bird":
      frameChoice = "Bird/";
      frameNumber = 24;
      frameWidth = 275;
      frameHeight = 275;
      break;
    case "wolf":
    frameChoice = "Wolf/";
    frameNumber = 13;
    frameWidth = 275;
    frameHeight = 275;
      break;
    default:
      console.log("Unexpected frame choice.");
  }
  loadFrames();


  frameSize = size;
  blurCanvas.width = window.innerWidth + 2*frameWidth*frameSize;
  blurCanvas.height = window.innerHeight + 2*frameHeight*frameSize;
  blurCanvas.style["left"] = -frameWidth*frameSize + "px";
  blurCanvas.style["top"] = -frameHeight*frameSize + "px";
  blurCanvas.style["position"] = "absolute";

  followMouse = parseInt(shFollowMouse, 10);

  if(!followMouse){
    origin.x = xPos*(canvas.width + frameWidth*frameSize) - (frameWidth*frameSize/2);;
    origin.y = yPos*(canvas.height + frameHeight*frameSize) - (frameHeight*frameSize/2);
    origin.dirX = parseInt(xSpeed, 10);
    origin.dirY = parseInt(ySpeed, 10);
  }

  document.getElementById("shFollowMouse").className = followMouse ? "switch switch-on" : "switch";

  frameDuration = 11 - aSpeed;
}

// particles parameters changes
function particlesChange(){
  var mpColor = document.getElementById("mpColor").value;
  var mpColorP = parseInt(document.getElementById("mpColorP").value, 10);
  var mpHue = parseInt(document.getElementById("mpHue").value, 10);
  var mpCreationInterval = parseInt(document.getElementById("mpCreationInterval").value,10);
  var mpDensity = parseInt(document.getElementById("mpDensity").value,10);
  var mpPosR = parseInt(document.getElementById("mpPosR").value, 10);
  var mpXspeed = parseFloat(document.getElementById("mpXspeed").value);
  var mpXspeedR = parseFloat(document.getElementById("mpXspeedR").value);
  var mpYspeed = parseFloat(document.getElementById("mpYspeed").value);
  var mpYspeedR = parseFloat(document.getElementById("mpYspeedR").value);
  var mpSize = parseFloat(document.getElementById("mpSize").value);
  var mpSizeR = parseFloat(document.getElementById("mpSizeR").value);
  var mpSizeDR = parseFloat(document.getElementById("mpSizeDR").value);
  var spProp = parseFloat(document.getElementById("spProp").value);
  var spXspeed = parseFloat(document.getElementById("spXspeed").value);
  var spXspeedR = parseFloat(document.getElementById("spXspeedR").value);
  var spYspeed = parseFloat(document.getElementById("spYspeed").value);
  var spYspeedR = parseFloat(document.getElementById("spYspeedR").value);
  var spSize = parseFloat(document.getElementById("spSize").value);
  var spSizeR = parseFloat(document.getElementById("spSizeR").value);
  var spSizeDR = parseFloat(document.getElementById("spSizeDR").value);

  switch(mpColor){
    case "pinkColors": pColors = pinkColors;
      break;
    case "flamesColors": pColors = flamesColors;
      break;
    case "rainbowColors": pColors = rainbowColors;
      break;
    default: console.log("Unexpected color choice.");
  }
  // setting the interval between particles creation
  pCreationInterval = mpCreationInterval;
  // setting new frame grid based on density
  frameGrid = 55 - mpDensity;
  // setting randomness of particles creation around grid
  pOriginRand = mpPosR;
  // setting main particles
  pDirX = mpXspeed;
  pDirXR = mpXspeedR;
  pDirY = mpYspeed;
  pDirYR = mpYspeedR;
  pSize = mpSize;
  pSizeR = mpSizeR;
  pSizeDecrease = 1 - mpSizeDR;
  // setting secondary particles
  p2proportions = spProp;
  p2DirX = spXspeed;
  p2DirXR = spXspeedR;
  p2DirY = spYspeed;
  p2DirYR = spYspeedR;
  p2Size = spSize;
  p2SizeR = spSizeR;
  p2SizeDecrease = 1 - spSizeDR;

  colorOnSize = mpColorP;
  if(colorOnSize){
    colorSizeGrid = Math.max((pSize + pSizeR),(p2Size + p2SizeR)) / pColors.length;
  }

  canvas.style["filter"] = "hue-rotate(" + mpHue + "deg)";

  document.getElementById("mpColorP").className = mpColorP ? "switch switch-on" : "switch" ;

  // interval for creation of particles apply
  updateIntervalTimer();

}

// function to show or hide hideable parameters
function showHide(element, name){
  if(element.className == "menu-open"){
    element.className = "menu-closed";
    document.getElementById(name).className = "hideable hidden";
  }
  else{
    element.className = "menu-open";
    document.getElementById(name).className = "hideable";
  }
}


// animation
function animate(){
  requestAnimationFrame(animate);
  ctx.clearRect(0,0,innerWidth, innerHeight);

  for(let i = 0; i < particlesArray.length; i++){
    particlesArray[i].update();
  }
}

// now we play :-)
init();
animate();
updateIntervalTimer();
