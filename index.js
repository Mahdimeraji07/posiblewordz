'use-strict';

const	EL_WORD_LENGTH_INPUT_ID = 'word-length-input',
		EL_CHARS_WRAPPER_ID = 'word-chars-wrapper',
		EL_OPTIONS_WRAPPER_ID = 'options-wrapper',
		EL_OPTION_QUERY = 'input[type="checkbox"]',
		EL_CHAR_INPUT_QUERY = 'input[type="text"]',
		EL_GENERATE_BUTTON_ID = 'generateButton',
		EL_SAVE_BUTTON_ID = 'saveButton',
		EL_POSSIBILITIES_WRAPPER_ID = 'possibilities-wrapper',
		UPDATE_NAME_LENGTH = 'update_length',
		UPDATE_NAME_OPTIONS = 'update_options',
		UPDATE_NAME_CHARS = 'update_chars',
		OPTION_NAME_LOWER_LATIN = 'lower-latin-chars',
		OPTION_NAME_UPPER_LATIN = 'upper-latin-chars',
		OPTION_NAME_LATIN_NUMBERS = 'latin-numbers-chars',
		OPTION_NAME_PERSIAN_NUMBERS = 'persian-numbers-chars',
		OPTION_NAME_PERSIAN_CHARS = 'persian-chars',
		OPTION_NAME_SPECIAL_CHARS = 'special-chars';
		OPTION_NAME_DUPLICATE_CHARS = 'duplicate-chars';
		OPTION_NAME_FIXED_WORD_LENGTH = 'fixed-word-length';

let	possibilitiesCount = 0;

