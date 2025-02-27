import { isSymbol } from '@guanghechen/helper-is'
import {
  composeStringDesensitizers,
  createFilepathDesensitizer,
  createJsonDesensitizer,
  createPackageVersionDesensitizer,
} from '../src'

describe('createFilepathDesensitizer', function () {
  test('*nix', function () {
    const desensitize = createFilepathDesensitizer('/a/b/c')
    expect(desensitize('sfe /a/b/c/d')).toEqual('sfe <WORKSPACE>/d')
    expect(desensitize('sfe /a\\b/c/d')).toEqual('sfe <WORKSPACE>/d')
  })

  test('windows', function () {
    const desensitize = createFilepathDesensitizer('C:\\a\\b\\c')
    expect(desensitize('sfe C:\\a\\b\\c\\d')).toEqual('sfe <WORKSPACE>\\d')
  })
})

describe('createPackageVersionDesensitizer', function () {
  test('basic', function () {
    const desensitize = createPackageVersionDesensitizer(
      () => '1.0.0-alpha',
      packageName => /^@guanghechen\/test/.test(packageName),
    )

    expect(desensitize(`"@guanghechen/test-waw": "^0.1.0"`)).toEqual(
      `"@guanghechen/test-waw": "^1.0.0-alpha"`,
    )
    expect(desensitize(`"@guanghechen/test-waw": "0.1.0"`)).toEqual(
      `"@guanghechen/test-waw": "1.0.0-alpha"`,
    )
    expect(desensitize(`"@guanghechen/waw": "^0.1.0"`)).toEqual(`"@guanghechen/waw": "^0.1.0"`)
  })
})

describe('composeStringDesensitizers', function () {
  test('basic', function () {
    const desensitize = composeStringDesensitizers(
      text => text.replace(/(?<=^|\b)alpha(?=\b|$)/gi, 'α'),
      text => text.replace(/(?<=^|\b)beta(?=\b|$)/gi, 'β'),
    )

    expect(desensitize('alphabeta')).toEqual('alphabeta')
    expect(desensitize('alpha beta')).toEqual('α β')
    expect(desensitize('beta beta alpha beta alpha')).toEqual('β β α β α')
  })
})

describe('createJsonDesensitizer', function () {
  test('basic', function () {
    const desensitize = createJsonDesensitizer(
      {
        string: text => text.replace(/(?<=^|\b)alpha(?=\b|$)/gi, 'α'),
        number: value => Math.abs(value),
        fallback: value => null,
      },
      text => '$' + text,
    )

    expect(
      desensitize({
        name: 'alpha and beta',
        age: -20,
        gender: Symbol('female'),
        favorites: ['apple', 'cat', 'alpha', 'beta'],
      }),
    ).toEqual({
      $name: 'α and beta',
      $age: 20,
      $gender: null,
      $favorites: ['apple', 'cat', 'α', 'beta'],
    })
  })

  test('default', function () {
    const desensitize = createJsonDesensitizer()
    const gender = Symbol('female')
    expect(
      desensitize({
        name: 'alpha and beta',
        age: -20,
        gender,
        favorites: ['apple', 'cat', 'alpha', 'beta'],
      }),
    ).toEqual({
      name: 'alpha and beta',
      age: -20,
      gender,
      favorites: ['apple', 'cat', 'alpha', 'beta'],
    })
  })

  test('fallback', function () {
    const desensitize = createJsonDesensitizer({
      fallback: data => (isSymbol(data) ? null : data),
    })
    expect(
      desensitize({
        name: 'alpha and beta',
        age: -20,
        favorites: ['apple', 'cat', 'alpha', Symbol('beta')],
        gender: Symbol('female'),
      }),
    ).toEqual({
      name: 'alpha and beta',
      age: -20,
      favorites: ['apple', 'cat', 'alpha', null],
      gender: null,
    })
  })
})
