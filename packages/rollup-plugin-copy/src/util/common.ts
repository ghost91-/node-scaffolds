import fs from 'fs-extra'
import globby from 'globby'
import path from 'path'
import util from 'util'
import type { IConfigRename, IConfigTarget, ICopyTargetItem } from '../types'
import { findExpandedPath, isMatch, relativePath, resolvePath } from './path'

export { isPlainObject } from 'is-plain-object'

/**
 * Stringify data
 * @param value
 */
export function stringify(value: unknown): string {
  return util.inspect(value, { breakLength: Infinity })
}

/**
 * Determine if it is a file
 * @param filePath
 */
export function isFileSync(filePath: string): boolean {
  const fileStats = fs.statSync(filePath)
  return fileStats.isFile()
}

/**
 * Calc new name of target filepath
 *
 * @param oldFileName
 * @param srcPath
 * @param rename
 * @returns
 */
export function renameTarget(oldFileName: string, srcPath: string, rename?: IConfigRename): string {
  const { name, ext } = path.parse(oldFileName)
  return rename ? rename(name, ext.replace(/^(\.)?/, ''), srcPath) : oldFileName
}

/**
 * Generate copy target item
 *
 * @param workspace
 * @param filepath
 * @param dest
 * @param target
 */
export function generateCopyTarget(
  workspace: string,
  filepath: string,
  dest: string,
  target: Readonly<IConfigTarget>,
): ICopyTargetItem {
  const { flatten, rename, transform } = target
  const srcPath: string = findExpandedPath(workspace, filepath, target.watchPatterns)

  if (transform && !isFileSync(filepath)) {
    const prettierPath: string = relativePath(workspace, filepath)
    throw new Error(`"transform" option works only on files: '${prettierPath}' must be a file`)
  }

  const { base: oldFileName, dir } = path.parse(srcPath)
  const destinationFolder = flatten
    ? path.join(dest, dir)
    : relativePath(workspace, path.dirname(filepath)).replace(/^([^/\\]+)?/, dest)
  const newFileName: string = renameTarget(oldFileName, srcPath, rename)
  const destFilePath = resolvePath(workspace, destinationFolder, newFileName)
  const result: ICopyTargetItem = {
    srcPath: filepath,
    destPath: destFilePath,
    renamed: oldFileName !== newFileName,
    copying: false,
    queueingTimestamp: 0,
    target,
  }
  return result
}

/**
 * Collect copy target items.
 *
 * @param workspace
 * @param srcPath
 * @param targets
 * @param isMatch
 * @returns
 */
export function collectCopyTargets(
  workspace: string,
  srcPath: string,
  targets: ReadonlyArray<IConfigTarget>,
): ICopyTargetItem[] {
  const results: ICopyTargetItem[] = []
  const duplicated: Set<string> = new Set<string>()
  for (const target of targets) {
    if (isMatch(workspace, srcPath, target.watchPatterns)) {
      for (const destination of target.dest) {
        const copyTarget: ICopyTargetItem = generateCopyTarget(
          workspace,
          srcPath,
          destination,
          target,
        )

        if (duplicated.has(copyTarget.destPath)) continue
        duplicated.add(copyTarget.destPath)
        results.push(copyTarget)
      }
    }
  }
  return results
}

/**
 * Collect copyTargets
 *
 * @param workspace
 * @param targets
 * @returns
 */
export async function collectAndWatchingTargets(
  workspace: string,
  targets: ReadonlyArray<IConfigTarget>,
): Promise<ICopyTargetItem[]> {
  const copyTargets: ICopyTargetItem[] = []
  for (const target of targets) {
    const { dest, src: patterns, globbyOptions } = target

    const matchedPaths: string[] = await globby(patterns, {
      absolute: true,
      expandDirectories: false,
      onlyFiles: false,
      ...globbyOptions,
    })

    if (matchedPaths.length) {
      for (const matchedPath of matchedPaths) {
        const destinations: string[] = dest
        for (const destination of destinations) {
          const copyTarget: ICopyTargetItem = generateCopyTarget(
            workspace,
            matchedPath,
            destination,
            target,
          )
          copyTargets.push(copyTarget)
        }
      }
    }
  }
  return copyTargets
}
