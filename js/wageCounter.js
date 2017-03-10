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

		// parse data to renderable log, and store it in session
		var log = parseLog(data);
		sessionStorage.worklog = JSON.stringify(log);

		// send to renderer
		renderLog(log);

	};

	// read the file
	reader.readAsText(event.target.files[0]);

}

function parseLog(data) {

	/*
	Here is workLog format. Will be used and may be abused.

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

	// setup THE workLog
	var workLog = {};

	// go through all data rows
	$.each(data, function(index, row) {

		// check if there is user in log, if not, create it
		if(workLog[row["Person ID"]] === undefined) {
			workLog[row["Person ID"]] = { username: row["Person Name"], log: {} };
		}

		// check if there is date in log, if not, create it
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

		// calculate minutesFix
		// if you START later than full hour, it decreases worktime
		// if you END later than full hour, it increases worktime
		var minutesFix = -(startMinutes/60)+(endMinutes/60);

		// apply minutesFix
		totalHours += minutesFix;

		// update hours
		workLog[row["Person ID"]].log[row["Date"]].hours += totalHours;


		// calculate evening work hours
		// this looks like a hack, but it's better than trusting javascript dates.
		var evening_extra = 0.0;

		if(startHour > 6 && startHour < 18) {
			// shift start in day
			if(endHour > 18) {
				// shift end in evening night
				evening_extra = endHour - 18 + (endMinutes/60); 
			} else if(endHour < 6) {
				// shift end in evening morning
				evening_extra = 6 + endHour + (endMinutes/60); 
			}
		} else {
			// shift start in evening
			if(endHour > 6 && endHour < 18) {
				// shift end in day
				if(startHour > 18) {
					// start before midnight
					evening_extra = 24 - startHour + 6 - (startMinutes/60);
				} else {
					evening_extra = 6 - startHour - (startMinutes/60);
				}
			} else {
				// shift end in evening
				if(startHour > 18) {
					// start before midnight
					if(endHour > 18) {
						// end before midnight
						evening_extra = endHour - startHour + minutesFix;
					} else {
						// end after midnight
						evening_extra = 24 - startHour + endHour + minutesFix;
					}
				} else {
					// start after midnight
					evening_extra = endHour - startHour + minutesFix;
				}
			}
		}

		// update evening_hours
		workLog[row["Person ID"]].log[row["Date"]].evening_extra += evening_extra;

	});

	// next, when data parsed, parse overtime hours
	$.each(workLog, function(index, user) {

		$.each(user.log, function(index, logDate) {

			if(logDate.hours > 8) {
				logDate.overtime_extra = logDate.hours-8;
			}

		});

	});

	// all done! return parsed workLog
	return workLog;

}

function renderLog(log) {
	console.log(log);
}