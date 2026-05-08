import { RootLayout } from '@payloadcms/next/layouts'
import React from 'react'

import config from '@payload-config'
import '@payloadcms/next/css'
import './custom.css'

type Args = {
  children: React.ReactNode
}

const Layout = ({ children }: Args) => <RootLayout config={config}>{children}</RootLayout>

export default Layout
