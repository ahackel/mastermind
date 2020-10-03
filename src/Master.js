"use strict";

var MAX_NUMBER = localStorage['MAX_NUMBER'] || 6,
	NUM_DIGITS = localStorage['NUM_DIGITS'] || 4,
	ALLOW_DOUBLES = (localStorage['ALLOW_DOUBLES'] == "1") ? true : false,
	COLORS = ['blue', 'red', 'brown', 'orange', 'green', 'pink', 'lightblue', 'lightgreen'];

function randomInt(maxValue){
	return Math.floor(Math.random() * maxValue);
}

function randomItem(a){
	if (a.length > 0)
		return a[Math.floor(Math.random() * a.length)];
	else
		return null;
}

(function($){
	$.fn.scrollButton = function() {
		
		var that = this,
			threshold = 3,
			doc = $('body'),
			lastMousePos;

		function getLastPos(e){
			if (e.type == "touchstart")
				lastMousePos  = { x: e.originalEvent.touches[0].pageX, y: e.originalEvent.touches[0].pageY };
			else
				lastMousePos = { x: e.pageX, y: e.pageY };		
		}

		this.on('mousedown touchstart', function(e){
			if ($(this).hasClass('disabled')) return;
			getLastPos(e);
			threshold = $(this).height() / 2;
			doc.on('mouseup mouseleave', mouseUp);
			doc.on('mousemove touchmove', mouseMove);			
		});

		function mouseUp(e){
			doc.off('mouseup mouseleave', mouseUp);
			doc.off('mousemove touchmove', mouseMove);			
			lastMousePos = null;
			console.log('off');		
		}

		function mouseMove(e){
			if ($(that).hasClass('disabled')) return;
			if (!lastMousePos) return;
			
			var delta = e.clientY - lastMousePos.y;
			if (Math.abs(delta) > threshold) {
				$(that).trigger("scroll", delta);
				getLastPos(e);
			}
		}

		return this;
	};

	$.fn.menuButton = function() {

		var that = this,
			menu,
			codes = [],
			touchedElement;

		this.on('mousedown touchstart', function(e){
			if (e.type == "touchstart")
				console.log('touchstart');

			if (that.hasClass('disabled')) return;
			createMenu();
			$(document).on('touchmove', touchMove);
			$(document).on('mouseup mouseleave touchend touchcancel', destroyMenu);
			e.preventDefault();
		});


		function createMenu(){
			menu = $('<div class="menu"></div>');
			codes = [];

			for (var i = 1; i <= MAX_NUMBER; i++){
				var code = $('<div class="code">' + i + '</div>')
					.css('background', COLORS[i - 1])
					.on('mouseenter touchmove', i, mouseEnter);
				menu.append(code);
				codes.push(code);
			}

			that.parent().append(menu);
		}

		function destroyMenu(){
			if (!menu) return;
			menu.remove();
			menu = null;
			$(document).off('touchmove', touchMove);
		}

		function mouseEnter(e){
			that.trigger('set_value', e.data);
		}

		function touchMove(e){
			var x = e.originalEvent.touches[0].pageX;
			var y = e.originalEvent.touches[0].pageY;
			var el = document.elementFromPoint(x, y);
			if (el != touchedElement){
				touchedElement = el;
				for (var i = 0; i < codes.length; i++){
					if (codes[i][0] == el){
						that.trigger('set_value', i + 1);
						//console.log('trigger', i+1);
					}
				}
			}
			e.preventDefault();
		}

		return this;
	}

}(jQuery));



