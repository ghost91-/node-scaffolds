import { bold, green, yellow } from 'chalk'
import fs from 'fs-extra'
import path from 'path'
import { replaceInFile as replace } from 'replace-in-file'
import { rollup, watch } from 'rollup'
import type { IOptions } from '../src'
import copy from '../src'

const encoding = 'utf-8'
process.chdir(`${__dirname}/fixtures`)

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function readFile(filePath: string): Promise<string> {
  return fs.readFile(filePath, encoding)
}

async function build(pluginOptions?: IOptions): Promise<void> {
  await rollup({
    input: 'src/index.js',
    plugins: [copy(pluginOptions)],
  })
}

afterEach(async () => {
  await fs.remove('build')
  await fs.remove('dist')
})

describe('Copy', () => {
  test('No config passed', async () => {
    await build()

    expect(fs.pathExistsSync('dist/asset-1.js')).toBe(false)
  })

  test('Empty array as target', async () => {
    await build({
      targets: [],
    })

    expect(fs.pathExistsSync('dist/asset-1.js')).toBe(false)
  })

  test('Files', async () => {
    await build({
      targets: [
        {
          src: ['src/assets/asset-1.js', 'src/assets/asset-2.js'],
          dest: 'dist',
        },
      ],
    })

    expect(fs.pathExistsSync('dist/asset-1.js')).toBe(true)
    expect(fs.pathExistsSync('dist/asset-2.js')).toBe(true)
  })

  test('Folders', async () => {
    await build({
      targets: [
        {
          src: ['src/assets/css', 'src/assets/scss'],
          dest: 'dist',
        },
      ],
    })

    expect(fs.pathExistsSync('dist/css')).toBe(true)
    expect(fs.pathExistsSync('dist/css/css-1.css')).toBe(true)
    expect(fs.pathExistsSync('dist/css/css-2.css')).toBe(true)
    expect(fs.pathExistsSync('dist/scss')).toBe(true)
    expect(fs.pathExistsSync('dist/scss/scss-1.scss')).toBe(true)
    expect(fs.pathExistsSync('dist/scss/scss-2.scss')).toBe(true)
    expect(fs.pathExistsSync('dist/scss/nested')).toBe(true)
    expect(fs.pathExistsSync('dist/scss/nested/scss-3.scss')).toBe(true)
  })

  test('Glob', async () => {
    await build({
      targets: [
        {
          src: [
            'src/assets/asset-{1,2}.js',
            'src/assets/css/*.css',
            '!**/css-1.css',
            'src/assets/scss/scss-?(1).scss',
          ],
          dest: 'dist',
        },
      ],
    })

    expect(fs.pathExistsSync('dist/asset-1.js')).toBe(true)
    expect(fs.pathExistsSync('dist/asset-2.js')).toBe(true)
    expect(fs.pathExistsSync('dist/css-1.css')).toBe(false)
    expect(fs.pathExistsSync('dist/css-2.css')).toBe(true)
    expect(fs.pathExistsSync('dist/scss-1.scss')).toBe(true)
    expect(fs.pathExistsSync('dist/scss-2.scss')).toBe(false)
  })

  test('Multiple objects as targets', async () => {
    await build({
      targets: [
        { src: ['src/assets/*', 'src/assets/css'], dest: 'dist' },
        { src: 'src/assets/css/*.css', dest: 'build' },
      ],
    })

    expect(fs.pathExistsSync('dist/asset-1.js')).toBe(true)
    expect(fs.pathExistsSync('dist/asset-2.js')).toBe(true)
    expect(fs.pathExistsSync('dist/css')).toBe(true)
    expect(fs.pathExistsSync('dist/css/css-1.css')).toBe(true)
    expect(fs.pathExistsSync('dist/css/css-2.css')).toBe(true)
    expect(fs.pathExistsSync('build/css-1.css')).toBe(true)
    expect(fs.pathExistsSync('build/css-2.css')).toBe(true)
  })

  test('Multiple destinations', async () => {
    await build({
      targets: [
        {
          src: ['src/assets/asset-1.js', 'src/assets/css', 'src/assets/scss/scss-?(1).scss'],
          dest: ['dist', 'build'],
        },
      ],
    })

    expect(fs.pathExistsSync('dist/asset-1.js')).toBe(true)
    expect(fs.pathExistsSync('dist/css')).toBe(true)
    expect(fs.pathExistsSync('dist/css/css-1.css')).toBe(true)
    expect(fs.pathExistsSync('dist/css/css-2.css')).toBe(true)
    expect(fs.pathExistsSync('dist/scss-1.scss')).toBe(true)
    expect(fs.pathExistsSync('build/asset-1.js')).toBe(true)
    expect(fs.pathExistsSync('build/css')).toBe(true)
    expect(fs.pathExistsSync('build/css/css-1.css')).toBe(true)
    expect(fs.pathExistsSync('build/css/css-2.css')).toBe(true)
    expect(fs.pathExistsSync('build/scss-1.scss')).toBe(true)
  })

  test('Same target', async () => {
    await build({
      targets: [
        { src: 'src/assets/css', dest: 'dist' },
        { src: 'src/assets/css', dest: 'dist' },
        {
          src: ['src/assets/asset-1.js', 'src/assets/asset-1.js'],
          dest: 'build',
        },
      ],
    })

    expect(fs.pathExistsSync('dist/css')).toBe(true)
    expect(fs.pathExistsSync('dist/css/css-1.css')).toBe(true)
    expect(fs.pathExistsSync('dist/css/css-2.css')).toBe(true)
    expect(fs.pathExistsSync('build/asset-1.js')).toBe(true)
  })

  test('Throw if target is not an object', async () => {
    await expect(
      build({
        targets: ['src/assets/asset-1.js'] as any,
      }),
    ).rejects.toThrow("'src/assets/asset-1.js' target must be an object")
  })

  test("Throw if target object doesn't have required properties", async () => {
    await expect(
      build({
        targets: [{ src: 'src/assets/asset-1.js' }] as any,
      }),
    ).rejects.toThrow(
      '{ src: \'src/assets/asset-1.js\' } target must have "src" and "dest" properties',
    )
  })

  test('Throw if target object "rename" property is of wrong type', async () => {
    await expect(
      build({
        targets: [{ src: 'src/assets/asset-1.js', dest: 'dist', rename: [] as any }],
      }),
    ).rejects.toThrow(
      "{ src: 'src/assets/asset-1.js', dest: 'dist', rename: [] }" +
        ' target\'s "rename" property must be a string or a function',
    )
  })

  test('Rename target', async () => {
    await build({
      targets: [
        {
          src: 'src/assets/asset-1.js',
          dest: 'dist',
          rename: 'asset-1-renamed.js',
        },
        { src: 'src/assets/css', dest: 'dist', rename: 'css-renamed' },
        {
          src: 'src/assets/css/*',
          dest: 'dist/css-multiple',
          rename: 'css-1.css',
        },
        {
          src: 'src/assets/asset-2.js',
          dest: 'dist',
          rename: (name: string, extension: string) => `${name}-renamed.${extension}`,
        },
        {
          src: 'src/assets/scss',
          dest: 'dist',
          rename: (name: string) => `${name}-renamed`,
        },
        {
          src: 'src/assets/scss/*',
          dest: 'dist/scss-multiple',
          rename: (name: string, extension: string) =>
            extension ? `${name}-renamed.${extension}` : `${name}-renamed`,
        },
        {
          src: 'src/assets/asset-1.js',
          dest: 'dist',
          rename: (_: string, __: string, fullPath: string) =>
            path.basename(fullPath).replace('1', '3'),
        },
      ],
    })

    expect(fs.pathExistsSync('dist/asset-1-renamed.js')).toBe(true)
    expect(fs.pathExistsSync('dist/css-renamed')).toBe(true)
    expect(fs.pathExistsSync('dist/css-renamed/css-1.css')).toBe(true)
    expect(fs.pathExistsSync('dist/css-renamed/css-2.css')).toBe(true)
    expect(fs.pathExistsSync('dist/css-multiple/css-1.css')).toBe(true)
    expect(fs.pathExistsSync('dist/css-multiple/css-2.css')).toBe(false)
    expect(fs.pathExistsSync('dist/asset-2-renamed.js')).toBe(true)
    expect(fs.pathExistsSync('dist/scss-renamed')).toBe(true)
    expect(fs.pathExistsSync('dist/scss-renamed/scss-1.scss')).toBe(true)
    expect(fs.pathExistsSync('dist/scss-renamed/scss-2.scss')).toBe(true)
    expect(fs.pathExistsSync('dist/scss-renamed/nested')).toBe(true)
    expect(fs.pathExistsSync('dist/scss-renamed/nested/scss-3.scss')).toBe(true)
    expect(fs.pathExistsSync('dist/scss-multiple/scss-1-renamed.scss')).toBe(true)
    expect(fs.pathExistsSync('dist/scss-multiple/scss-2-renamed.scss')).toBe(true)
    expect(fs.pathExistsSync('dist/scss-multiple/nested-renamed')).toBe(true)
    expect(await fs.pathExists('dist/scss-multiple/nested-renamed/scss-3.scss')).toBe(true)
    expect(fs.pathExistsSync('dist/asset-3.js')).toBe(true)
  })

  test('Throw if transform target is not a file', async () => {
    await expect(
      build({
        targets: [
          {
            src: 'src/assets/css',
            dest: 'dist',
            transform: (contents: string | ArrayBuffer) =>
              contents.toString().replace('blue', 'red'),
          },
        ],
      }),
    ).rejects.toThrow('"transform" option works only on files: \'src/assets/css\' must be a file')
  })

  test('Transform target', async () => {
    await build({
      targets: [
        {
          src: 'src/assets/css/css-1.css',
          dest: ['dist', 'build'],
          transform: (contents: string | ArrayBuffer) => contents.toString().replace('blue', 'red'),
        },
        {
          src: 'src/assets/scss/**/*.scss',
          dest: 'dist',
          transform: (contents: string | ArrayBuffer) =>
            contents.toString().replace('background-color', 'color'),
        },
        {
          src: 'src/assets/css/css-1.css',
          dest: 'dist/css',
          transform: (contents: string | ArrayBuffer, srcPath: string) =>
            contents.toString().replace('blue', path.basename(srcPath).replace('ss-1.css', 'oral')),
        },
      ],
    })

    expect(fs.pathExistsSync('dist/css-1.css')).toBe(true)
    expect(await readFile('dist/css-1.css')).toEqual(expect.stringContaining('red'))
    expect(fs.pathExistsSync('build/css-1.css')).toBe(true)
    expect(await readFile('build/css-1.css')).toEqual(expect.stringContaining('red'))
    expect(fs.pathExistsSync('dist/scss-1.scss')).toBe(true)
    expect(await readFile('dist/scss-1.scss')).toEqual(
      expect.not.stringContaining('background-color'),
    )
    expect(fs.pathExistsSync('dist/scss-2.scss')).toBe(true)
    expect(await readFile('dist/scss-2.scss')).toEqual(
      expect.not.stringContaining('background-color'),
    )
    expect(fs.pathExistsSync('dist/nested/scss-3.scss')).toBe(true)
    expect(await readFile('dist/nested/scss-3.scss')).toEqual(
      expect.not.stringContaining('background-color'),
    )
    expect(fs.pathExistsSync('dist/css/css-1.css')).toBe(true)
    expect(await readFile('dist/css/css-1.css')).toEqual(expect.stringContaining('coral'))
  })
})

