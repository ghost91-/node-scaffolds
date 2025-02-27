import { detectPackageAuthor } from '@guanghechen/helper-npm'
import { composeTextTransformers, toSentenceCase, toTrim } from '@guanghechen/helper-string'
import type { ITextTransformer } from '@guanghechen/helper-string'
import type { InputQuestion } from 'inquirer'
import type { INpmPackagePromptsAnswers } from './types'

// @see https://github.com/sindresorhus/semver-regex
const semverRegex =
  /(?<=^v?|\sv?)(?:(?:0|[1-9]\d*)\.){2}(?:0|[1-9]\d*)(?:-(?:0|[1-9]\d*|[\da-z-]*[a-z-][\da-z-]*)(?:\.(?:0|[1-9]\d*|[\da-z-]*[a-z-][\da-z-]*))*)?(?:\+[\da-z-]+(?:\.[\da-z-]+)*)?\b/i

/**
 * Create an inquirer prompt to ask for npm package name.
 * @param defaultAnswer   Default prompt answer
 * @param transformer     Input transformer
 * @returns
 */
export const createPackageNamePrompt = (
  defaultAnswer?: string,
  transformer: ITextTransformer = toTrim,
): InputQuestion<Pick<INpmPackagePromptsAnswers, 'packageName'>> => {
  const prompt: InputQuestion = {
    type: 'input',
    name: 'packageName',
    message: 'package name',
    default: defaultAnswer,
    transformer,
  }
  return prompt
}

/**
 * Create an inquirer prompt to ask for npm package author.
 * @param cwd             Current workspace dir
 * @param defaultAnswer   Default prompt answer
 * @param transformer     Input transformer
 * @returns
 */
export const createPackageAuthorPrompt = (
  cwd: string,
  defaultAnswer?: string,
  transformer: ITextTransformer = toTrim,
): InputQuestion<Pick<INpmPackagePromptsAnswers, 'packageAuthor'>> => {
  const prompt: InputQuestion = {
    type: 'input',
    name: 'packageAuthor',
    message: 'author',
    default: (): string | null => {
      if (defaultAnswer != null) return defaultAnswer
      const packageAuthor = detectPackageAuthor(cwd)
      return packageAuthor
    },
    transformer,
  }
  return prompt
}

/**
 * Create an inquirer prompt to ask for npm package version.
 * @param defaultAnswer   Default prompt answer
 * @param transformer     Input transformer
 * @returns
 */
export const createPackageVersionPrompt = (
  defaultAnswer?: string,
  transformer: ITextTransformer = toTrim,
): InputQuestion<Pick<INpmPackagePromptsAnswers, 'packageVersion'>> => {
  const prompt: InputQuestion = {
    type: 'input',
    name: 'packageVersion',
    message: 'version',
    default: defaultAnswer,
    transformer,
    validate: (text: string): boolean => semverRegex.test(text),
  }
  return prompt
}

/**
 * Create an inquirer prompt to ask for npm package description.
 * @param defaultAnswer   Default prompt answer
 * @param transformer     Input transformer
 * @returns
 */
export const createPackageDescriptionPrompt = (
  defaultAnswer?: string,
  transformer: ITextTransformer = composeTextTransformers(toTrim, toSentenceCase),
): InputQuestion<Pick<INpmPackagePromptsAnswers, 'packageDescription'>> => {
  const prompt: InputQuestion = {
    type: 'input',
    name: 'packageDescription',
    message: 'description',
    default: defaultAnswer,
    transformer,
  }
  return prompt
}

/**
 * Create an inquirer prompt to ask for npm package location.
 * @param defaultAnswer   Default prompt answer
 * @param transformer     Input transformer
 * @returns
 */
export const createPackageLocationPrompt = (
  isMonorepo: boolean,
  defaultAnswer?: string,
  transformer: ITextTransformer = toTrim,
): InputQuestion<Pick<INpmPackagePromptsAnswers, 'packageDescription'>> => {
  type Answers = Pick<INpmPackagePromptsAnswers, 'packageName' | 'packageDescription'>

  const prompt: InputQuestion<any> = {
    type: 'input',
    name: 'packageLocation',
    message: ({ packageName }: Answers): string => 'location of ' + packageName.trim(),
    default: ({ packageName }: Answers): string => {
      if (defaultAnswer != null) return defaultAnswer
      return isMonorepo
        ? 'packages/' + packageName.replace(/^[^\\/]+[\\/]/, '')
        : packageName.replace(/^@/, '')
    },
    transformer,
  }
  return prompt as InputQuestion
}