var master = function(){};


	master.init = function(){
		this.parent = $('#lines');
		this.reset();
		var that = this;


		$('#reset').click($.proxy(this.reset, this));
		$('#hint').click($.proxy(this.hint, this));
		$('#settings').click(function(){
			$('#settings-menu').show();
		});

		$('#about').click(function(){
			$('#about-menu').show();
		});

		$('#code-length').click(function(){
			NUM_DIGITS = 9 - NUM_DIGITS;
			$('#code-length').text("Code Length: " + NUM_DIGITS);
			that.reset();
		}).text("Code Length: " + NUM_DIGITS);

		$('#num-colors').click(function(){
			MAX_NUMBER += 1;
			if (MAX_NUMBER > 8)
				MAX_NUMBER = 5;
			$('#num-colors').text("Colors: " + MAX_NUMBER);
			that.reset();
		}).text("Colors: " + MAX_NUMBER);

		$('#allow-doubles').click(function(){
			ALLOW_DOUBLES = !ALLOW_DOUBLES;
			$('#allow-doubles').text("Allow Doubles: " + ((ALLOW_DOUBLES) ? 'Yes' : 'No'));
			that.reset();
		}).text("Allow Doubles: " + ((ALLOW_DOUBLES) ? 'Yes' : 'No'));

		$('.back').click(function(){
			$('#about-menu').hide();
			$('#settings-menu').hide();
		});
	}

	master.reset = function(){
		this.spacer = $('<div class="spacer"></div>');
		this.parent.empty()
			.append(this.spacer);
		this.currentGuess = this.getNullCode();
		this.guesses = [];
		this.answers = [];
		this.possibleCodes = this.getAllPossibleCodes();		

		this.code = this.getRandomCode();
		this.currentLine = null;
		this.displayPlayerCode();

		localStorage['MAX_NUMBER'] = MAX_NUMBER;
		localStorage['NUM_DIGITS'] = NUM_DIGITS;
		localStorage['ALLOW_DOUBLES'] = (ALLOW_DOUBLES) ? 1 : 0;
	}

	master.getNullCode = function(){
		var code = [];
		for (var i = 0; i < NUM_DIGITS; i++){
			code.push(1);
		}
		return code;
	}

	master.getRandomCode = function(){
		var allowedDigits = [],
			code = [];

		for (var i = 1; i <= MAX_NUMBER; i++)
			allowedDigits.push(i);


		for (var i = 0; i < NUM_DIGITS; i++){
			var index = randomInt(allowedDigits.length);
			code.push(allowedDigits[index]);
			if (!ALLOW_DOUBLES)
				allowedDigits.splice(index, 1);
		}
		return code;
	}

	master.getAllPossibleCodes = function(){
		var possibleCodes = [];
		var numCodes = Math.pow(MAX_NUMBER, NUM_DIGITS);

		var _code = [],
			pos = 0;

		for (var i = 1; i <= NUM_DIGITS; i++)
			_code.push(i);
		
		for (var i = 0; i < numCodes; i++){
			possibleCodes.push(_code.slice(0));
			
			pos = 0;
			_code[pos]++;
			while (_code[pos] > MAX_NUMBER) {
				_code[pos] = 1;
				pos++;
				if (pos > NUM_DIGITS - 1)
					pos = 0;
				_code[pos]++;
			}
		}
		return possibleCodes;
	}

	master.solve = function (code){
		this.code = code.split('').map(Number);

		this.guesses = [];
		this.answers = [];
		this.possibleCodes = this.getAllPossibleCodes();		

		for (var n = 0; n < 20; n++){


			var guessedCode = this.guess();

			console.log(this.possibleCodes.length, 'possible Codes');

			var answer = this.compareCodes(this.code, guessedCode);

			this.guesses.push(guessedCode);
			this.answers.push(answer);


			console.log('Guess #' + (n+1), guessedCode, answer);
			this.displayCode(guessedCode);
			this.displayAnswer(answer);			
			if (answer[0] == 5) break;
		}
	}

	master.guess = function(){
		this.eliminateWrongGuesses();

		var i = randomInt(this.possibleCodes.length),
			guessedCode = this.possibleCodes[i];

		this.possibleCodes.splice(i, 1);

		return guessedCode;
	}

	master.eliminateGuess = function(code){
		var index = -1,
			that = this;

		this.possibleCodes.some(function(v, i){
			if (that.isEqualCode(code, v)) {
				index = i;
				return true;
			}
			return false;
		})
		
		if (index > -1)
			this.possibleCodes.splice(index, 1);
	}


	master.eliminateWrongGuesses = function(){
		if (this.guesses.length == 0) return;
		var curGuess = this.guesses[this.guesses.length - 1],
			curAnswer = this.answers[this.guesses.length - 1];
		
		for (var i = 0; i < this.possibleCodes.length; i++){
			var answer = this.compareCodes(this.possibleCodes[i], curGuess);
			if (answer[0] != curAnswer[0] || answer[1] != curAnswer[1]) {
				this.possibleCodes.splice(i, 1);
				i--;
			}
		}
	}

	master.isEqualCode = function(code1, code2){
		var l = code1.length;
		for (var i = 0; i < l; i++){
			if (code1[i] != code2[i])
				return false;
		}
		return true;
	}

	master.compareCodes = function(code1, code2){
		//guessedCode = guessedCode.split('').map(Number);
		if (code2 == null)
			code2 = this.code;

		var l = code1.length,
			correctPos = 0,
			correctNumber = 0,
			checkedNumbers = [];

		// Check if number AND positions are correct:
		for (var n=0; n < l; n++){
			if (code1[n] == code2[n]) {
				correctPos++;
				checkedNumbers[n] = true;
			}
		}

		// Check if only numbers are correct:
		for (var n=0; n < l; n++){
			if (code1[n] != code2[n]) {
				for (var m=0; m < l; m++){
					if (!checkedNumbers[m] && code1[m] == code2[n]) {
						correctNumber++;
						checkedNumbers[m] = true;
						break;
					}
				}
			}
		}

		return [correctPos, correctNumber];
	}

	master.displayCode = function(code){
		code.forEach(function(v){
			this.parent.append('<div class="code code' + v + '"></div>');
		});
	}

	master.displayAnswer = function(answer, line){
		for (var i = 0; i < NUM_DIGITS; i++){
			var _class = '';
			if (i < answer[0])
				_class = 'correctPos';
			else if (i < answer[0] + answer[1])
				_class = 'correctColor';

			line.append('<div class="answer ' + _class + '"></div>');
		}
	}

	master.displayPlayerCode = function(){
		var that = this;

		var line = $('<div class="line"></div>');
		this.currentLine = line;

		for (var i = 0; i < NUM_DIGITS; i++){

			var digit = $('<div class="code"></div>')
				.css('background', COLORS[that.currentGuess[i] - 1])
				.menuButton()
				.on('set_value', i, function(e, value){
					that.currentGuess[e.data] = value;

					$(this).css('background', COLORS[value - 1])
						.text(value);
				})
				.text(this.currentGuess[i]);
			line.append(digit);
		}

		var solved = $('<div class="button inline">SOLVED</div>')
			.on('click', function(e){
				that.reset();
			})
			.hide();
		line.append(solved);

		var button = $('<div class="button inline">DONE</div>')
			.on('click', function(e){

				// don't let user do nothing:
				if (that.guesses.length > 0 &&
					that.compareCodes(that.currentGuess, that.guesses[that.guesses.length - 1])[0] == NUM_DIGITS)
					return;

				button.hide();
				line.children().addClass('disabled');
				
				that.guesses.push(that.currentGuess.slice(0));

				var answer = that.compareCodes(that.currentGuess);
				that.answers.push(answer);


				
				if (answer[0] == NUM_DIGITS){
					solved.show();
				}
				else {
					// current guess is wrong, remove it from possible guesses:
					that.eliminateGuess(that.currentGuess);
					
					line.addClass('done');
					that.displayAnswer(answer, line);
					that.displayPlayerCode();
				}

				// update possible guesses for hint feature:
				that.eliminateWrongGuesses();
			});
		line.append(button);

		this.parent.prepend(line);
	}

	master.hint = function(){
		var that = this,
			i = randomInt(this.possibleCodes.length),
			elements = this.currentLine.children();

		this.currentGuess = this.possibleCodes[i];


		for (var n = 0; n < this.currentGuess.length; n++){
			var code = this.currentGuess[n];
			$(elements[n]).css('background', COLORS[code - 1])
				.text(code);
			}
	}


function adjustSize(){
	var portrait = window.innerWidth < window.innerHeight;
	var nx = window.innerWidth / 10;
	var ny = window.innerHeight / 10;
	var n = (portrait) ? nx : ny;
	var size = Math.min(80, Math.floor(n));
	$('html').css('font-size', size);
	window.scrollTo(0, 0);
}


$(document).ready(function() {
	FastClick.attach(document.body);
	adjustSize();

	//document.ontouchmove = function(e){ e.preventDefault(); };
	master.init();
	$(window).on('resize', adjustSize);
});