describe('Options', () => {
  /* eslint-disable no-console */
  test('Verbose, copy files', async () => {
    console.log = jest.fn()

    await build({
      targets: [
        {
          src: ['src/assets/asset-1.js', 'src/assets/css/*', 'src/assets/scss', 'src/not-exist'],
          dest: 'dist',
        },
      ],
      verbose: true,
    })

    expect(console.log).toHaveBeenCalledTimes(5)
    expect(console.log).toHaveBeenCalledWith(green('copied:'))
    expect(console.log).toHaveBeenCalledWith(
      green(`  ${bold('src/assets/asset-1.js')} → ${bold('dist/asset-1.js')}`),
    )
    expect(console.log).toHaveBeenCalledWith(
      green(`  ${bold('src/assets/css/css-1.css')} → ${bold('dist/css-1.css')}`),
    )
    expect(console.log).toHaveBeenCalledWith(
      green(`  ${bold('src/assets/css/css-2.css')} → ${bold('dist/css-2.css')}`),
    )
    expect(console.log).toHaveBeenCalledWith(
      green(`  ${bold('src/assets/scss')} → ${bold('dist/scss')}`),
    )
  })

  test('Verbose, no files to copy', async () => {
    console.log = jest.fn()

    await build({
      targets: [{ src: 'src/not-exist', dest: 'dist' }],
      verbose: true,
    })

    expect(console.log).toHaveBeenCalledTimes(1)
    expect(console.log).toHaveBeenCalledWith(yellow('no items to copy'))
  })

  test('Verbose, rename files', async () => {
    console.log = jest.fn()

    await build({
      targets: [
        {
          src: 'src/assets/asset-1.js',
          dest: 'dist',
          rename: 'asset-1-renamed.js',
        },
        {
          src: 'src/assets/scss/*',
          dest: 'dist/scss-multiple',
          rename: (name: string, extension: string) =>
            extension ? `${name}-renamed.${extension}` : `${name}-renamed`,
        },
      ],
      verbose: true,
    })

    expect(console.log).toHaveBeenCalledTimes(5)
    expect(console.log).toHaveBeenCalledWith(green('copied:'))
    expect(console.log).toHaveBeenCalledWith(
      `${green(`  ${bold('src/assets/asset-1.js')} → ${bold('dist/asset-1-renamed.js')}`)} ${yellow(
        '[R]',
      )}`,
    )
    expect(console.log).toHaveBeenCalledWith(
      `${green(
        `  ${bold('src/assets/scss/scss-1.scss')} → ${bold(
          'dist/scss-multiple/scss-1-renamed.scss',
        )}`,
      )} ${yellow('[R]')}`,
    )
    expect(console.log).toHaveBeenCalledWith(
      `${green(
        `  ${bold('src/assets/scss/scss-2.scss')} → ${bold(
          'dist/scss-multiple/scss-2-renamed.scss',
        )}`,
      )} ${yellow('[R]')}`,
    )
    expect(console.log).toHaveBeenCalledWith(
      `${green(
        `  ${bold('src/assets/scss/nested')} → ${bold('dist/scss-multiple/nested-renamed')}`,
      )} ${yellow('[R]')}`,
    )
  })

  test('Verbose, transform files', async () => {
    console.log = jest.fn()

    await build({
      targets: [
        {
          src: 'src/assets/css/css-*.css',
          dest: 'dist',
          transform: (contents: string | ArrayBuffer) =>
            contents.toString().replace('background-color', 'color'),
        },
      ],
      verbose: true,
    })

    expect(console.log).toHaveBeenCalledTimes(3)
    expect(console.log).toHaveBeenCalledWith(green('copied:'))
    expect(console.log).toHaveBeenCalledWith(
      `${green(`  ${bold('src/assets/css/css-1.css')} → ${bold('dist/css-1.css')}`)} ${yellow(
        '[T]',
      )}`,
    )
    expect(console.log).toHaveBeenCalledWith(
      `${green(`  ${bold('src/assets/css/css-2.css')} → ${bold('dist/css-2.css')}`)} ${yellow(
        '[T]',
      )}`,
    )
  })
  /* eslint-enable no-console */

  test('Hook', async () => {
    await build({
      targets: [
        {
          src: ['src/assets/asset-1.js', 'src/assets/css'],
          dest: 'dist',
        },
      ],
      hook: 'buildStart',
    })

    expect(fs.pathExistsSync('dist/asset-1.js')).toBe(true)
    expect(fs.pathExistsSync('dist/css')).toBe(true)
    expect(fs.pathExistsSync('dist/css/css-1.css')).toBe(true)
    expect(fs.pathExistsSync('dist/css/css-2.css')).toBe(true)
  })

  test('Copy once', async () => {
    const watcher = watch({
      input: 'src/index.js',
      output: {
        dir: 'build',
        format: 'esm',
      },
      plugins: [
        copy({
          targets: [{ src: 'src/assets/asset-1.js', dest: 'dist' }],
          copyOnce: true,
        }),
      ],
    })

    await sleep(1000)

    const originalContent = fs.readFileSync('src/assets/asset-1.js', encoding)
    expect(fs.readFileSync('dist/asset-1.js', encoding)).toEqual(originalContent)

    const newContent = `export const message = "waw"`
    fs.writeFileSync('src/assets/asset-1.js', newContent, encoding)
    await sleep(1000)
    expect(fs.readFileSync('dist/asset-1.js', encoding)).toEqual(originalContent)

    // Recover src/assets/asset-1.js
    await sleep(1000)
    fs.writeFileSync('src/assets/asset-1.js', originalContent, encoding)

    expect(fs.pathExistsSync('dist/asset-1.js')).toBe(true)

    await fs.remove('dist')

    expect(fs.pathExistsSync('dist/asset-1.js')).toBe(false)

    await replace({
      files: 'src/index.js',
      from: 'hey',
      to: 'ho',
    })

    await sleep(1000)

    expect(fs.pathExistsSync('dist/asset-1.js')).toBe(false)

    await watcher.close()

    await replace({
      files: 'src/index.js',
      from: 'ho',
      to: 'hey',
    })
  })

  test('Watch', async () => {
    const transform = (source: string | ArrayBuffer): string =>
      'Author: guanghechen\n' + source.toString()

    const watcher = watch({
      input: 'src/index.js',
      output: {
        dir: 'build',
        format: 'esm',
      },
      plugins: [
        copy({
          targets: [
            {
              src: 'src/assets/asset-1.js',
              dest: 'dist',
              transform,
            },
          ],
          copyOnce: false,
        }),
      ],
    })

    await sleep(1000)
    expect(fs.pathExistsSync('dist/asset-1.js')).toBe(true)

    const originalContent = fs.readFileSync('src/assets/asset-1.js', encoding)
    expect(fs.readFileSync('dist/asset-1.js', encoding)).toEqual(transform(originalContent))

    const newContent = originalContent + `\nexport const message = "waw";`
    fs.writeFileSync('src/assets/asset-1.js', newContent, encoding)
    await sleep(1000)
    expect(fs.readFileSync('dist/asset-1.js', encoding)).toEqual(transform(newContent))

    // Recover src/assets/asset-1.js
    fs.writeFileSync('src/assets/asset-1.js', originalContent, encoding)
    await sleep(3000)
    expect(fs.readFileSync('dist/asset-1.js', encoding)).toEqual(transform(originalContent))

    await fs.remove('dist')
    expect(fs.pathExistsSync('dist/asset-1.js')).toBe(false)

    await replace({
      files: 'src/index.js',
      from: 'hey',
      to: 'ho',
    })

    await sleep(1000)

    expect(fs.pathExistsSync('dist/asset-1.js')).toBe(false)

    await watcher.close()

    await replace({
      files: 'src/index.js',
      from: 'ho',
      to: 'hey',
    })
  }, 10000)

  test('Flatten', async () => {
    await build({
      targets: [
        {
          src: ['src/assets/asset-1.js', 'src/assets/asset-2.js'],
          dest: 'dist',
        },
        {
          src: 'src/**/*.css',
          dest: 'dist',
        },
        {
          src: '**/*.scss',
          dest: 'dist',
          rename: (name: string, extension: string) => `${name}-renamed.${extension}`,
        },
      ],
      flatten: false,
    })

    expect(fs.pathExistsSync('dist/assets/asset-1.js')).toBe(true)
    expect(fs.pathExistsSync('dist/assets/asset-2.js')).toBe(true)
    expect(fs.pathExistsSync('dist/assets/css/css-1.css')).toBe(true)
    expect(fs.pathExistsSync('dist/assets/css/css-2.css')).toBe(true)
    expect(fs.pathExistsSync('dist/assets/scss/scss-1-renamed.scss')).toBe(true)
    expect(fs.pathExistsSync('dist/assets/scss/scss-2-renamed.scss')).toBe(true)
    expect(fs.pathExistsSync('dist/assets/scss/nested/scss-3-renamed.scss')).toBe(true)
  })

  test('Rest options', async () => {
    await build({
      targets: [{ src: 'src/assets/asset-1.js', dest: 'dist' }],
      globbyOptions: {
        ignore: ['**/asset-1.js'],
      },
    })

    expect(fs.pathExistsSync('dist/asset-1.js')).toBe(false)
  })

  test('Rest target options', async () => {
    await build({
      targets: [
        {
          src: 'src/assets/asset-1.js',
          dest: 'dist',
          globbyOptions: {
            ignore: ['**/asset-1.js'],
          },
        },
      ],
    })

    expect(fs.pathExistsSync('dist/asset-1.js')).toBe(false)
  })
})
