export type Name = string
export type Version = string

export interface Versions {
  [version: string]: Package
}

export interface Dependencies {
  [name: string]: Version
}

export interface Package {
  name: Name
  version: Version
  versions: Versions
  dependencies: Dependencies
}

export interface VersionedDependencies {
  matchVersion: Version,
  dependencies: Dependencies
}

export interface DependencyTree {
  [name: string]: {
    version: Version
    dependencies: DependencyTree[] | undefined
  }
}

export interface Error {
  status?: number
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      name: Name
      version: Version
    }
  }
}