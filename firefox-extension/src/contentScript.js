// Global DOM elements
// We cache them once, and avoid them being queried multiple times
const daysLogged = document.getElementsByClassName("ds-form-calendar__column-time");
const allDays = document.getElementsByClassName("ds-form-calendar__column--day-number");
const daily_goal = document.getElementsByClassName("ds-daily-goal-card__doughnut-label")[0].innerHTML.split("/")[1].replace("min","").replace('<span class="ds-daily-goal-card__doughnut-congrats">Congrats! 🎉🎉 <br> Goal reached today!<', "");

//Update the DS results page with a progress card
//background setup
function progressCardCreate() {
  const activityCardArray = document.getElementsByClassName("ds-your-activity-card__block");
  const activityCard = activityCardArray[0]; //this is the one we want to modify
  let progressCard = activityCard.appendChild(document.createElement("div"));
  progressCard.className = "ds-mini-card ds-mini-card--secondary card";

  let progressCardBody = progressCard.appendChild(document.createElement("div"));
  progressCardBody.className = "ds-mini-card__body card-body";

  let progressCardHeader = progressCardBody.appendChild(document.createElement("div"));
  progressCardHeader.className = "ds-mini-card__header";

  let progressCardTitle = progressCardHeader.appendChild(document.createElement("div"));
  progressCardTitle.className = "ds-mini-card__header-title";

  let progressCardIcon = progressCardTitle.appendChild(document.createElement("img"));
  progressCardIcon.className = "ds-mini-card__header-icon";
  progressCardIcon.src = 'https://raw.githubusercontent.com/spruce04/Dreaming-Spanish-Toolkit/main/chrome-extension/images/statsIcon.png';

  let progressHeaderText = progressCardTitle.appendChild(document.createElement("span"));
  progressHeaderText.textContent = "Monthly Stats";

  let progressCardUpdate = progressCardHeader.appendChild(document.createElement("button"));
  progressCardUpdate.classList.add("ds-mini-card__header-value", "refreshStats");
  progressCardUpdate.textContent = "Reload";

  let progressCardContentBox = progressCardBody.appendChild(document.createElement("div"));
  progressCardContentBox.className = "ds-mini-card__content";

  let progressCardText = progressCardContentBox.appendChild(document.createElement("p"));
  progressCardText.className = "ds-mini-card__content-description";

  let progressCardTextTotal = progressCardText.appendChild(document.createElement("p"));
  progressCardTextTotal.className = "statText";

  let progresscardTextAverage = progressCardText.appendChild(document.createElement("p"));
  progresscardTextAverage.className = "statText";

  const stats = monthlyOverview_formatted();
  progressCardTextTotal.textContent = stats.total;
  progresscardTextAverage.textContent = stats.average;

  //refresh button
  progressCardUpdate.addEventListener("click", () => {
    const stats = monthlyOverview_formatted();
    progressCardTextTotal.textContent = stats.total;
    progresscardTextAverage.textContent = stats.average;
  }) 
}

// Listen for messages from other parts of the extension
browser.runtime.onMessage.addListener((message, sender) => {
  console.log(message);
  if ('display' in message || 'reload' in message) {
      if(message['progressPage'] === true) {
        progressCardCreate()
        showMinutes()
        showMonthlyDeficitCard()
      }
      if (message.display === "dark" || message.reload === "dark") {
          document.body.classList.remove('lightMode');
          document.body.classList.add('darkMode');
      } else {
          document.body.classList.remove('darkMode');
          document.body.classList.add('lightMode');
      }
  }
});

// Send messages from the content script
function send(message) {
  browser.runtime.sendMessage(message);
}

//code to get monthly stats
function total_watched_minutes() {
  //loop through all the days and sum the total amount of time
  let watched = 0;
  for (let i = 0; i < daysLogged.length; i++) {
      watched += parseInt(daysLogged[i].textContent.slice(0, daysLogged[i].textContent.length - 1)); //cut out the 'm'
  };

  return watched
}

