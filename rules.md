- 1.1 `o`: `o` Represents the main chain (main timeline) for state-objects.
- 1.2 `o`` `: A chain cannot have an empty address.
- 1.3 ``` o`main` ```: An address on the main-chain cannot begin with "main"
- 1.4 ``` o`Greeting` ```: An address on the main-chain cannot begin with a capital letter
- 1.5 ``` o`_greeting` ```: An address on the main-chain cannot begin with an underscore
- 1.7 ``` o`obeah > myal > bacoo`() ```: Nested namespace categories are created using ` > `
- 1.7 ``` o.obeah.myal.bacoo() ```: Then the state-object (function) can be reached using dot notation. 
- 1.7 ``` o['obeah'].myal['bacoo']() ```: The state-object can also be reached using bracket notation. 
- 1.7 ``` o`obeah > myal > bacoo`() ```: An address defined without a default state will default to `pending`
- 1.7 ``` o`obeah > myal > bacoo`() ```: An address defined without a default state will default to `pending`


## Types of Timelines 
There are three types of Timelines: 
- Structured Timeline: State with object types are copied using structuredClone 
- Unstructured Timeline: States with object types are referenced and can contain references
- Primitive Timeline: Limited types for fast performance, object types are stored as primitives

Allowed Types
| Types               | Structured | Unstructured | Pruned |
|---------------------|------------|--------------|--------|
| Null                | x          | x            | x      |
| Boolean             | x          | x            | x      |
| Number              | x          | x            | x      |
| String              | x          | x            | x      |
| Plain Object        | x          | x            | x      |
| Symbol              |            | x            |        |
| Arrays              | x          | x            | x      |
| TypedArrays         | x          | x            |        |
| ArrayBuffers        | x          | x            |        |
| DataView            | x          | x            |        |
| Date                | x          | x            |        |
| Regular Expressions | x          | x            |        |
| Map                 | x          | x            |        |
| Set                 | x          | x            |        |
| Error Types         | x          | x            |        |
| BigInt              | x          | x            |        |
| pending             | x          | x            | x      |
| republish           | x          | x            | x      |

Disallowed Types
| Types               | 
|---------------------|
| Undefined           |
| NaN                 |
| Classes             |
| Promise             |
| Functions           |
| WeakMap             |
| WeakSet             |
| WeakRef             |
| Circular References |
| Blob                |
| File                |
| ImageData           | 
| SharedArrayBuffer   |


The config of each timeline defines the **timelineType** which can be changed in real-time. 
It's possble to develop with Structured Timeline Type and change over to Unstructured for production
using the `.setTimelineType('unstructured')`.

There is no hard rule about what type to prefer. "Structured" is the default which will guard against
data usutiable for structured-cloned based APIs like postMessage and IndexedDB, as well as not containing references to external objects. "Unstructured" stores object without the structured-clone algorithm in some cases it may be faster 
but it may also be more privy to external references. "Pruned" is a restricted data type spcifically where performance is a concern.  
 
