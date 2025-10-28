document.addEventListener('DOMContentLoaded', function() {
  var Fireworks = function() {
    var self = this;
    var rand = function(rMi, rMa){return ~~((Math.random()*(rMa-rMi+1))+rMi);}
    window.requestAnimFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || function(a){window.setTimeout(a, 1000/60)};
    self.init = function() {
      self.dt = 0;
      self.oldTime = Date.now();
      self.canvas = document.createElement('canvas');
      self.canvas.width = window.innerWidth;
      self.canvas.height = window.innerHeight;
      self.canvas.style.position = 'fixed';
      self.canvas.style.top = '0';
      self.canvas.style.left = '0';
      self.canvas.style.width = '100%';
      self.canvas.style.height = '100%';
      self.canvas.style.pointerEvents = 'none';
      self.canvas.style.zIndex = '9999';
      document.body.appendChild(self.canvas);
      self.ctx = self.canvas.getContext('2d');
      self.ctx.lineCap = 'round';
      self.ctx.lineJoin = 'round';
      self.particles = [];
      self.fireworks = [];
      self.partCount = 30;
      self.partSpeed = 5;
      self.partSpeedVariance = 10;
      self.partWind = 50;
      self.partFriction = 5;
      self.partGravity = 1;
      self.hueMin = 0;
      self.hueMax = 360;
      self.hueVariance = 30;
      self.fworkSpeed = 2;
      self.fworkAccel = 4;
      self.lineWidth = 1;
      self.clearAlpha = 25;
      self.currentHue = 170;
      self.bindEvents();
      (function loop(){
        self.canvasLoop();
        requestAnimFrame(loop);
      })();
        setInterval(function() {
            var randX = rand(0, window.innerWidth);
            var randY = rand(50, window.innerHeight/1.5);
            var hue = rand(self.hueMin, self.hueMax);
            self.createFireworks(self.canvas.width/2, self.canvas.height, randX, randY);
        }, 500);
    };
    var Particle = function(x, y, hue){
      this.x = x; this.y = y;
      this.coordLast = [{x:x,y:y},{x:x,y:y},{x:x,y:y}];
      this.angle = rand(0, 360);
      this.speed = rand(Math.max(1,self.partSpeed-self.partSpeedVariance), self.partSpeed+self.partSpeedVariance);
      this.friction = 1-self.partFriction/100;
      this.gravity = self.partGravity/2;
      this.hue = rand(hue-self.hueVariance, hue+self.hueVariance);
      this.brightness = rand(50,80);
      this.alpha = rand(40,100)/100;
      this.decay = rand(10,50)/1000;
      this.wind = (rand(0,self.partWind)-(self.partWind/2))/25;
      this.lineWidth = self.lineWidth;
    };
    Particle.prototype.update = function(index){
      var radians = this.angle*Math.PI/180;
      var vx = Math.cos(radians)*this.speed;
      var vy = Math.sin(radians)*this.speed+this.gravity;
      this.speed *= this.friction;
      this.coordLast[2]=this.coordLast[1];
      this.coordLast[1]=this.coordLast[0];
      this.coordLast[0]={x:this.x,y:this.y};
      this.x += vx*self.dt;
      this.y += vy*self.dt;
      this.angle += this.wind;
      this.alpha -= this.decay;
      if(this.alpha<0.05){ self.particles.splice(index,1); }
    };
    Particle.prototype.draw = function(){
      var coordRand = rand(0,2);
      self.ctx.beginPath();
      self.ctx.moveTo(Math.round(this.coordLast[coordRand].x), Math.round(this.coordLast[coordRand].y));
      self.ctx.lineTo(Math.round(this.x), Math.round(this.y));
      self.ctx.closePath();
      self.ctx.strokeStyle = 'hsla('+this.hue+',100%,'+this.brightness+'%,'+this.alpha+')';
      self.ctx.stroke();
    };
    self.createParticles = function(x,y,hue){
      for(var i=0;i<self.partCount;i++){ self.particles.push(new Particle(x,y,hue)); }
    };
    self.updateParticles = function() {
      for(var i=self.particles.length-1;i>=0;i--){ self.particles[i].update(i); }
    };
    var Firework = function(startX,startY,targetX,targetY, hue){
      this.x=startX; this.y=startY;
      this.startX=startX; this.startY=startY;
      this.hitX=false; this.hitY=false;
      this.coordLast=[{x:startX,y:startY},{x:startX,y:startY},{x:startX,y:startY}];
      this.targetX=targetX; this.targetY=targetY;
      this.speed=self.fworkSpeed;
      this.angle=Math.atan2(targetY-startY,targetX-startX);
      this.acceleration=self.fworkAccel/100;
      this.hue=self.currentHue;
      this.hue = hue;
      this.brightness=rand(50,80);
      this.alpha=rand(50,100)/100;
      this.lineWidth=self.lineWidth;
    };
    Firework.prototype.update=function(index){
      var vx=Math.cos(this.angle)*this.speed;
      var vy=Math.sin(this.angle)*this.speed;
      this.speed*=(1+this.acceleration);
      this.coordLast[2]=this.coordLast[1];
      this.coordLast[1]=this.coordLast[0];
      this.coordLast[0]={x:this.x,y:this.y};
      if(this.startX>=this.targetX){ this.x+vx<=this.targetX?this.hitX=true:this.x+=vx*self.dt; }
      else { this.x+vx>=this.targetX?this.hitX=true:this.x+=vx*self.dt; }
      if(this.startY>=this.targetY){ this.y+vy<=this.targetY?this.hitY=true:this.y+=vy*self.dt; }
      else { this.y+vy>=this.targetY?this.hitY=true:this.y+=vy*self.dt; }
      if(this.hitX&&this.hitY){ self.createParticles(this.targetX,this.targetY,this.hue); self.fireworks.splice(index,1);}
    };
    Firework.prototype.draw=function(){
      var coordRand = rand(0,2);
      self.ctx.beginPath();
      self.ctx.moveTo(Math.round(this.coordLast[coordRand].x), Math.round(this.coordLast[coordRand].y));
      self.ctx.lineTo(Math.round(this.x), Math.round(this.y));
      self.ctx.closePath();
      self.ctx.strokeStyle='hsla('+this.hue+',100%,'+this.brightness+'%,'+this.alpha+')';
      self.ctx.stroke();
    };
    self.createFireworks=function(startX,startY,targetX,targetY){
          var hue = rand(self.hueMin, self.hueMax);
        self.fireworks.push(new Firework(startX, startY, targetX, targetY, hue));
        };
    self.updateFireworks=function(){ for(var i=self.fireworks.length-1;i>=0;i--){ self.fireworks[i].update(i); } };
    self.drawFireworks=function(){ for(var i=self.fireworks.length-1;i>=0;i--){ self.fireworks[i].draw(); } };
    self.bindEvents=function(){
      window.addEventListener('resize',function(){
        self.canvas.width = window.innerWidth;
        self.canvas.height = window.innerHeight;
      });
      document.addEventListener('click',function(e){
        self.currentHue=rand(self.hueMin,self.hueMax);
        self.createFireworks(self.canvas.width/2,self.canvas.height,e.clientX,e.clientY);
      });
    };

    self.updateDelta=function(){
      var newTime=Date.now();
      self.dt=(newTime-self.oldTime)/16;
      self.dt=self.dt>5?5:self.dt;
      self.oldTime=newTime;
    };
    self.canvasLoop = function(){
      self.updateDelta();
      self.ctx.globalCompositeOperation='destination-out';
      self.ctx.fillStyle='rgba(0,0,0,'+self.clearAlpha/100+')';
      self.ctx.fillRect(0,0,self.canvas.width,self.canvas.height);
      self.ctx.globalCompositeOperation='lighter';
      self.updateFireworks();
      self.updateParticles();
      self.drawFireworks();
      for(var i=self.particles.length-1;i>=0;i--){ self.particles[i].draw(); }
    };
    self.init();
  };
  var fworks = new Fireworks();
});
