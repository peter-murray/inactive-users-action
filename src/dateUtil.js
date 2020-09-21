const DAY_IN_MS = 24 * 60 * 60 * 1000;

module.exports = {

  getFromDate: (since) => {
    return getISODate(since)
  },

  convertDaysToDate: (days) => {
    if (days > 0) {
      const offset = DAY_IN_MS * days;
      return getISODate(Date.now() - offset);
    } else {
      throw new Error(`Invalid number of days; ${days}, must be greater than zero`);
    }
  }
}

function getISODate(value) {
  if (!value) {
    throw new Error('A date value must be provided');
  }

  const date = new Date(value);
  clearTime(date);
  return date.toISOString();
}

function clearTime(date) {
  date.setHours(0);
  date.setMinutes(0);
  date.setSeconds(0);
  date.setMilliseconds(0);
}