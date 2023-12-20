export interface ParameterDefintion {
  _class: string
  defaultParameterValue: {
    _class: string
    name: string
    value: unknown
  }
  description: string
  name: string
  options?: { name: string, value: string }[]
  error?: string
  value?: string
}
