export function formatTypeName (str: string): string {
  const splitName = str.toLowerCase().trim().split(/[_-]/g)
  let name = ""

  for (const n of splitName) {
    name += n.charAt(0).toUpperCase() + n.slice(1)
  }
  return name
}


