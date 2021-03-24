interface Version {
  [version: string]: Package
}

interface Dependencies {
  [name: string]: string
}

interface Package {
  name: string
  version: string
  versions: Version[]
  dependencies: Dependencies
}

interface PackageDependencies {
  dependencies: Dependencies
  matchVersion: string
}

interface PackageDependencyTree {
  [name: string]: {
    version: string
    dependencies: PackageDependencyTree[]
  }
}

interface Error {
  status?: number
}