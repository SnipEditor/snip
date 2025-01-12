import { twMerge } from 'tailwind-merge'

export type CN = string | null | boolean | undefined | CN[];
function flattenClassNames(...classnames: CN[]) : string {
  return [...classnames].flat(10).filter(Boolean).join(' ')
}

export default function cn(...args: CN[]) {
  const flattedClassNames = flattenClassNames(...args)
  return twMerge(flattedClassNames)
}
