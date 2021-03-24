export interface Version {
  [version: string]: Package
}

export interface Dependencies {
  [name: string]: string
}

export interface Package {
  name: string
  version: string
  versions: Version[]
  dependencies: Dependencies
}

export interface PackageDependencies {
  dependencies: Dependencies
  matchVersion: string
}

export interface PackageDependencyTree {
  [name: string]: {
    version: string
    dependencies: PackageDependencyTree[]
  }
}

export interface Error {
  status?: number
}