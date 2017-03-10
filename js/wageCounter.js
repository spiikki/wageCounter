/*
wageCounter-application
(c) Petteri Spiikki Sillanpää / 2017 / spiikki@nalleperhe.net
*/

function initializeWageCounter() {

	// check the browser
	if (window.File && window.FileReader && window.FileList && window.Blob) {

		// add listener to file-chooser
		$('input[name=sourceFile]').change(parseFile);

	} else {

		// browser does not support FileReader, clear page and apologise.
		$('section[name=application]').html('This application doesn\'t work with your browser. Sorry =(');

	}

}

function parseFile(event) {

	// create FileReader
	var reader = new FileReader();

	// handle loaded data
	reader.onload = function(event) {

		// parse data to objects
		var data = $.csv.toObjects(event.target.result);

		// parse data to renderable log, (and store it in session)
		log = parseLog(data);

		// send to renderer
		renderLog(log);

	};

	// read the file
	reader.readAsText(event.target.files[0]);

}

function parseLog(data) {

	/*
	workLog = {
		userID : {
			username : "string",
			log : {
				date : {
					hours: float,
					evening_extra: float,
					overtime_extra: float
				}
			}
		}
	}
	*/
	var workLog = {};

	// check all data rows
	$(data).each(function(index, row) {
		console.log(row);
		if(workLog[row["Person ID"]] === undefined) {
			workLog[row["Person ID"]] = { username: row["Person Name"], log: {} };
		}

		if(workLog[row["Person ID"]].log[row["Date"]] === undefined) {
			workLog[row["Person ID"]].log[row["Date"]] = { hours: 0.0, evening_extra: 0.0, overtime_extra: 0.0 };
		} 

		// count hours on row
		var startHour = parseFloat(row["Start"].split(':')[0]);
		var endHour = parseFloat(row["End"].split(':')[0]);
		var startMinutes = parseFloat(row["Start"].split(':')[1]);
		var endMinutes = parseFloat(row["End"].split(':')[1]);

		var totalHours = endHour - startHour;

		// fix over midnight step
		if(totalHours < 0) {
			totalHours += 24;
		}

		// how this works
		// if you START later than full hour, it decreases worktime
		// if you END later than full hour, it increases worktime
		var minutesFix = -(startMinutes/60)+(endMinutes/60);

		// apply minutesFix
		totalHours += minutesFix;

		workLog[row["Person ID"]].log[row["Date"]].hours += totalHours;
	});

	return workLog;

}

function renderLog(log) {
	console.log(log);
}