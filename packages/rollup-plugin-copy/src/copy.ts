import chalk from 'chalk'
import path from 'path'
import type rollup from 'rollup'
import type { ICopyTargetItem, IOptions } from './types'
import {
  CopyWatcher,
  collectAndWatchingTargets,
  copySingleItem,
  logger,
  normalizeOptions,
} from './util'

export function copy(options: IOptions = {}): rollup.Plugin {
  const workspace: string = path.resolve()
  const config = normalizeOptions(options)
  const { targets, copyOnce, hook, watchHook } = config

  logger.shouldBeVerbose = config.verbose
  let copied = false
  let copyTargets: ReadonlyArray<ICopyTargetItem> | undefined

  let isWatchMode = false
  let watcher: CopyWatcher | undefined

  async function fullCopy(): Promise<void> {
    if (copyTargets === undefined) copyTargets = await collectAndWatchingTargets(workspace, targets)
    if (copyTargets.length) {
      logger.verbose(chalk.green('copied:'))
      for (const copyTarget of copyTargets) await copySingleItem(workspace, copyTarget)
    } else {
      logger.verbose(chalk.yellow('no items to copy'))
    }
    copied = true
  }

  async function clean(): Promise<void> {
    await watcher?.close()
  }

  /**
   * If we have performed the fullCopy once the watcher is created,
   * then we shouldn't to run fullCopy any more.
   */
  async function handleCopy(): Promise<void> {
    if (copied && (copyOnce || watcher)) return
    await fullCopy()
  }

  const plugin: rollup.Plugin = {
    name: 'copy',
    [hook]: handleCopy,
    async [watchHook]() {
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      const context: rollup.PluginContext = this as any

      if (!copyOnce) {
        if (!isWatchMode) {
          copyTargets = await collectAndWatchingTargets(workspace, targets)
          for (const target of copyTargets) context.addWatchFile(target.srcPath)
        }

        if (isWatchMode) {
          if (watcher === undefined) {
            watcher = new CopyWatcher(path.resolve())
            await fullCopy()
          }
          watcher?.watchTargets(targets)
        }
      }

      // Merge handleCopy and collectAndWatchingTargets
      if (hook === watchHook) {
        await handleCopy()
      }
    },
    watchChange: () => {
      isWatchMode = true
    },
    closeWatcher: clean,
  }
  return plugin
}
