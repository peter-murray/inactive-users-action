const expect = require('chai').expect
  , util = require('./dateUtil')
;

describe('util', () => {

  describe('getFromDate()', () => {

    it('should process a date', () => {
      const date = new Date()
        , expectedDate = getDateWithZeroedTime(date).toISOString()
      ;
      expect(util.getFromDate(date)).to.equal(expectedDate)
    });

    it('should fail if no date provided', () => {
      let failed = false;

      try {
        util.getFromDate();
      } catch (err) {
        failed = true;
      }

      if (!failed) {
        expect.fail('Should have failed when getting date');
      }
    })
  });

  describe('convertDaysToDate()', () => {

    function getTime(daysOffset) {
      const offset = (24 * 60 * 60 * 1000) * daysOffset
        , targetTime = getDateWithZeroedTime()
      ;
      return targetTime.getTime() - offset;
    }

    function testDays(daysOffset) {
      const expectedIsoDate = new Date(getTime(daysOffset)).toISOString();
      expect(util.convertDaysToDate(daysOffset)).to.equal(expectedIsoDate);
    }

    it('should get xx days from now', () => {
      testDays(30);
      testDays(31);
      testDays(60);
      testDays(90);
    });
  });
});

function getDateWithZeroedTime(date) {
  if (date) {
    return resetTime(new Date(date));
  }
  return resetTime(new Date());
}

function resetTime(date) {
  date.setMilliseconds(0);
  date.setSeconds(0);
  date.setMinutes(0);
  date.setHours(0);

  return date;
}