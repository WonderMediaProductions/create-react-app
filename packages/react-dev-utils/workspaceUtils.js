/**
 * Copyright (c) 2018-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';
const fs = require('fs');
const path = require('path');
const findUp = require('find-up');
const globby = require('globby');

function findPkgs(rootPath, globPatterns) {
  if (!globPatterns) {
    return [];
  }
  const globOpts = {
    cwd: rootPath,
    strict: true,
    absolute: true,
  };
  return globPatterns
    .reduce(
      (pkgs, pattern) =>
        pkgs.concat(globby.sync(path.join(pattern, 'package.json'), globOpts)),
      []
    )
    .map(f => path.dirname(path.normalize(f)));
}

function resolveWorkspaces(pkgPath) {
  const monoPkg = pkgPath && require(pkgPath);
  const workspaces = monoPkg && monoPkg.workspaces;
  return workspaces && (workspaces.packages || workspaces);
}

function findMonorepo(appDir) {
  const rootPkgPath = findUp.sync('package.json', {
    cwd: path.resolve(appDir, '..'),
  });
  const rootPath = rootPkgPath && path.dirname(rootPkgPath);
  const workspaces = resolveWorkspaces(rootPkgPath);
  const allPkgs = workspaces && findPkgs(rootPath, workspaces);
  const includes = dir => allPkgs && allPkgs.indexOf(dir) !== -1;
  const pkgs = allPkgs
    ? allPkgs.filter(f => fs.realpathSync(f) !== appDir)
    : [];

  return {
    includes,
    pkgs,
    rootPath,
  };
}

module.exports = {
  findMonorepo,
};