function monthlyOverview_formatted() {
  //loop through all the days and sum the total amount of time
  let watched = total_watched_minutes()

  //Turn the minutes only into hours and minutes to find the total time
  let hourCount = parseInt(watched / 60);
  let minuteCount = watched - 60 * hourCount;

  //Find the daily average
  let average;
  let avgHours;
  let avgMins;

  //Check if we are looking in the current month and year
  let dreamingCalendar = document.getElementsByClassName("ds-form-calendar__nav");
  let timeArray = dreamingCalendar[0].textContent.replaceAll(' ', '').split("-");
  const timeObject = new Date();
  const year = timeObject.getFullYear();
  const month = timeObject.toLocaleString('default', {month: 'long'});
  if (month == timeArray[0] && year == timeArray[1]) {//if we are in the current month adjust the average accordingly
    const date = timeObject.getDate();
    average = watched / date;
    avgHours = parseInt(average / 60);
    avgMins = (average - 60 * avgHours).toFixed(1);
  }
  else {
    average = watched / (allDays.length);
    avgHours = parseInt(average / 60);
    avgMins = (average - 60 * avgHours).toFixed(1);
  }

  return {total: `Total watched this month: ${hourCount} hour(s) and ${minuteCount} minute(s).`, average: `Average time each day: ${avgHours} hour(s) and ${avgMins} minute(s).`} 
}


function showMinutes() {
  let bar = document.getElementsByClassName("progress-bar")[1]
  let val = bar.getAttribute("aria-valuenow")
  
  let minute_display = document.getElementsByClassName("ds-overall-progression-card__info-label--bold")[1]
  let tot_hours = document.getElementsByClassName("ds-overall-progression-card__info-label--sm")[1].innerHTML.replace(" hrs", "")

  let hours_float = parseFloat(val) / 100 * parseInt(tot_hours)
  console.log(tot_hours)
  minute_display.innerHTML = minute_display.innerHTML + " " + parseInt((hours_float - parseInt(hours_float)) * 60) + " min"
}

function showMonthlyDeficitCard (){
  const timeObject = new Date();
  today = timeObject.getDate()
  const days_this_month = new Date(timeObject.getFullYear(), timeObject.getMonth(), 0).getDate()

  const goal_adjusted_for_today = daily_goal * today
  const monthly_goal = daily_goal * days_this_month

  const deficit = goal_adjusted_for_today - total_watched_minutes()

  let new_card_container = document.createElement("div")
  new_card_container.classList.add("ds-deficit-card")

  new_card_container.innerHTML = `\
  <div class='ds-card card'>\
    <div class='ds-card__header ds-card__header--no-border card-header' style='padding: 2rem 2rem 0;'>\
      <div class='ds-card__title card-title h5'>Monthly Deficit</div>\
    </div>\
    <div class='ds-card__body card-body'>\
      <div class='ds-card__content' style='padding: 2rem;'>\
        <div class='ds-deficit-bar' style='width: 100%; height: 30px; position: relative; border-radius: 10px; margin-bottom: 1rem;'>\
          <div class='ds-deficit-background' style='position: absolute; background-color: #eef2f6; width:100%; height: 30px; border-radius: 10px;'></div>\
          <div class='ds-deficit-foreground' style='position: absolute; background-color: #6354b1; width:${goal_adjusted_for_today/monthly_goal*100}%; height: 30px; border-radius: 10px;'></div>\
          <div class='ds-deficit' style='position: absolute; background-color: rgb(255, 121, 112); left: ${((goal_adjusted_for_today/monthly_goal)-(deficit/monthly_goal))*100}%; width:${deficit/monthly_goal*100}%; height: 30px; border-radius: 10px;'></div>\
        </div>\
        <div>\
          Behind ${parseInt(deficit/60)} hrs and ${deficit % 60} min for this months goal!
        </div>
      </div>\
    </div>\
  </div>\
  `
  console.log(daily_goal)
  console.log(((goal_adjusted_for_today/monthly_goal)-(deficit/monthly_goal))*100)

  let progress_column = document.getElementsByClassName("ds-progress-page__column")[0]
  progress_column.insertBefore(new_card_container, progress_column.children[1])
}