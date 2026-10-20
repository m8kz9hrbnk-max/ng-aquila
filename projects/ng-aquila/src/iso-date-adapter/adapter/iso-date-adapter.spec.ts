import 'dayjs/locale/de.js';

import { NxDateAdapter } from '@allianz/ng-aquila/datefield';
import { inject, TestBed, waitForAsync } from '@angular/core/testing';
import dayjs from 'dayjs';
import localeData from 'dayjs/plugin/localeData.js';

import { NxIsoDateAdapter } from './iso-date-adapter';
import { NxIsoDateModule } from './iso-date-adapter.module';

dayjs.extend(localeData);

describe('NxIsoDateAdapter', () => {
  let adapter: NxIsoDateAdapter;

  function assertValidDate(date: string | null, valid: boolean): void {
    expect(adapter.isDateInstance(date)).not.toBeNull();
    expect(adapter.isValid(date as string)).toBe(valid);
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [NxIsoDateModule],
    }).compileComponents();
  }));

  beforeEach(inject([NxDateAdapter], (dateAdapter: NxIsoDateAdapter) => {
    adapter = dateAdapter;
  }));

  describe('Localization', () => {
    beforeEach(async () => {
      await adapter.setLocale('de');
    });

    it('should parse locale date with explicit format', () => {
      const date = adapter.parse('01.12.2020', 'MM.DD.YYYY', true);
      expect(date).toBe('2020-01-12');
    });

    it('should parse locale date with locale format (L)', () => {
      const isoDate = adapter.parse('03.01.2020', 'L', true);
      expect(isoDate).toMatch('2020-01-03');
    });

    it('should parse locale date with locale expanded format (LL)', () => {
      const isoDate = adapter.parse('24. September 2020', 'LL', true);
      expect(isoDate).toMatch('2020-09-24');
    });
  });

  describe('Localization with locale id that is unknown to dayjs', () => {
    it('should automatically fall back to a locale that is known to dayjs', async () => {
      // 'de-BY' is unknown to dayjs (and the world). The IsoDateAdapter should fall back to 'de'.
      await adapter.setLocale('de-BY');
      const date = adapter.parse('01.12.2020', 'MM.DD.YYYY', true);
      expect(date).toBe('2020-01-12');
    });
  });

  describe('Localization with a different format between global day.js and the adapter', () => {
    beforeEach(async () => {
      await adapter.setLocale('de');
      dayjs.locale('en');
    });

    it('should parse locale date with locale format (L)', () => {
      const isoDate = adapter.parse('03.01.2020', 'L', true);
      expect(isoDate).toMatch('2020-01-03');
    });

    it('should parse locale date with locale expanded format (LL)', () => {
      const isoDate = adapter.parse('24. September 2020', 'LL', true);
      expect(isoDate).toMatch('2020-09-24');
    });
  });

  describe('Date values', () => {
    it('should format a date as ISO 8601', () => {
      expect(adapter.toIso8601('2017-01-02')).toBe('2017-01-02T00:00:00Z');
    });

    it('should clone a date value', () => {
      expect(adapter.clone('2017-01-02')).toBe('2017-01-02');
    });

    it('should get a year name', () => {
      expect(adapter.getYearName('2017-01-01')).toBe('2017');
    });

    it('should get the number of days in a month', () => {
      expect(adapter.getNumDaysInMonth('2017-01-15')).toBe(31);
      expect(adapter.getNumDaysInMonth('2017-02-01')).toBe(28);
      expect(adapter.getNumDaysInMonth('2016-02-01')).toBe(29);
      expect(adapter.getNumDaysInMonth('2017-04-01')).toBe(30);
    });

    it('should get the day of the week', () => {
      expect(adapter.getDayOfWeek('2017-01-01')).toBe(0);
    });

    it('should get the names of the days in a month', () => {
      const dateNames = adapter.getDateNames();

      expect(dateNames).toHaveLength(31);
      expect(dateNames[0]).toBe('1');
      expect(dateNames[30]).toBe('31');
    });

    it('should use English locale data by default and update it when the locale changes', async () => {
      expect(adapter.getFirstDayOfWeek()).toBe(0);
      await adapter.setLocale('de');
      expect(adapter.getFirstDayOfWeek()).toBe(1);
    });

    it('should use the global dayjs locale when no locale is provided', () => {
      expect(dayjs.locale()).toBe('en');
      const adapterWithoutLocale = new NxIsoDateAdapter(null);

      expect(adapterWithoutLocale.getMonthNames('long')[0]).toBe('January');
    });

    it('should get month names in English', () => {
      const longMonthNames = adapter.getMonthNames('long');
      const shortMonthNames = adapter.getMonthNames('short');
      const narrowMonthNames = adapter.getMonthNames('narrow');

      expect(longMonthNames).toHaveLength(12);
      expect(longMonthNames[0]).toBe('January');
      expect(longMonthNames[11]).toBe('December');
      expect(shortMonthNames).toHaveLength(12);
      expect(shortMonthNames[0]).toBe('Jan');
      expect(shortMonthNames[11]).toBe('Dec');
      // The base adapter docs describe narrow months as single letters; this returns the short names.
      expect(narrowMonthNames).toEqual([
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ]);
    });

    it('should get day of week names in English', () => {
      const longDayNames = adapter.getDayOfWeekNames('long');
      const shortDayNames = adapter.getDayOfWeekNames('short');
      const narrowDayNames = adapter.getDayOfWeekNames('narrow');

      expect(longDayNames).toEqual([
        'Sunday',
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
      ]);
      expect(shortDayNames).toEqual(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);
      expect(narrowDayNames).toEqual(['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']);
      expect(longDayNames).toHaveLength(7);
      expect(shortDayNames).toHaveLength(7);
      expect(narrowDayNames).toHaveLength(7);
    });

    it('should get German day of week names', async () => {
      await adapter.setLocale('de');

      expect(adapter.getDayOfWeekNames('long')).toHaveLength(7);
      expect(adapter.getDayOfWeekNames('long')[0]).toBe('Sonntag');
    });

    it('should return today as a local ISO date', () => {
      const today = adapter.today();
      const expectedDates = [dayjs().format('YYYY-MM-DD'), dayjs().format('YYYY-MM-DD')];

      expect(expectedDates).toContain(today);
      expect(adapter.isDateInstance(today)).toBe(true);
    });

    it('should add calendar days', () => {
      expect(adapter.addCalendarDays('2017-01-31', 1)).toBe('2017-02-01');
      expect(adapter.addCalendarDays('2017-01-01', -1)).toBe('2016-12-31');
    });

    it('should add calendar months and clamp to the end of the month', () => {
      expect(adapter.addCalendarMonths('2017-01-31', 1)).toBe('2017-02-28');
      expect(adapter.addCalendarMonths('2016-01-31', 1)).toBe('2016-02-29');
      expect(adapter.addCalendarMonths('2017-01-15', -1)).toBe('2016-12-15');
      expect(adapter.addCalendarMonths('2017-11-15', 2)).toBe('2018-01-15');
    });

    it('should add calendar years and clamp leap days', () => {
      expect(adapter.addCalendarYears('2016-02-29', 1)).toBe('2017-02-28');
      expect(adapter.addCalendarYears('2017-01-01', -2)).toBe('2015-01-01');
    });

    it('should create valid dates', () => {
      expect(adapter.createDate(2017, 0, 1)).toBe('2017-01-01');
      expect(adapter.createDate(2016, 1, 29)).toBe('2016-02-29');
    });

    it('should reject invalid months and dates', () => {
      expect(() => adapter.createDate(2017, -1, 1)).toThrowError(
        'Invalid month index "-1". Month index has to be between 0 and 11.',
      );
      expect(() => adapter.createDate(2017, 12, 1)).toThrowError(
        'Invalid month index "12". Month index has to be between 0 and 11.',
      );
      expect(() => adapter.createDate(2017, 0, 0)).toThrowError(
        'Invalid date "0". Date has to be greater than 0.',
      );
      expect(() => adapter.createDate(2017, 1, 29)).toThrowError(
        'Invalid date "29" for month with index "1".',
      );
      expect(() => adapter.createDate(2017, 3, 31)).toThrowError(
        'Invalid date "31" for month with index "3".',
      );
    });

    it('should identify ISO date strings', () => {
      expect(adapter.isDateInstance('')).toBe(true);
      expect(adapter.isDateInstance('2017-01-01')).toBe(true);
      expect(adapter.isDateInstance('20170101')).toBe(true);
      expect(adapter.isDateInstance('2017-13-01')).toBe(false);
      expect(adapter.isDateInstance('2017-0101')).toBe(false);
      expect(adapter.isDateInstance(new Date(2017, 0, 1))).toBe(false);
      expect(adapter.isDateInstance(null)).toBe(false);
    });

    it('should fall back to English formats when the selected locale is unavailable', async () => {
      expect(dayjs.Ls.fr).toBeUndefined();
      expect(dayjs.locale()).toBe('en');
      await adapter.setLocale('fr');
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

      expect(adapter.normalizeFormat('L')).toEqual(['MM/DD/YYYY']);
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining('The used locale "fr" is not available'),
      );
      expect(adapter.normalizeFormat(['L', 'YYYY'])).toEqual(['MM/DD/YYYY', 'YYYY']);
    });

    it('should deserialize a Date instance and reject other non-string values', () => {
      expect(adapter.deserialize(new Date(2017, 0, 2))).toBe('2017-01-02');
      expect(adapter.deserialize(123)).toBe('');
    });

    it('should return an empty date for non-string and empty parse values', () => {
      expect(adapter.parse(123, 'YYYY', false)).toBe('');
      expect(adapter.parse('', 'YYYY', false)).toBe('');
    });
  });

  it('should get year', () => {
    expect(adapter.getYear('2017-01-01')).toBe(2017);
  });

  it('should get month', () => {
    expect(adapter.getMonth('2017-01-01')).toBe(0);
  });

  it('should get date', () => {
    expect(adapter.getDate('2017-01-01')).toBe(1);
  });

  it('should create valid dates from valid ISO strings', () => {
    assertValidDate(adapter.deserialize('1985-04-12T23:20:50.52Z'), true);
    assertValidDate(adapter.deserialize('1996-12-19T16:39:57-08:00'), true);
    assertValidDate(adapter.deserialize('1937-01-01T12:00:27.87+00:20'), true);
    assertValidDate(adapter.deserialize('1990-13-31T23:59:00Z'), false);
    expect(adapter.deserialize('')).toBeNull();
    expect(adapter.deserialize(null)).toBeNull();
    assertValidDate(adapter.deserialize(new Date()), true);
    assertValidDate(adapter.deserialize(new Date(NaN)), false);
    assertValidDate(adapter.deserialize('2017-01-01'), true);
  });

  it('setLocale should not modify global moment locale', async () => {
    expect(dayjs.locale()).toBe('en');
    await adapter.setLocale('de');
    expect(dayjs.locale()).toBe('en');
  });

  it('should create invalid date', () => {
    assertValidDate(adapter.invalid(), false);
  });

  it('should parse invalid value as invalid', () => {
    const d = adapter.parse('hello', 'MM/DD/YYYY', false);
    expect(d).not.toBeNull();
    expect(adapter.isDateInstance(d)).toBe(true);
    expect(adapter.isValid(d)).toBe(false);
  });

  it('should allow non-strict parsing', () => {
    expect(adapter.parse('20190101', 'YYYY-MM-DD', false)).toBe('2019-01-01');
    expect(adapter.parse('20190101', ['YYYY-MM-DD', 'YYYY-MM-D', 'YYYY-M-D'], false)).toBe(
      '2019-01-01',
    );
    expect(adapter.parse('2019011', ['YYYY-MM-DD', 'YYYY-MM-D', 'YYYY-M-D'], false)).toBe(
      '2019-01-01',
    );
    expect(adapter.parse('201911', ['YYYY-MM-DD', 'YYYY-MM-D', 'YYYY-M'], false)).toBe(
      '2019-11-01',
    );
    expect(adapter.parse('20191', ['YYYY-MM-DD', 'YYYY-MM-D', 'YYYY-M'], false)).toBe('2019-01-01');
    expect(adapter.parse('201911', ['YYYY-M'], false)).toBe('2019-11-01');
    expect(adapter.parse('2019-11', ['YYYYM'], false)).toBe('2019-11-01');
    expect(adapter.parse('04.03.2019', ['DD.MM.YYYY', 'M-YYYY'], false)).toBe('2019-03-04');
    expect(adapter.parse('02032019', ['DD.MM.YYYY', 'M-YYYY'], false)).toBe('2019-03-02');
    expect(adapter.parse('102019', ['DD.MM.YYYY', 'M-YYYY'], false)).toBe('2019-10-01');
  });

  it('should allow strict parsing', () => {
    // year is mismatching
    assertValidDate(adapter.parse('03/01/18', 'MM/DD/YYYY', true), false);

    // month is missing second digit
    assertValidDate(adapter.parse('3/01/2018', 'MM/DD/YYYY', true), false);

    // month & day is missing second digit
    assertValidDate(adapter.parse('3/1/2018', 'MM/DD/YYYY', true), false);

    // month & day is missing second digit, year is missing two digits
    assertValidDate(adapter.parse('3/1/18', 'MM/DD/YYYY', true), false);

    // that's fine
    assertValidDate(adapter.parse('03/01/2018', 'MM/DD/YYYY', true), true);

    // wrong separator
    assertValidDate(adapter.parse('03/01/2018', 'MM-DD-YYYY', true), false);
    assertValidDate(adapter.parse('03-01-2018', 'MM-DD-YYYY', true), true);
  });

  it('should allow strict parsing with multiple patterns', () => {
    // allow slash and dash in strict mode
    assertValidDate(adapter.parse('03/01/2018', ['MM/DD/YYYY', 'MM-DD-YYYY'], true), true);
    assertValidDate(adapter.parse('03-01-2018', ['MM/DD/YYYY', 'MM-DD-YYYY'], true), true);
    assertValidDate(adapter.parse('03 01 2018', ['MM/DD/YYYY', 'MM-DD-YYYY'], true), false);
  });

  it('should format date according to given format', () => {
    expect(adapter.format('2017-01-02', 'MM/DD/YYYY')).toBe('01/02/2017');
    expect(adapter.format('2017-01-02', 'DD/MM/YYYY')).toBe('02/01/2017');
  });
});
