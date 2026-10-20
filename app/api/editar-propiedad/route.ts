import { saveProperty } from '@/lib/property-save-server'

export async function POST(request: Request) {
  return saveProperty(request)
}
