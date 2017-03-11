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

		// parse data to renderable log
		var log = parseLog(data);

		// calculate wages into log
		log = calculateWages(log);

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
			username : string,
			log : {
				date : {
					hours: float,
					evening_extra: float,
					overtime_extra: float,
					wage: float // daily wage
				}
			},
			wage: float // monthly wage
		}
	}
	*/

	// setup THE workLog
	var workLog = {};

	// go through all data rows
	$.each(data, function(index, row) {

		// check if there is user in log, if not, create it
		if(workLog[row["Person ID"]] === undefined) {
			workLog[row["Person ID"]] = { username: row["Person Name"], log: {}, wage: 0.0 };
		}

		// check if there is date in users log, if not, create it
		if(workLog[row["Person ID"]].log[row["Date"]] === undefined) {
			workLog[row["Person ID"]].log[row["Date"]] = { hours: 0.0, evening_extra: 0.0, overtime_extra: 0.0, wage: 0.0 };
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

function calculateWages(log) {

	// fetch values from settings
	var wages = {
		hourly : parseFloat($('input[name=wage_hourly').val()),
		evening : parseFloat($('input[name=wage_evening').val())
	};

	$.each(log, function(index, user) {

		$.each(user.log, function(index, logDate) {
			var basicWage = logDate.hours * wages.hourly;
			var evening = logDate.evening_extra * wages.evening;
			var overtime = calculateOvertimeBonus(logDate.overtime_extra, wages, 0.25);

			logDate.wage = basicWage + evening + overtime;

			// add to monthly wage
			user.wage += logDate.wage;
		});

	});

	return log;
}

// holy recursion, coderman!
function calculateOvertimeBonus(hours, wages, raise) {

	// don't let overtime compensation go over 100% of wage
	if(raise > 1) raise = 1.00;

	// if less than two hours to be calculated, count and return
	if( hours <= 2 ) {
		return hours * (wages.hourly * raise);
	} else {
		// otherwise count for two hours and iterate with higher compensation
		return 2*(wages.hourly * raise) + calculateOvertimeBonus(hours-2, wages, raise*2);
	}

}

function renderLog(log) {

	// i will round up wages for rendering
	// this seems to be a JS nightmare
	// http://stackoverflow.com/questions/11832914/round-to-at-most-2-decimal-places

	
	// setup html to be injected to DOM
	var html = "";

	// let's do that looping users thing again!
	$.each(log, function(index, user) {

		html += '<div class="user">';
		html += '<h3>'+user.username+'</h3>';
		html += '<h4> Monthly wage: $' + user.wage.toFixed(2) + '</h4>';

		html += '<a href="#" name="toggleDetails">Toggle details</a>';

		html += '<div class="details" style="display: none">';
		// render details
		$.each(user.log, function(index, logDate) {
			html += '<h5>'+index+'</h5>';
			html += '<p>';
			html += 'Hours: ' + logDate.hours + '<br />';			
			html += 'Evening hours: ' + logDate.evening_extra + '<br />';			
			html += 'Overtime hours: ' + logDate.overtime_extra + '<br />';			
			html += 'Daily wage: $' + logDate.wage.toFixed(2) + '<br />';			
			html += '</p>';
		});
		html += '</div>';

		html += '</div>';

	});

	// inject results!
	$('section[name=results]').html(html);

	// handle toggling visibility of details
	$('a[name=toggleDetails]').click(function(event) {
		if($(event.target).next().css('display') === 'none') {
			$(event.target).next().css('display','block');
		} else {
			$(event.target).next().css('display','none');
		}
	});
	

}