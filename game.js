const PVP = 0, PVAI = 1;

function Menu() {
	this.element = document.getElementById("menu");
	this.boardRenderer = new BoardRenderer(document.getElementById("mainCanva"));
	
	this.centerMenu();
	window.addEventListener("resize", this.centerMenu.bind(this));
	document.getElementById("startGame").addEventListener("click", this.beginGame.bind(this));
	window.addEventListener("GameOver", this.displayMenu.bind(this));
}

_p = Menu.prototype;

_p.centerMenu = function() {
	this.element.style.left = 
		(Math.max(document.documentElement.clientWidth, window.innerWidth || 0) - this.element.clientWidth) / 2 + "px";
	this.element.style.top = 
		(Math.max(document.documentElement.clientHeight, window.innerHeight || 0) - this.element.clientHeight) / 2 + "px";
}

_p.displayMenu = function(e) {
	this.element.style.display = "";
	
	var title = document.getElementById("title");
	
	title.innerText = e.detail.message + "\nchoose an option";
}

_p.beginGame = function() {
	var pvpRadio = document.getElementById("pvp");
	
	this.element.style.display = "none";
	this.boardRenderer.startGame(pvpRadio.checked? PVP : PVAI);
}

window.onload = function() {
	menu = new Menu();
}