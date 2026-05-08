'use server'
import type { ServerFunctionClientArgs } from 'payload'
import { handleServerFunctions } from '@payloadcms/next/layouts'
import config from '@payload-config'
import { importMap } from './admin/importMap'

export const serverFunction = async (args: ServerFunctionClientArgs) =>
  handleServerFunctions({ ...args, config, importMap })
