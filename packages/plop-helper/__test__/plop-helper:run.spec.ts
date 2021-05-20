import {
  composeStringDesensitizers,
  createConsoleMock,
  createFilepathDesensitizer,
  createJsonDesensitizer,
  createPackageVersionDesensitizer,
  fileSnapshot,
} from '@guanghechen/jest-helper'
import fs from 'fs-extra'
import path from 'path'
import type { Desensitizer } from '@guanghechen/jest-helper'
import manifest from '../package.json'
import {
  createNpmPackagePrompts,
  resolveNpmPackageAnswers,
  resolveNpmPackagePreAnswers,
  runPlopWithMock,
  runPromptsWithMock,
} from '../src'
import type { InputQuestion } from 'inquirer'

const initialCwd = process.cwd()
const outputDir = path.join(__dirname, 'output')

beforeEach(async function () {
  jest.setTimeout(10000)
  if (!fs.existsSync(outputDir)) fs.mkdirpSync(outputDir)
  process.chdir(outputDir)
})

afterEach(async function () {
  fs.removeSync(outputDir)
  process.chdir(initialCwd)
})

const desensitizers = {
  filepath: createFilepathDesensitizer(__dirname),
  packageVersion: createPackageVersionDesensitizer(
    packageVersion => {
      // eslint-disable-next-line jest/no-standalone-expect
      expect(packageVersion).toEqual(manifest.version)
      return '<LATEST>'
    },
    packageName => /^(@guanghechen\/|version$)/.test(packageName),
  ),
}
const jsonDesensitizer = createJsonDesensitizer({
  string: composeStringDesensitizers(
    desensitizers.filepath,
    desensitizers.packageVersion,
  ),
})

describe('runPlop', function () {
  const templateDir = path.join(__dirname, 'fixtures/simple')
  const templateConfig = path.join(templateDir, 'plop.js')

  async function runTest(
    plopBypass: string[],
    mockInputs: string[],
    defaultAnswers: Record<string, unknown>,
    expectedPackageLocation: string,
  ): Promise<void> {
    const consoleMock = createConsoleMock(
      ['log', 'debug'],
      jsonDesensitizer as Desensitizer<unknown[]>,
    )

    await runPlopWithMock(
      templateConfig,
      plopBypass,
      mockInputs,
      defaultAnswers,
    )

    expect(consoleMock.getIndiscriminateAll()).toMatchSnapshot('console')

    const targetDir = path.resolve(expectedPackageLocation)
    fileSnapshot(
      targetDir,
      [
        'src/index.ts',
        'rollup.config.js',
        'tsconfig.json',
        'tsconfig.settings.json',
        'tsconfig.src.json',
      ],
      desensitizers.filepath,
    )

    fileSnapshot(
      targetDir,
      ['README.md'],
      composeStringDesensitizers(
        desensitizers.filepath,
        desensitizers.packageVersion,
      ),
    )

    consoleMock.restore()
  }

  test('simple', async function () {
    const defaultAnswers = { nickname: 'jojo', isMonorepo: false }
    await runTest(
      ['@guanghechen/waw'],
      ['', '', 'some descriptions', ''],
      defaultAnswers,
      'packages/waw',
    )
  })
})

describe('runPrompts', function () {
  test('npm-package', function () {
    const preAnswers = resolveNpmPackagePreAnswers()
    const defaultAnswers = { packageVersion: '1.0.0-alpha' }
    const prompts = createNpmPackagePrompts(preAnswers, defaultAnswers)

    const calc = (
      bypass: string[],
      mockInputs: string[],
    ): Record<string, unknown> => {
      const answers: any = runPromptsWithMock(
        prompts as InputQuestion[],
        bypass,
        mockInputs,
      )
      const resolvedAnswers = resolveNpmPackageAnswers(preAnswers, answers)
      return jsonDesensitizer(resolvedAnswers) as Record<string, unknown>
    }

    expect(calc(['@guanghechen/waw'], [])).toMatchSnapshot()
    expect(
      calc(
        ['@guanghechen/waw'],
        ['', '1.0.1', 'some description', 'packages/waw2'],
      ),
    ).toMatchSnapshot()
    expect(calc([], ['@guanghechen/waw'])).toMatchSnapshot()
  })
})