(function setupElementsBinding ({ updateHandler } = {}) {

	let	wordLength,
		options = {},
		values = [],
		isProcessingState = false;

	function dispatchUpdate() {
		if (typeof updateHandler === 'function') {
			updateHandler.apply(this, arguments);
		}
	}

	(function wordLengthElementBinding (element, eventListener) {
		element.addEventListener('click', eventListener);
		element.addEventListener('change', eventListener);
		element.addEventListener('keyup', eventListener);
		eventListener.call(element);
	})(
		document.getElementById(EL_WORD_LENGTH_INPUT_ID),
		function eventListener () {
			let charInputEls = '';

			wordLength = Math.min(this.value || 1, 99);

			for (let i = 0; i < wordLength; i++) {
				charInputEls += `<input
					type="text"
					placeholder="?"
					maxlength="1"
					value="${ values[i] || '' }"
					style="
						max-width: 17px;
						max-height:17px;
						margin: 3px;
					">`;
			}

			document
				.getElementById(EL_CHARS_WRAPPER_ID)
				.innerHTML = charInputEls;

			bindCharsInputElements();

			dispatchUpdate(UPDATE_NAME_LENGTH, { values, options, wordLength });
		}
	);

	(function optionsElementBinding (wrapperElement, eventListener) {
		[].forEach.call(
			wrapperElement.querySelectorAll(EL_OPTION_QUERY),
			function (checkbox) {
				checkbox.addEventListener('change', eventListener);
				eventListener.call(checkbox);
			});
	})(
		document.getElementById(EL_OPTIONS_WRAPPER_ID),
		function eventListener() {
			options[this.dataset.option] = this.checked;

			dispatchUpdate(UPDATE_NAME_OPTIONS, { values, options, wordLength });
		}
	);

	function bindCharsInputElements() {
		(function charsInputElementBinding (wrapperElement, eventListener) {
			[].forEach.call(
				wrapperElement.querySelectorAll(EL_CHAR_INPUT_QUERY),
				function (charInput, index) {
					charInput.addEventListener('change', eventListener(index));
					charInput.addEventListener('keyup', eventListener(index));
					eventListener(index).call(charInput);
				});
		})(
			document.getElementById(EL_CHARS_WRAPPER_ID),
			function eventListenerWrapper(index) {
				return function eventListener () {
					values[index] = this.value;

					dispatchUpdate(UPDATE_NAME_CHARS, { values, options, wordLength });
				}
			}
		);
	}
	bindCharsInputElements();

	let generateButton;
	(generateButton = 
			document
			.getElementById(EL_GENERATE_BUTTON_ID))
	.addEventListener('click',
		function eventListener() {
			if (possibilitiesCount < 1 || (possibilitiesCount > 100000 &&
							!confirm('Possibilities is more than 100k items,\n' +
								'it may take a long time or make your browser unresponsive!\n' +
								'Are you sure you want to continue?'))) {
				return;
			}

			const	specialCharsRange = [	' ' , '~', '!', '.', ',', ';', ':', '`', '\'', '"',
										'+', '-', '@', '#', '$', '%', '^', '&', '*', '(',
										'{', '[', '<', '>', ']', '}', ')'],

					persianCharsRange = [	'ض', 'ص', 'ث', 'ق', 'ف', 'غ', 'ع', 'ه', 'خ', 'ح', 'ج',
											'چ', 'ش', 'س', 'ی', 'ب', 'ل', 'ا', 'ت', 'ن', 'م', 'ک',
											'گ', 'ظ', 'ط', 'ز', 'ر', 'ذ', 'د', 'پ', 'و', 'آ', 'ئ', 'ژ'];

			let	chars = [],
				possibilitiesItemsStr = '';

			options[OPTION_NAME_LOWER_LATIN] && chars.push.apply(chars, getRangeOfChars('a', 'z'));
			options[OPTION_NAME_UPPER_LATIN] && chars.push.apply(chars, getRangeOfChars('A', 'Z'));
			options[OPTION_NAME_LATIN_NUMBERS] && chars.push.apply(chars, getRangeOfChars('0', '9'));
			options[OPTION_NAME_PERSIAN_NUMBERS] && chars.push.apply(chars, getRangeOfChars('۰', '۹'));
			options[OPTION_NAME_SPECIAL_CHARS] && chars.push.apply(chars, specialCharsRange);
			options[OPTION_NAME_PERSIAN_CHARS] && chars.push.apply(chars, persianCharsRange);

			let oldGenerateButtonText = generateButton.value;
			let time = new Date();
			let performanceStartTime = performance.now();
			generateButton.disabled = isProcessingState = true;
			generateButton.value =
				`Processing (started at ${ time.getHours() }:${ time.getMinutes() }:${ time.getSeconds() })...`;

			setTimeout(function () {

				let possibilities = generatePossibleWords({
					chars,
					values,
					length: wordLength,
					fixedWordLength: options[OPTION_NAME_FIXED_WORD_LENGTH],
					duplicateChars: options[OPTION_NAME_DUPLICATE_CHARS]
				});

				let processingSeconds = (performance.now() - performanceStartTime) / 1000;

				possibilitiesItemsStr +=
					`(${ possibilities.length } items in ${ processingSeconds } seconds)<br /><br />`;

				possibilities.forEach(possibility =>
					possibilitiesItemsStr += possibility + '<br />'
				);

				document
				.getElementById(EL_POSSIBILITIES_WRAPPER_ID)
				.innerHTML = possibilitiesItemsStr;

				generateButton.disabled = isProcessingState = false;
				generateButton.value = oldGenerateButtonText;

			}, 50);

	});

	document
	.getElementById(EL_SAVE_BUTTON_ID)
	.addEventListener('click',
		function saveToFile() {
			let content = document
				.getElementById(EL_POSSIBILITIES_WRAPPER_ID)
				.innerHTML;

			content = content.replace(/(\<br\>|\<br\/\>|\<br \/\>)/g, '\n');

			if (content.length < 5) {
				return;
			};

			let filename = 'possibleWords.txt',
				type = 'text/plain';

			content =
			'#################################################\n' +
			'# Produced by Possible Wordz                    #\n' +
			'# https://mahdimeraji07.github.io/possiblewordz #\n' +
			'#################################################\n\n' + content;

			let file = new Blob([ content ], { type });

			let a = document.createElement('a'),
				url = URL.createObjectURL(file);
			a.href = url;
			a.download = filename;
			document.body.appendChild(a);
			a.click();
			setTimeout(function () {
				document.body.removeChild(a);
				window.URL.revokeObjectURL(url);  
			}, 0);
	});

})({
	updateHandler (event, payload) {

		let charsCount =  0;

		payload.options[OPTION_NAME_LOWER_LATIN] && (charsCount += 26);
		payload.options[OPTION_NAME_UPPER_LATIN] && (charsCount += 26);
		payload.options[OPTION_NAME_LATIN_NUMBERS] && (charsCount += 10);
		payload.options[OPTION_NAME_PERSIAN_NUMBERS] && (charsCount += 10);
		payload.options[OPTION_NAME_PERSIAN_CHARS] && (charsCount += 34);
		payload.options[OPTION_NAME_SPECIAL_CHARS] && (charsCount += 27);

		possibilitiesCount = Math.pow(charsCount, payload.wordLength - payload.values.join('').length);

		document
		.getElementById(EL_GENERATE_BUTTON_ID)
		.value = `Gen (~${ possibilitiesCount } possibilities)`;
	}
});

function getRangeOfChars (start, stop) {
	let result = [];

	for (let	idx = start.charCodeAt(0),
				end = stop.charCodeAt(0); idx <= end; ++ idx) {
		result.push(String.fromCharCode(idx));
	}

	return result;
};

function generatePossibleWords({
	chars = [],
	length = 0,
	values = [],
	fixedWordLength = true,
	duplicateChars = true
}) {	
	return (function recursive ({ length, values }) {
		let possibilities = [];

		if (values[0]) {
			if (length < 2) {
				return [ values[0] ];
			}

			return recursive({
				length: length - 1,
				values: [].concat(values).splice(1)
			}).map(possibility =>
				possibility.length + 1 === length &&
				(duplicateChars || !possibility.includes(values[0])) ? values[0] + possibility : ''
			)
		}

		if (!fixedWordLength && length > 1) {
			possibilities = recursive({
				length: length - 1,
				values
			});
		}

		chars.forEach(char => {
			if (length < 2) {
				possibilities.push(char);
			} else {
				possibilities = possibilities.concat(
					recursive({
						length: length - 1,
						values: [].concat(values).splice(1)
					}).map(possibility =>
						possibility.length + 1 === length &&
						(duplicateChars || !possibility.includes(char)) ? char + possibility : ''
					)
				);
			}
		});

		return possibilities;

	})({ length, values })
	.filter(item => item !== '');
}
