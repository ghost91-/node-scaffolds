import { ChalkLogger, Level } from '@guanghechen/chalk-logger'
import { createLoggerMock } from '@guanghechen/helper-jest'
import fs from 'fs-extra'
import { desensitize, locateFixtures } from 'jest.helper'
import path from 'path'
import {
  absoluteOfWorkspace,
  ensureCriticalFilepathExistsSync,
  isDirectorySync,
  isFileSync,
  isNonExistentOrEmpty,
  mkdirsIfNotExists,
  relativeOfWorkspace,
} from '../src'

describe('absoluteOfWorkspace', function () {
  test('null / undefined', function () {
    expect(absoluteOfWorkspace(__dirname, null)).toEqual(__dirname)
    expect(absoluteOfWorkspace(__dirname, undefined)).toEqual(__dirname)
    expect(absoluteOfWorkspace(__dirname)).toEqual(__dirname)
  })

  test('basic', function () {
    expect(desensitize(absoluteOfWorkspace(__dirname, 'a/b/c.txt'))).toEqual(
      '<$WORKSPACE$>/packages/helper-path/__test__/a/b/c.txt',
    )
    expect(desensitize(absoluteOfWorkspace(__dirname, '/a/b/c.txt'))).toEqual('/a/b/c.txt')
    expect(desensitize(absoluteOfWorkspace(__dirname, path.join(__dirname, '/a/b/c.txt')))).toEqual(
      '<$WORKSPACE$>/packages/helper-path/__test__/a/b/c.txt',
    )
  })
})

describe('relativeOfWorkspace', function () {
  test('basic', function () {
    expect(desensitize(relativeOfWorkspace(__dirname, path.join(__dirname, 'a/b/c.txt')))).toEqual(
      'a/b/c.txt',
    )
    expect(
      desensitize(relativeOfWorkspace(__dirname, path.join(__dirname, '../a/b/c.txt'))),
    ).toEqual('../a/b/c.txt')
    expect(desensitize(relativeOfWorkspace(__dirname, path.join(__dirname, '../..')))).toEqual(
      '../..',
    )
  })
})

describe('isFileSync', function () {
  test('truthy', function () {
    expect(isFileSync(locateFixtures('basic/config.yml'))).toBe(true)
  })

  test('falsy', function () {
    expect(isFileSync(locateFixtures('basic/config.yml-non-exist'))).toBe(false)
    expect(isFileSync(locateFixtures('basic'))).toBe(false)
    expect(isFileSync(null)).toBe(false)
    expect(isFileSync(undefined as any)).toBe(false)
  })
})

describe('isDirectorySync', function () {
  test('truthy', function () {
    expect(isDirectorySync(locateFixtures('basic'))).toBe(true)
  })

  test('falsy', function () {
    expect(isDirectorySync(locateFixtures('basic/config.yml'))).toBe(false)
    expect(isDirectorySync(locateFixtures('basic-non-exist'))).toBe(false)
    expect(isDirectorySync(null)).toBe(false)
    expect(isDirectorySync(undefined as any)).toBe(false)
  })
})

describe('isNonExistentOrEmpty', function () {
  test('truthy', function () {
    expect(isNonExistentOrEmpty(locateFixtures('basic-non-exist'))).toBe(true)
    expect(isNonExistentOrEmpty(locateFixtures('basic/config.yml-non-exist'))).toBe(true)
  })

  test('falsy', function () {
    expect(isNonExistentOrEmpty(locateFixtures('basic'))).toBe(false)
    expect(isNonExistentOrEmpty(locateFixtures('basic/config.yml'))).toBe(false)
    expect(isNonExistentOrEmpty(null)).toBe(false)
    expect(isNonExistentOrEmpty(undefined as any)).toBe(false)
  })
})

describe('mkdirsIfNotExists', function () {
  test('directory existed', function () {
    const dirpath = locateFixtures('basic')
    expect(fs.existsSync(dirpath)).toBe(true)
    mkdirsIfNotExists(dirpath, true)
    expect(fs.existsSync(dirpath)).toBe(true)
  })

  test('filepath', function () {
    const dirpath = locateFixtures('basic/config.yml')
    expect(fs.existsSync(dirpath)).toBe(true)
    mkdirsIfNotExists(dirpath, false)
    expect(fs.existsSync(dirpath)).toBe(true)
  })

  test('mkdirs', function () {
    const dirpath = locateFixtures('basic--non-existed')
    expect(fs.existsSync(dirpath)).toBe(false)
    mkdirsIfNotExists(dirpath, true)
    expect(fs.existsSync(dirpath)).toBe(true)
    fs.rmdirSync(dirpath)
  })

  test('mkdirs logger', function () {
    const logger = new ChalkLogger({
      level: Level.VERBOSE,
      flags: {
        colorful: false,
      },
    })
    const loggerMock = createLoggerMock({ logger, desensitize })

    const dirpath = locateFixtures('basic--non-existed--2')
    expect(fs.existsSync(dirpath)).toBe(false)
    mkdirsIfNotExists(dirpath, true, logger)
    expect(fs.existsSync(dirpath)).toBe(true)
    fs.rmdirSync(dirpath)

    expect(loggerMock.getIndiscriminateAll()).toMatchSnapshot()
    loggerMock.restore()
  })
})

describe('ensureCriticalFilepathExistsSync', function () {
  test('null / undefined', function () {
    expect(() => void ensureCriticalFilepathExistsSync(null)).toThrow(
      'Invariant failed: Invalid path: null.',
    )
  })

  test('not found', function () {
    expect(
      () =>
        void ensureCriticalFilepathExistsSync(locateFixtures('basic/config.json-non-existed---22')),
    ).toThrow('Invariant failed: Not found:')
  })

  test('not a file', function () {
    expect(() => void ensureCriticalFilepathExistsSync(locateFixtures('basic/'))).toThrow(
      'Invariant failed: Not a file:',
    )
  })

  test('valid', function () {
    expect(
      () => void ensureCriticalFilepathExistsSync(locateFixtures('basic/config.yml')),
    ).not.toThrow()
  })
})
