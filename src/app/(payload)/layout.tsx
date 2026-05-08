import { RootLayout } from '@payloadcms/next/layouts'
import React from 'react'

import config from '@payload-config'
import { importMap } from './admin/importMap'
import { serverFunction } from './serverFunctions'
import '@payloadcms/next/css'
import './custom.css'

type Args = {
  children: React.ReactNode
}

const Layout = ({ children }: Args) => (
  <RootLayout config={config} importMap={importMap} serverFunction={serverFunction}>
    {children}
  </RootLayout>
)

export default Layout
