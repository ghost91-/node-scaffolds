import ChalkLogger from '@guanghechen/chalk-logger'
import { BigFileHelper, calcFilePartItemsByCount } from '@guanghechen/helper-file'
import fs from 'fs-extra'
import { locateFixtures, unlinkSync } from 'jest.helper'
import { AESCipher, calcMac } from '../src'

describe('AESCipher', function () {
  describe('init by secret', function () {
    const logger = new ChalkLogger({ flags: { colorful: false, date: false } })
    const cipher = new AESCipher({ logger })

    const fileHelper = new BigFileHelper()
    const sourceFilepath = locateFixtures('basic/big-file.md')
    const originalContent = fs.readFileSync(sourceFilepath)
    let partFilepaths: string[] = []

    beforeAll(async () => {
      const secret = cipher.createSecret()
      cipher.initFromSecret(secret)
      partFilepaths = await fileHelper.split(
        sourceFilepath,
        calcFilePartItemsByCount(sourceFilepath, 5),
      )
    })

    afterAll(async () => {
      unlinkSync(partFilepaths)
    })

    test('encrypt data', function () {
      const plainData: Buffer = Buffer.from('@guanghechen/helper-cipher')
      const cipherData = cipher.encrypt(plainData)
      expect(cipher.decrypt(cipherData)).toEqual(plainData)
    })

    test('encrypt from files', async function () {
      for (let i = 0; i < 3; ++i) {
        const cipherData: Buffer = await cipher.encryptFromFiles(partFilepaths)
        const plainData: Buffer = cipher.decrypt(cipherData)
        expect(plainData).toEqual(originalContent)
      }
    })

    test('decrypt from files', async function () {
      for (let i = 0; i < 3; ++i) {
        const cipherFilepath = sourceFilepath + '.cipher.' + Math.random()
        let cipherPartFilepaths: string[] | null = null

        try {
          expect(fs.existsSync(cipherFilepath)).toBe(false)
          await cipher.encryptFile(sourceFilepath, cipherFilepath)
          expect(fs.existsSync(cipherFilepath)).toBe(true)

          cipherPartFilepaths = await fileHelper.split(
            cipherFilepath,
            calcFilePartItemsByCount(cipherFilepath, 5),
          )
          expect(cipherPartFilepaths.length).toEqual(5)

          const plainData: Buffer = await cipher.decryptFromFiles(cipherPartFilepaths)
          expect(plainData).toEqual(originalContent)
        } finally {
          unlinkSync(cipherFilepath, cipherPartFilepaths)
        }
      }
    })

    test('encrypt file', async function () {
      for (const filepath of partFilepaths) {
        const plainFilepath = filepath + '.plain.' + Math.random()
        const cipherFilepath = filepath + '.cipher.' + Math.random()

        try {
          expect(filepath).not.toEqual(plainFilepath)
          expect(filepath).not.toEqual(cipherFilepath)
          expect(plainFilepath).not.toEqual(cipherFilepath)

          expect(fs.existsSync(plainFilepath)).toBe(false)
          expect(fs.existsSync(cipherFilepath)).toBe(false)

          await cipher.encryptFile(filepath, cipherFilepath)
          await cipher.decryptFile(cipherFilepath, plainFilepath)

          expect(fs.existsSync(plainFilepath)).toBe(true)
          expect(fs.existsSync(cipherFilepath)).toBe(true)
          expect(fs.readFileSync(plainFilepath)).toEqual(fs.readFileSync(filepath))
        } finally {
          unlinkSync(plainFilepath, cipherFilepath)
        }
      }
    })

    test('encrypt files', async function () {
      await expect(cipher.encryptFiles([], 'a.txt')).resolves.not.toThrow()
      for (let i = 0; i < 3; ++i) {
        const plainFilepath = sourceFilepath + '.plain.' + Math.random()
        const cipherFilepath = sourceFilepath + '.cipher.' + Math.random()

        try {
          expect(plainFilepath).not.toEqual(cipherFilepath)
          expect(fs.existsSync(plainFilepath)).toBe(false)
          expect(fs.existsSync(cipherFilepath)).toBe(false)

          await cipher.encryptFiles([sourceFilepath], cipherFilepath)
          await cipher.decryptFile(cipherFilepath, plainFilepath)

          expect(fs.existsSync(plainFilepath)).toBe(true)
          expect(fs.existsSync(cipherFilepath)).toBe(true)
          expect(fs.readFileSync(plainFilepath)).toEqual(originalContent)
        } finally {
          unlinkSync(plainFilepath, cipherFilepath)
        }
      }

      for (let i = 0; i < 3; ++i) {
        const plainFilepath = sourceFilepath + '.plain.' + Math.random()
        const cipherFilepath = sourceFilepath + '.cipher.' + Math.random()

        try {
          expect(plainFilepath).not.toEqual(cipherFilepath)
          expect(fs.existsSync(plainFilepath)).toBe(false)
          expect(fs.existsSync(cipherFilepath)).toBe(false)

          await cipher.encryptFiles(partFilepaths, cipherFilepath)
          await cipher.decryptFile(cipherFilepath, plainFilepath)

          expect(fs.existsSync(plainFilepath)).toBe(true)
          expect(fs.existsSync(cipherFilepath)).toBe(true)
          expect(fs.readFileSync(plainFilepath)).toEqual(originalContent)
        } finally {
          unlinkSync(plainFilepath, cipherFilepath)
        }
      }
    })

    test('decrypt files', async function () {
      await expect(cipher.decryptFiles([], 'a.txt')).resolves.not.toThrow()
      for (let i = 0; i < 3; ++i) {
        const plainFilepath = sourceFilepath + '.plain.' + Math.random()
        const cipherFilepath = sourceFilepath + '.cipher.' + Math.random()

        try {
          expect(plainFilepath).not.toEqual(cipherFilepath)
          expect(fs.existsSync(plainFilepath)).toBe(false)
          expect(fs.existsSync(cipherFilepath)).toBe(false)

          await cipher.encryptFile(sourceFilepath, cipherFilepath)
          await cipher.decryptFiles([cipherFilepath], plainFilepath)

          expect(fs.existsSync(plainFilepath)).toBe(true)
          expect(fs.existsSync(cipherFilepath)).toBe(true)
          expect(fs.readFileSync(plainFilepath)).toEqual(originalContent)
        } finally {
          unlinkSync(plainFilepath, cipherFilepath)
        }
      }

      for (let i = 0; i < 3; ++i) {
        const plainFilepath = sourceFilepath + '.plain.' + Math.random()
        const plainFilepath2 = sourceFilepath + '.plain2.' + Math.random()
        const plainFilepath3 = sourceFilepath + '.plain3.' + Math.random()
        const cipherFilepath = sourceFilepath + '.cipher.' + Math.random()
        const cipherFilepath2 = sourceFilepath + '.cipher2.' + Math.random()

        let cipherPartFilepaths: string[] | null = null
        try {
          expect(plainFilepath).not.toEqual(cipherFilepath)
          expect(fs.existsSync(plainFilepath)).toBe(false)
          expect(fs.existsSync(plainFilepath2)).toBe(false)
          expect(fs.existsSync(plainFilepath3)).toBe(false)
          expect(fs.existsSync(cipherFilepath)).toBe(false)
          expect(fs.existsSync(cipherFilepath2)).toBe(false)

          await cipher.encryptFile(sourceFilepath, cipherFilepath)
          expect(fs.existsSync(cipherFilepath)).toBe(true)

          await cipher.decryptFile(cipherFilepath, plainFilepath)
          expect(fs.existsSync(plainFilepath)).toBe(true)
          expect(fs.readFileSync(plainFilepath)).toEqual(originalContent)

          cipherPartFilepaths = await fileHelper.split(
            cipherFilepath,
            calcFilePartItemsByCount(cipherFilepath, 5),
          )
          expect(cipherPartFilepaths.length).toEqual(5)

          await fileHelper.merge(cipherPartFilepaths, cipherFilepath2)
          expect(fs.existsSync(cipherFilepath2)).toBe(true)

          await cipher.decryptFile(cipherFilepath2, plainFilepath2)
          expect(fs.existsSync(plainFilepath2)).toBe(true)
          expect(fs.readFileSync(plainFilepath2)).toEqual(originalContent)

          await cipher.decryptFiles(cipherPartFilepaths, plainFilepath3)
          expect(fs.existsSync(plainFilepath3)).toBe(true)
          expect(fs.readFileSync(plainFilepath3)).toEqual(originalContent)
        } finally {
          unlinkSync(
            plainFilepath,
            plainFilepath2,
            plainFilepath3,
            cipherFilepath,
            cipherFilepath2,
            cipherPartFilepaths,
          )
        }
      }
    })
  })

  describe('init by password', function () {
    const logger = new ChalkLogger({ flags: { colorful: false, date: false } })
    const cipher = new AESCipher({ logger })

    const fileHelper = new BigFileHelper()
    const sourceFilepath = locateFixtures('basic/big-file.md')
    const originalContent = fs.readFileSync(sourceFilepath)
    let partFilepaths: string[] = []

    beforeAll(async function () {
      const password = calcMac(Buffer.from('@guanghechen/helper-cipher'))
      cipher.initFromPassword(password)
      partFilepaths = await fileHelper.split(
        sourceFilepath,
        calcFilePartItemsByCount(sourceFilepath, 5),
      )
    })

    afterAll(() => {
      unlinkSync(partFilepaths)
    })

    test('encrypt data', function () {
      const plainData: Buffer = Buffer.from('@guanghechen/helper-cipher')
      const cipherData = cipher.encrypt(plainData)
      expect(cipher.decrypt(cipherData)).toEqual(plainData)
    })

    test('encrypt file', async function () {
      for (const filepath of partFilepaths) {
        const plainFilepath = filepath + '.plain.' + Math.random()
        const cipherFilepath = filepath + '.cipher.' + Math.random()

        try {
          expect(filepath).not.toEqual(plainFilepath)
          expect(filepath).not.toEqual(cipherFilepath)
          expect(plainFilepath).not.toEqual(cipherFilepath)

          expect(fs.existsSync(plainFilepath)).toBe(false)
          expect(fs.existsSync(cipherFilepath)).toBe(false)

          await cipher.encryptFile(filepath, cipherFilepath)
          await cipher.decryptFile(cipherFilepath, plainFilepath)

          expect(fs.existsSync(plainFilepath)).toBe(true)
          expect(fs.existsSync(cipherFilepath)).toBe(true)
          expect(fs.readFileSync(plainFilepath)).toEqual(fs.readFileSync(filepath))
        } finally {
          unlinkSync(plainFilepath, cipherFilepath)
        }
      }
    })

    test('encrypt files', async function () {
      for (let i = 0; i < 3; ++i) {
        const plainFilepath = sourceFilepath + '.plain.' + Math.random()
        const cipherFilepath = sourceFilepath + '.cipher.' + Math.random()

        try {
          expect(plainFilepath).not.toEqual(cipherFilepath)
          expect(fs.existsSync(plainFilepath)).toBe(false)
          expect(fs.existsSync(cipherFilepath)).toBe(false)

          await cipher.encryptFiles(partFilepaths, cipherFilepath)
          await cipher.decryptFile(cipherFilepath, plainFilepath)

          expect(fs.existsSync(plainFilepath)).toBe(true)
          expect(fs.existsSync(cipherFilepath)).toBe(true)
          expect(fs.readFileSync(plainFilepath)).toEqual(originalContent)
        } finally {
          unlinkSync(plainFilepath, cipherFilepath)
        }
      }
    })

    test('decrypt files', async function () {
      for (let i = 0; i < 3; ++i) {
        const plainFilepath = sourceFilepath + '.plain.' + Math.random()
        const plainFilepath2 = sourceFilepath + '.plain2.' + Math.random()
        const plainFilepath3 = sourceFilepath + '.plain3.' + Math.random()
        const cipherFilepath = sourceFilepath + '.cipher.' + Math.random()
        const cipherFilepath2 = sourceFilepath + '.cipher2.' + Math.random()

        let cipherPartFilepaths: string[] | null = null
        try {
          expect(plainFilepath).not.toEqual(cipherFilepath)
          expect(fs.existsSync(plainFilepath)).toBe(false)
          expect(fs.existsSync(plainFilepath2)).toBe(false)
          expect(fs.existsSync(plainFilepath3)).toBe(false)
          expect(fs.existsSync(cipherFilepath)).toBe(false)
          expect(fs.existsSync(cipherFilepath2)).toBe(false)

          await cipher.encryptFile(sourceFilepath, cipherFilepath)
          expect(fs.existsSync(cipherFilepath)).toBe(true)

          await cipher.decryptFile(cipherFilepath, plainFilepath)
          expect(fs.existsSync(plainFilepath)).toBe(true)
          expect(fs.readFileSync(plainFilepath)).toEqual(originalContent)

          cipherPartFilepaths = await fileHelper.split(
            cipherFilepath,
            calcFilePartItemsByCount(cipherFilepath, 5),
          )
          expect(cipherPartFilepaths.length).toEqual(5)

          await fileHelper.merge(cipherPartFilepaths, cipherFilepath2)
          expect(fs.existsSync(cipherFilepath2)).toBe(true)

          await cipher.decryptFile(cipherFilepath2, plainFilepath2)
          expect(fs.existsSync(plainFilepath2)).toBe(true)
          expect(fs.readFileSync(plainFilepath2)).toEqual(originalContent)

          await cipher.decryptFiles(cipherPartFilepaths, plainFilepath3)
          expect(fs.existsSync(plainFilepath3)).toBe(true)
          expect(fs.readFileSync(plainFilepath3)).toEqual(originalContent)
        } finally {
          unlinkSync(
            plainFilepath,
            plainFilepath2,
            plainFilepath3,
            cipherFilepath,
            cipherFilepath2,
            cipherPartFilepaths,
          )
        }
      }
    })
  })
})
