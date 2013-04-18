// /-------------------------------------------------------------------\
// |                      globalvariables		                       |
// \-------------------------------------------------------------------/

var gobanSize = 19;

// /-------------------------------------------------------------------\
// |                        goban object		                       |
// \-------------------------------------------------------------------/

var Goban = {
	//Goban.size : return the size of the goban
	size:gobanSize,
	
	//Goban.playerTurn : boolean, false = black player, true = white player
	playerTurn: false,
		
	//Goban.board[][] : acces to the array with all the stones.
	board: new Array(),
	
	//Goban.verboseMode :  
	verboseMode : true,
		
	//Goban.history[] : acces to the history of the game, allow replays.
	history: new Array(),

	//Goban.hashHistory : history of all the moves
	hashHistory: new Array(),

	mapIndex: {
		"white" : 1,
		"black" : 0
	},

	//MOST INEFFICIENT IMPLEMENTATION
	//But detecting which stone has been removed is a pain with my implementation :(
	recalculateHash:function(){
		h = '0x0';
		for(x=0; x< this.size; x++){
			for(y=0; y<this.size; y++){
				index = this.mapIndex[this.board[x][y]];
				h = "0x" + (h ^ this.hash.randomArray[x*this.size+7][index]).toString(16)
			}
		}
		return h;
	},
	
	//Goban.addToHashHistory: rehash according on who played on position x,y and add new has to hashhistory
	addToHashHistory: function(){
		this.hash.currentHash = this.recalculateHash();
		this.hashHistory.push(this.hash.currentHash);
	},

	hash: new ZHash(gobanSize * gobanSize, 2),
		
	//Goban.init : initalization of Goban.board[][] and randomArray
	init: function() {
		for(var  i=0 ; i<this.size; i++){
        	var col = new Array();
        	for(var j=0 ; j<this.size; j++){
        		col.push(0);
        	}
        	this.board.push(col);
		}
	},
	
	//Goban.isKO() : vérifie si la pierre en x,y n'egendre pas de ko, return true si il y a Ko
	isKo: function() {
		return false;
	},
	
	//Goban.findAndReplace(find, replace) : parcours Goban.board[][] et modifie tout les x en color
	findAndReplace: function(find, replace) {
		if(this.verboseMode) console.log('findAndReplace: starting to find '+find+' and replace it by '+replace);
		for(var i = 0; i < this.size ; i++){
			for(var j=0; j < this.size; j++){
				if(this.board[i][j]==find){
					this.board[i][j]=replace;
					if(this.verboseMode) console.log('findAndReplace: '+i+','+j+' replaced by ' + replace );
      			}
      		}
      	}
	},
	
	//Goban.find(x) : parcours Goban.Board[][] et retourne vrai si un x a été trouvé
	find: function(x) {
		for(var i = 0; i < this.size ; i++){
			for(var j=0; j < this.size; j++){
				if(this.board[i][j]==x) return true;
      		}
      	}
      	return false;
	},
	
	//Goban.switchPlayer : Tell the Goban that its the other player turn. 
	switchPlayer: function() {
		this.playerTurn = !this.playerTurn;
	},
	
	//Goban.passTurn : Tell Goban the current player pass
	passTurn: function() {
		if(this.verboseMode){
			console.log('=================NEW LOGS=================');
			console.log('passTurn: player '+ this.getWhosTurn() + ' pass');
			console.log('------------------------------------------');
		}
		this.addToHistory('pass','pass');
		this.refreshStatus();
		this.switchPlayer();	
	},
	
	//Goban.checkEnd : Check if players pass
	checkEnd: function() {
		if(this.history[this.history.length-1][0] == this.history[this.history.length-2][0] == this.history[this.history.length-1][1] == this.history[this.history.length-2][1] == 'pass') return true;
		else return false;
	},
	
	//Goban.refreshStatus : refresh status
	refreshStatus: function() {
		$('#whosTurn').html(Goban.getWhosTurn());	
	},
	
	//Goban.getWhosTurn : return 'white' or 'black' depending on whos player is playing now
	getWhosTurn: function() {
		return this.playerTurn ? 'white' : 'black';
	},
	
	
	//Goban.addToHistory(x,y,color) : add the position and the color of a stone in the history.
	addToHistory: function(x,y,color) {
		var arr = [x,y,color];
		this.history.push(arr);
	},
	
	//Goban.addStone : add a stone on Goban.board
	addStone: function(x,y,color) {
		if(this.verboseMode) console.log('addStone: place stone on ' + x+','+y);
		if(color != undefined) this.board[x][y] = this.getWhosTurn();
		else this.board[x][y] = color;
	},
	
	//Goban.addStone : add a stone on Goban.board
	removeStone: function(x,y) {
		if(this.verboseMode) console.log('removeStone: remove stone on ' + x+','+y);
		this.board[x][y] = 0;
	},
	
	//Goban.kill : Tue les 'checked' et 'dead'.
	killTraces: function() {
		if(this.verboseMode) console.log('==kill: starting to kill dead stones');
		this.findAndReplace('checked',0);
		this.findAndReplace('dead',0);
		this.findAndReplace('waiting',0);
		if(this.verboseMode) console.log('--kill: killing DONE');
	},
		
	//Goban.resetTaces() : élimine les traces de Goban.checkLiberties
	resetTraces: function(color) {
		if(this.verboseMode) console.log('==resetTraces: starting to reset all traces of checkLiberties');
		if(color == undefined) color = this.getWhosTurn();
		this.findAndReplace('checked',color);
		this.findAndReplace('dead',color);
		this.findAndReplace('alive',color);
		this.findAndReplace('waiting',color);
		if(this.verboseMode) console.log('--resetTraces: DONE');
	},
		
	//Goban.isGroupAlive(x,y) : Check if the group of the stone x,y is alive
	isGroupAlive: function(x,y) {
		if(this.verboseMode) console.log('==isGroupAlive: started on '+x+','+y);
		var color = this.board[x][y];
		this.checkLiberties(x,y);
		if(this.find('alive')){
			if(this.verboseMode) console.log('isGroupAlive: group of '+x+','+y+' is alive.');
			this.resetTraces(color);
			if(this.verboseMode) console.log('--isGroupAlive: DONE');
			return true;
		}else{
			if(this.verboseMode) console.log('isGroupAlive: group of '+x+','+y+' is dead.');
			this.resetTraces(color);
			if(this.verboseMode) console.log('--isGroupAlive: DONE');
			return false;
		}
	},
	
	//Goabn.adjacentNumbersOf(x,y,thing) : return the number of allies of the stone on x y
	adjacentNumberOf: function(x,y,thing) {
		var count = 0;
		if(this.board[x][y-1] == thing)count++;
		if(this.board[x][y+1] == thing)count++;
		if(this.board[x+1] != undefined)
			if(this.board[x+1][y] == thing)count++;
		if(this.board[x-1] != undefined)
			if(this.board[x-1][y] == thing)count++;
		return count;
	},
		
	//Goban.isKiller(x,y) : retrun true is stone on x y kills something
	isKiller: function(x,y) {
		var allyColor = this.board[x][y];
		var enemyColor = (allyColor == 'black') ? 'white' : 'black';;
		var count = 0;
		if(this.board[x+1] != undefined && this.board[x+1][y] == enemyColor){
			this.checkLiberties(x+1,y);
			if(this.find('alive')){
				count++;
			}else{
				if(this.verboseMode) console.log('isKiller: the stone on ' + x + ',' + y + ' killed '+ (x+1) + ','+ y);
				this.killTraces();
			}
			this.resetTraces(enemyColor);
		}else count++;
		if(this.board[x-1] != undefined && this.board[x-1][y] == enemyColor){
			this.checkLiberties(x-1,y);
			if(this.find('alive')) {
				count++;
			}else{
				if(this.verboseMode) console.log('isKiller: the stone on ' + x + ',' + y + ' killed '+ (x-1) +',' +y);
				this.killTraces();
			}
			this.resetTraces(enemyColor);
		}else count++;
		if(this.board[x][y+1] != undefined && this.board[x][y+1] == enemyColor){
			this.checkLiberties(x,y+1);
			if(this.find('alive')) {
				count++;
			}else{
				if(this.verboseMode) console.log('isKiller: the stone on ' + x + ',' + y + ' killed '+ x +',' + (y+1));
				this.killTraces();
			}
			this.resetTraces(enemyColor);
		}else count++;
		if(this.board[x][y-1] != undefined && this.board[x][y-1] == enemyColor){
			this.checkLiberties(x,y-1);
			if(this.find('alive')){
				count++;
			}else{
				if(this.verboseMode) console.log('isKiller: the stone on ' + x + ',' + y + ' killed ' + x+ ',' + (y-1));
				this.killTraces();
			}
			this.resetTraces(enemyColor);
		}else count++;
		if(count == 4){
			if(this.verboseMode) console.log('the stone on ' + x + ',' + y + ' didn\'t kill anything');
			return false;
		}else{
			return true;
		}
	},
	
	//Goban.checkLibertiesOfEachEnnemyOf(x,y) : do as it says
	checkLibertiesOfEachEnnemyOf: function(x,y) {
		if(this.verboseMode) console.log('checkLibertiesOfEachEnnemyOf: started on ' +x+','+y);
		var allyColor = this.board[x][y];
		var enemyColor;
		enemyColor = (allyColor == 'black') ? 'white' : 'black';
		
		if(y!=0){
			if(this.board[x][y-1] == enemyColor){
				this.checkLiberties(x,y-1);
				if(!this.find('alive')){
					this.killTraces();
				}this.resetTraces(enemyColor);
			}else if(this.verboseMode) console.log('checkLibertiesOfEachEnnemyOf: failed on '+ x + ',' + (y-1) + ' reason: x,y-1 is not an enemy')
		}else if(this.verboseMode) console.log('checkLibertiesOfEachEnnemyOf: failed on '+ x + ',' + (y-1) + ' reason: y < 0');
		
		if(y!=18){
			if(this.board[x][y+1] == enemyColor){
				this.checkLiberties(x,y+1);
				if(!this.find('alive')){
					this.killTraces(enemyColor);
				}this.resetTraces(enemyColor);
			}else if(this.verboseMode) console.log('checkLibertiesOfEachEnnemyOf: failed on '+ x + ',' + (y+1) + ' reason: x,y+1 is not an enemy');
		}else if(this.verboseMode) console.log('checkLibertiesOfEachEnnemyOf: failed on '+ x + ',' + (y+1) + ' reason: y > 18');
		
		if(x!=18){
			if(this.board[x+1][y] == enemyColor){
				this.checkLiberties(x+1,y)
				if(!this.find('alive')){
					this.killTraces();
				}this.resetTraces(enemyColor);
			}else if(this.verboseMode) console.log('checkLibertiesOfEachEnnemyOf: failed on '+ (x+1) + ',' + y + ' reason: x+1,y is not an enemy');
		}else if(this.verboseMode) console.log('checkLibertiesOfEachEnnemyOf: failed on '+ (x+1) + ',' + y + ' reason: x > 18');
		
		if(x!=0){
			if(this.board[x-1][y] == enemyColor){
				this.checkLiberties(x-1,y);						
				if(!this.find('alive')){
					this.killTraces();
				}this.resetTraces(enemyColor);
			}else if(this.verboseMode) console.log('checkLibertiesOfEachEnnemyOf: failed on '+ (x-1) + ',' + y + ' reason: x-1,y is not an enemy');
		}else if(this.verboseMode) console.log('checkLibertiesOfEachEnnemyOf: failed on '+ (x-1) + ',' + y + ' reason: x < 0');
	},
	
	//Goban.playOn(x,y) : vérifie si la pierre peut être posée sur x y et pose la pierre ou annonce qu'elle n'est pas posable
	playOn: function(x,y) {
		if(!this.board[x] || this.board[x][y] != 0){
			document.getElementById('error').play();
			return;
		}
		if(this.verboseMode) console.log('=================NEW LOGS=================');
		this.addStone(x,y,this.getWhosTurn());
		if(this.verboseMode){console.log('stone number: '+ this.history.length);console.log('player: '+ this.getWhosTurn());}
		if(this.isGroupAlive(x,y)){
			this.checkLibertiesOfEachEnnemyOf(x,y);
			this.addToHistory(x,y);
			this.addToHashHistory();
			this.switchPlayer();
			this.reloadUI();
			randomToc();
			if(this.verboseMode) console.log('STONE PLACEMENT SUCCESSFUL!!!');
			if(this.verboseMode) console.log('------------------------------------------')
			return;
		}else if(!this.isKo()){
			if(this.isKiller(x,y)){
				this.addToHistory(x,y);
				this.addToHashHistory();
				this.switchPlayer();
				this.reloadUI();
				randomToc();
				if(this.verboseMode) console.log('STONE PLACEMENT SUCCESSFUL!!!');
				if(this.verboseMode) console.log('------------------------------------------');
				return ;
			}else{
				document.getElementById('error').play();
				alert('Illegal move: stone cannot suicide.')
				this.removeStone(x,y);
				if(this.verboseMode) console.log('STONE PLACEMENT FAIL!!! :(');
				if(this.verboseMode) console.log('------------------------------------------')
				this.reloadUI();
				return ;
			}
		}else{
			document.getElementById('error').play();
			alert('Illegal move: Ko.')
			this.removeStone(x,y);
			if(this.verboseMode) console.log('STONE PLACEMENT FAIL!!! :(');
			if(this.verboseMode) console.log('------------------------------------------')
			this.reloadUI();
			return ;
		}
	},

	//Goban.checkLiberties(x,y) : modify Goban.board[][] with 'checked', 'dead' and 'alive' for the
	//entire group x y
	checkLiberties : function(x,y) {
		if(this.verboseMode) console.log('checkLiberties: starting on '+x+','+y);
		var liberties = 0;
		var allyColor = this.board[x][y];
		var enemyColor;
		enemyColor = (allyColor == 'black') ? 'white' : 'black';
		
		if(this.adjacentNumberOf(x,y,liberties) > 0 ){
			this.board[x][y] = 'alive';
			if(this.verboseMode) console.log('checkLiberties: group is alive');
			if(this.verboseMode) console.log('checkLiberties: '+x+','+y+ ': DONE');
			return true;
		}else if(this.adjacentNumberOf(x,y,allyColor) == 0 && this.adjacentNumberOf(x,y,liberties) == 0){
			this.board[x][y] = 'dead';
		}else{
			this.board[x][y] = "checked";
			
			if(y!=0 && this.board[x][y-1] == allyColor){
				if(this.checkLiberties(x,y-1)){
					return true;
				}else{
					this.board[x][y-1]='waiting';
				}
			}if(this.verboseMode) console.log('checkLiberties: FAIL on '+x+','+(y-1)+ ' reason: y<0');
			
			if(y!=18 && this.board[x][y+1] == allyColor){
				if(this.checkLiberties(x,y+1)){
					return true;
				}else{
					this.board[x][y+1]='waiting';
				}
			}if(this.verboseMode) console.log('checkLiberties: FAIL on '+x+','+(y+1)+ ' reason: y>18');
			
			if(x!=18 && this.board[x+1][y] == allyColor){
				if(this.checkLiberties(x+1,y)){
					return true;
				}else{
					this.board[x+1][y]='waiting';
				}
			}if(this.verboseMode) console.log('checkLiberties: FAIL on '+(x+1)+','+y+ ' reason: x>18');
			
			if(x!=0 && this.board[x-1][y] == allyColor){
				if(this.checkLiberties(x-1,y)){
					return true;
				}else{
					this.board[x-1][y]='waiting';
				}
			}if(this.verboseMode) console.log('checkLiberties: FAIL on '+(x-1)+','+y+ ' reason: x<0');
		}
	},
	
	//Goban.reloadUI : redraw the whole board
	reloadUI: function() {
		if(this.verboseMode) console.log('UI reloaded');
 		ctx.clearRect(0,0,canvas.width,canvas.height);
		this.draw().background();
		for(var i = 0; i < this.size ; i++){
			for(var j=0; j < this.size; j++){
				this.draw().whatever(i,j,this.board[i][j]);
				if(i == this.history[this.history.length-1][0] && j == this.history[this.history.length-1][1]) this.draw().lastPoint(i,j);
			}
		}
	},

	//drawObject
	draw: function() {
		return {
			whatever: function(x,y,color) {
				switch(color){	
				case 0:
					break;
				case "white":
					this.coloredStone(x,y,'white');
					break;
				case "black":
					this.coloredStone(x,y,'#222');
					break;
				default:
					return;
				}
			},

			coloredStone: function(x,y,color) {
				ctx.save();
				ctx.beginPath();
				x *= (canvas.width/(Goban.size+1));
				y *= (canvas.height/(Goban.size+1));
				x += (canvas.width/(Goban.size+1));
				y += (canvas.height/(Goban.size+1))
				ctx.arc(x,y,14,0,2*Math.PI,false);
				ctx.fillStyle		= color;
				ctx.strokeStyle		= 'rgba(0,0,0,0)';
				ctx.shadowOffsetX	= 5;
				ctx.shadowOffsetY	= 5;
				ctx.shadowBlur	= 4;
				ctx.shadowColor	= 'rgba(0, 0, 0, 0.5)';
				ctx.fill();
				ctx.stroke();
				ctx.restore();
			},

			background: function() {

			    ctx.beginPath();
			    Goban.draw().stars();
			    ctx.strokeStyle='black';
				for (var i = 1; i < Goban.size+1; i++){
					ctx.moveTo(i*canvas.width/(Goban.size+1), canvas.height/(Goban.size+1));
					ctx.lineTo(i*canvas.width/(Goban.size+1), canvas.height-canvas.height/(Goban.size+1));
					ctx.moveTo(canvas.width/(Goban.size+1), i*canvas.height/(Goban.size+1));
					ctx.lineTo(canvas.width - canvas.width/(Goban.size+1), i*canvas.height/(Goban.size+1));
				};
				ctx.strokeRect(canvas.width/Goban.size,
						canvas.height/Goban.size,
						canvas.widht-canvas.width/Goban.size,
						canvas.height -canvas.height/Goban.size
					);
				ctx.lineWidth='1';
				ctx.stroke();
			},

			stars: function() {
				for(var i = 0; i < 3 ; i++){
					ctx.beginPath();
					ctx.fillStyle='black';
					ctx.arc(i*6*canvas.width/(Goban.size+1)+(4*canvas.width/(Goban.size+1)),4*canvas.width/(Goban.size+1),3,-Math.PI/2,3*Math.PI/2,false);
					ctx.arc(i*6*canvas.width/(Goban.size+1)+(4*canvas.width/(Goban.size+1)),10*canvas.width/(Goban.size+1),3,-Math.PI/2,3*Math.PI/2,false);
					ctx.arc(i*6*canvas.width/(Goban.size+1)+(4*canvas.width/(Goban.size+1)),16*canvas.width/(Goban.size+1),3,-Math.PI/2,3*Math.PI/2,false);
					ctx.fill();
					ctx.stroke();
				}
			},

			lastPoint: function(x,y) {
				ctx.save();
				ctx.beginPath();
				x *= (canvas.width/(Goban.size+1));
				y *= (canvas.height/(Goban.size+1));
				x += (canvas.width/(Goban.size+1));
				y += (canvas.height/(Goban.size+1));
				ctx.arc(x,y,3,0,2*Math.PI,false);
				ctx.fillStyle	= 'grey';
				ctx.strokeStyle = 'rgba(0,0,0,0)';
				ctx.fill();
				ctx.stroke();
				ctx.restore();
			},

			elipse: function(x,y,gr,sr, angle) {
				console.log('drawing elipse');
				angle = (angle == undefined) ? 0 : angle ;
				sr = (sr == undefined) ? 0 : sr ;
				var scale = sr/gr;
				ctx.save();
				ctx.translate(x,y);
				ctx.beginPath();
				ctx.rotate((Math.PI/180)*angle);
				ctx.scale(1,scale);
				ctx.arc(0,0,gr,0,Math.PI*2,false);
				ctx.stroke();
				ctx.fill();
				ctx.restore();
			}
		}
	}
}

