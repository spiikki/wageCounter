/*
wageCounter-application
(c) Petteri Spiikki Sillanpää / 2017 / spiikki@nalleperhe.net


*/

function initializeWageCounter() {
	// add listener to file-chooser
	$('input[name=sourceFile]').change(parseFile);
}

function parseFile(event) {
	console.log(event.target.files);
}