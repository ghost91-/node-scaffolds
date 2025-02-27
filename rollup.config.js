// eslint-disable-next-line import/no-extraneous-dependencies
import createRollupConfig from '@guanghechen/rollup-config'
import path from 'path'

export default async function rollupConfig() {
  const { default: manifest } = await import(path.resolve('package.json'))
  const config = createRollupConfig({
    manifest,
    pluginOptions: {
      typescriptOptions: { tsconfig: 'tsconfig.src.json' },
    },
  })
  return config
}
