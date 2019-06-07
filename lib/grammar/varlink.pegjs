start
  = iface:interface eol*
    { return iface }

interface
  = eol_r* doc:comment* "interface" _+ name:interface_name eol_r+ members:members _*
  { return Object.assign({ name, doc: doc ? doc.join('\n') : null }, members) }

members
  = members:(
      head:member eol*
      tail:(m:member eol* { return m })*
      { return [head].concat(tail) }
    )?
    {
      if (!members.length) {
        return []
      }
      return members.reduce((acc, m) => {
        const type = m.type
        delete m.type
        if (type === 'method') {
          acc.methods.push(m)
        } else if (type === 'typedef') {
          acc.typedefs.push(m)
        } else if (type === 'error') {
          acc.errors.push(m)
        }
        return acc
      }, { methods: [], typedefs: [], errors: [] })
    }

member
  = m:method { return m }
  / t:typedef { return t }
  / e:error { return e }

method
  = doc:comment* "method" _+ name:name _* parameters:struct _* "->" _* reply:struct
    { return { type: 'method', name, parameters, reply, doc: doc.length ? doc.join('\n') : null } }

error
  = _* "error" _+ name:name _* parameters:struct
    { return { type: 'error', name, parameters } }

enum
  = "(" names:field_names? _* ")"
    { return names || [] }

struct
  = "(" eol* members:struct_members? eol* ")"
    { return members || [] }

struct_members
  = members:(
      head:struct_member
      tail:(_* "," m:struct_member { return m })*
      { return [head].concat(tail) }
    )? { return members || [] }

struct_member
  = _* name:field_name _* ":" _* type:type
  { return { name, type } }

typedef
  = doc:comment* "type" _+ name:name _* members:struct { return { type: "typedef", name, members, doc: doc.length ? doc.join('\n') : null } }
  / doc:comment* "type" _+ name:name _* members:enum { return { type: "typedef", name, members, doc: doc.length ? doc.join('\n') : null } }

type
  = element_type
  / "?" t:element_type { return Object.assign({ optional: true }, t) }
  / "[]" t:type { return { type: 'set', kind: t } }
  / "[string]" t:type { return { type: 'dict', kind: t } }
  / "?[]" t:type { return { type: 'set', optional: true, kind: t } }
  / "?[string]" t:type { return { type: 'dict', optional: true, kind: t } }

element_type
  = "bool" { return { type: 'bool' } }
  / "int" { return { type: 'int' } }
  / "float" { return { type: 'float' } }
  / "string" { return { type: 'string' } }
  / "object" { return { type: 'object' } }
  / n:name { return { type: n } }
  / e:enum { return { type: 'enum', values: e } }
  / s:struct { return { type: 'struct', parameters: s } }

name
  = head:([A-Z])
    tail:([A-Za-z0-9]*)
    { return [head].concat(tail).join('') }

field_name
  = head:([A-Za-z])
    tail:(us:("_"?) letters:([A-Za-z0-9]) { return [us].concat(letters).filter(xs => !!xs).join('') })*
    { return [head].concat(tail).join('') }

field_names
  = names:(
      head:field_name
      tail:(_* "," _* m:field_name { return m })*
      { return [head].concat(tail) }
    )? { return names || [] }

interface_name
  = head:interface_name_head
    tail:("." s:interface_name_segment { return s })+
    { return [head].concat(tail).join('.') }

interface_name_head
  = head:([a-z])
    tail:(dashes:([-]*) letters:([a-z0-9])* { return dashes.concat(letters) })
    { return [head].concat(tail).join('') }

interface_name_segment
  = head:([a-z0-9])
    tail:(dashes:([-]*) letters:([a-z0-9])* { return dashes.concat(letters) })
    { return [head].concat(tail).join('') }

comment
  = "#" ws* body:([^\n\r\u2028\u2029]*) eol_r
    { return body.length > 0 ? body.join('') : null }

ws
  = [ \t\u00A0\uFEFF\u1680\u180E\u2000-\u200A\u202F\u205F\u3000]

eol
  = ws* eol_r ws*

eol_r
  = "\n"
  / "\r\n"
  / "\r"
  / "\u2028"
  / "\u2029"

_
  = ws
  / comment
  / eol_r
