import 'dayjs/locale/de.js';

import { NxDateAdapter } from '@allianz/ng-aquila/datefield';
import { inject, TestBed, waitForAsync } from '@angular/core/testing';
import dayjs from 'dayjs';
import localeData from 'dayjs/plugin/localeData.js';
import { vi } from 'vitest';

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

  it('should serialize dates as ISO 8601 strings', () => {
    expect(adapter.toIso8601('2017-01-02')).toBe('2017-01-02T00:00:00Z');
  });

  it('should clone dates and get year names', () => {
    expect(adapter.clone('2017-01-02')).toBe('2017-01-02');
    expect(adapter.getYearName('2017-01-01')).toBe('2017');
  });

  it('should get the number of days in each month', () => {
    expect(adapter.getNumDaysInMonth('2017-01-15')).toBe(31);
    expect(adapter.getNumDaysInMonth('2017-02-01')).toBe(28);
    expect(adapter.getNumDaysInMonth('2020-02-01')).toBe(29);
  });

  it('should get date names', () => {
    expect(adapter.getDateNames()).toEqual(
      Array.from({ length: 31 }, (_, index) => String(index + 1)),
    );
  });

  it('should get the day of the week', () => {
    expect(adapter.getDayOfWeek('2017-01-01')).toBe(0);
    expect(adapter.getDayOfWeek('2017-01-02')).toBe(1);
  });

  it('should get the first day of the week for the current locale', async () => {
    expect(adapter.getFirstDayOfWeek()).toBe(0);

    await adapter.setLocale('de');

    expect(adapter.getFirstDayOfWeek()).toBe(1);
  });

  it('should get long month names', () => {
    expect(adapter.getMonthNames('long')).toEqual([
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ]);
  });

  it('should get short month names', () => {
    expect(adapter.getMonthNames('short')).toEqual([
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

  it('should get day-of-week names in long, short, and narrow styles', () => {
    expect(adapter.getDayOfWeekNames('long')).toEqual([
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ]);
    expect(adapter.getDayOfWeekNames('short')).toEqual([
      'Sun',
      'Mon',
      'Tue',
      'Wed',
      'Thu',
      'Fri',
      'Sat',
    ]);
    expect(adapter.getDayOfWeekNames('narrow')).toEqual(['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']);
  });

  it('should add calendar days, months, and years', () => {
    expect(adapter.addCalendarDays('2017-12-31', 1)).toBe('2018-01-01');
    expect(adapter.addCalendarDays('2017-01-01', -1)).toBe('2016-12-31');
    expect(adapter.addCalendarMonths('2017-01-31', 1)).toBe('2017-02-28');
    expect(adapter.addCalendarMonths('2017-01-15', -1)).toBe('2016-12-15');
    expect(adapter.addCalendarYears('2020-02-29', 1)).toBe('2021-02-28');
    expect(adapter.addCalendarYears('2017-06-15', -2)).toBe('2015-06-15');
  });

  it('should get today and recognize it as a date instance', () => {
    const today = adapter.today();

    expect(today).toBe(dayjs().format('YYYY-MM-DD'));
    expect(adapter.isDateInstance(today)).toBe(true);
  });

  it('should create dates and reject invalid month and day values', () => {
    expect(adapter.createDate(2017, 0, 1)).toBe('2017-01-01');
    expect(adapter.createDate(2020, 1, 29)).toBe('2020-02-29');
    expect(() => adapter.createDate(2017, -1, 1)).toThrowError(
      'Invalid month index "-1". Month index has to be between 0 and 11.',
    );
    expect(() => adapter.createDate(2017, 12, 1)).toThrowError(
      'Invalid month index "12". Month index has to be between 0 and 11.',
    );
    expect(() => adapter.createDate(2017, 0, 0)).toThrowError(
      'Invalid date "0". Date has to be greater than 0.',
    );
    expect(() => adapter.createDate(2017, 1, 31)).toThrowError(
      'Invalid date "31" for month with index "1".',
    );
  });

  it('should recognize valid ISO date strings as date instances', () => {
    expect(adapter.isDateInstance('')).toBe(true);
    expect(adapter.isDateInstance('2017-01-01')).toBe(true);
    expect(adapter.isDateInstance('20170101')).toBe(true);
    expect(adapter.isDateInstance('2017-0101')).toBe(false);
    expect(adapter.isDateInstance('2017-13-01')).toBe(false);
    expect(adapter.isDateInstance('2017-01-32')).toBe(false);
    expect(adapter.isDateInstance('foo')).toBe(false);
    expect(adapter.isDateInstance(null)).toBe(false);
    expect(adapter.isDateInstance(undefined)).toBe(false);
    expect(adapter.isDateInstance(20170101)).toBe(false);
    expect(adapter.isDateInstance(new Date())).toBe(false);
  });

  it('should normalize localized formats and warn when the locale is unavailable', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    await adapter.setLocale('fr');

    expect(adapter.normalizeFormat('L')).toEqual(['MM/DD/YYYY']);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('The used locale "fr" is not available'),
    );
  });

  it('should normalize localized formats without warning for the default locale', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    expect(adapter.normalizeFormat(['L', 'YYYY-MM-DD'])).toEqual(['MM/DD/YYYY', 'YYYY-MM-DD']);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('should return an empty string for falsy or non-string values in both parsing modes', () => {
    for (const strict of [true, false]) {
      expect(adapter.parse(null, 'YYYYMMDD', strict)).toBe('');
      expect(adapter.parse('', 'YYYYMMDD', strict)).toBe('');
      expect(adapter.parse(20170101, 'YYYYMMDD', strict)).toBe('');
    }
  });

  it('should deserialize unsupported values as invalid dates', () => {
    expect(adapter.deserialize(123)).toBe('');
  });

  it('should use the global dayjs locale when constructed without a locale', () => {
    try {
      dayjs.locale('de');
      const localeAdapter = new NxIsoDateAdapter(null);

      expect(localeAdapter.getMonthNames('long')[0]).toBe('Januar');
      expect(localeAdapter.getFirstDayOfWeek()).toBe(1);
    } finally {
      dayjs.locale('en');
    }
  });
});