/* 
 * Zobrist hash
 */

function ZHash(numberOfPositions, numberOfIndex){
	this.numberOfPositions = numberOfPositions;
	this.numberOfIndex = numberOfIndex;
	this.randomArray = new Array();
	this.currentHash = 0;

	for( i=0; i<numberOfPositions; i++){
		tempArray = new Array();
		for(k=0; k<numberOfIndex; k++){
			tempArray.push(randomBitString(4));
		}
		this.randomArray.push(tempArray);
	}
}

ZHash.prototype.refreshHash = function(position, index){
	this.currentHash = "0x" + (this.currentHash ^ this.randomArray[position][index]).toString(16);
	return this.currentHash;
}




//========================//
//general function
//========================//

function randomToc(){
	var sound = Math.floor(Math.random() *4);
	switch(sound){
		case 0:
		 document.getElementById("sound1").play();
		 document.getElementById("sound1").volume=0.3;
		 break;
		case 1:
		 document.getElementById('sound2').play();
		 document.getElementById("sound2").volume=0.3;
		 break;
		case 2:
		 document.getElementById('sound3').play();
		 document.getElementById("sound3").volume=0.3;
		 break;
		case 3:
		 document.getElementById('sound4').play();
		 document.getElementById("sound4").volume=0.3;
		 break;
		defaut:
		 document.getElementById("sound1").volume=0.3;
		 document.getElementById('sound1').play();
		 break;
	}
}

function randomBitString(l){
	var length = l;
	var characters = "abcdef0123456789";
	var bit = "0x";
	//lets say nobody will ever want to build a 109237628 long bitstring. also it's way over 32-bits
	for(j = 0; j< length; j++){
		bit += characters.charAt(Math.floor(Math.random() * characters.length));
	}
	return bit;
}