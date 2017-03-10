/*
wageCounter-application
(c) Petteri Spiikki Sillanpää / 2017 / spiikki@nalleperhe.net
*/

function initializeWageCounter() {

	// check the browser
	if (window.File && window.FileReader && window.FileList && window.Blob) {

		// setup variables
		var hourLog = {};

		// add listener to file-chooser
		$('input[name=sourceFile]').change(parseFile);

	} else {
		$('section[name=application]').html('This application doesn\'t work with your browser. Sorry =(');
	}

}

function parseFile(event) {
	console.log(event.target.files[0]);

	var reader = new FileReader();

	reader.onload = function(event) {
		//console.log(event.target.result);

		var data = $.csv.toObjects(event.target.result);

		console.log(data);


	};

	reader.readAsText(event.target.files[0]);


}