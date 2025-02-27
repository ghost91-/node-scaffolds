<header>
  <h1 align="center">
    <a href="https://github.com/guanghechen/node-scaffolds/tree/release-2.x.x/packages/helper-path#readme">@guanghechen/helper-path</a>
  </h1>
  <div align="center">
    <a href="https://www.npmjs.com/package/@guanghechen/helper-path">
      <img
        alt="Npm Version"
        src="https://img.shields.io/npm/v/@guanghechen/helper-path.svg"
      />
    </a>
    <a href="https://www.npmjs.com/package/@guanghechen/helper-path">
      <img
        alt="Npm Download"
        src="https://img.shields.io/npm/dm/@guanghechen/helper-path.svg"
      />
    </a>
    <a href="https://www.npmjs.com/package/@guanghechen/helper-path">
      <img
        alt="Npm License"
        src="https://img.shields.io/npm/l/@guanghechen/helper-path.svg"
      />
    </a>
    <a href="https://github.com/nodejs/node">
      <img
        alt="Node.js Version"
        src="https://img.shields.io/node/v/@guanghechen/helper-path"
      />
    </a>
    <a href="https://github.com/facebook/jest">
      <img
        alt="Tested with Jest"
        src="https://img.shields.io/badge/tested_with-jest-9c465e.svg"
      />
    </a>
    <a href="https://github.com/prettier/prettier">
      <img
        alt="Code Style: prettier"
        src="https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square"
      />
    </a>
  </div>
</header>
<br/>

Utilities to handle url path and file path.


## Install

* npm

  ```bash
  npm install --save-dev @guanghechen/helper-path
  ```

* yarn

  ```bash
  yarn add --dev @guanghechen/helper-path
  ```

## Usage

Name                    | Description
:----------------------:|:----------------------------------------------------------------
`absoluteOfWorkspace`   | Calc absolute filepath of p under the workspace.
`findNearestFilepath`   | Find a nearest file matched the predicate from the given directory.
`locateNearestFilepath` | Locate a nearest target file path from the given directory.
`normalizeUrlPath`      | Normalize url path.
`relativeOfWorkspace`   | Calc relative filepath to workspace.
`ensureCriticalFilepathExistsSync`  | Ensure critical filepath exists
`isDirectorySync`                   | Check whether if the dirpath is a directory path
`isFileSync`                        | Check whether if the filepath is a file path
`isNonExistentOrEmpty`              | Check whether if the dirPath is a non-existent path or empty folder
`mkdirsIfNotExists`                 | Create a path of directories


[homepage]: https://github.com/guanghechen/node-scaffolds/tree/release-2.x.x/packages/helper-path#readme
