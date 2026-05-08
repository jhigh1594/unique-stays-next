import { NotFoundPage } from '@payloadcms/next/views'
import { importMap } from '../importMap'
import config from '@payload-config'

type Args = {
  params: Promise<{
    segments: string[]
  }>
}

const NotFound = ({ params }: Args) => NotFoundPage({ config, params, importMap })

export default NotFound
