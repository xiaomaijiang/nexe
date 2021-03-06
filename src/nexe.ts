import { EOL } from 'os'
import { compose } from 'app-builder'
import { NexeCompiler } from './compiler'
import { normalizeOptions, NexeOptions, NexePatch } from './options'
import resource from './steps/resource'
import clean from './steps/clean'
import cli from './steps/cli'
import bundle from './steps/bundle'
import download from './steps/download'
import shim from './steps/shim'
import artifacts from './steps/artifacts'
import patches from './patches'

async function compile(
  compilerOptions?: Partial<NexeOptions>,
  callback?: (err: Error | null) => void
) {
  const options = normalizeOptions(compilerOptions)
  const compiler = new NexeCompiler(options)

  const nexe = compose(
    clean,
    resource,
    cli,
    bundle,
    shim,
    options.build ? [download, artifacts, ...patches, ...(options.patches as NexePatch[])] : [],
    options.plugins as NexePatch[]
  )

  let error = null
  try {
    await nexe(compiler)
  } catch (e) {
    error = e
  }

  if (error) {
    if (compiler.options.loglevel !== 'silent' && error) {
      process.stderr.write(EOL + error.message + EOL)
    }
    compiler.quit()
    if (callback) return callback(error)
    return Promise.reject(error)
  }

  if (callback) callback(null)
}

export { compile, NexeCompiler }
export { argv, version, NexeOptions, help } from './options'
