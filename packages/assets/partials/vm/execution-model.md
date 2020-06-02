## Execution Model

Before writing your first line of code, it is vital to have a good understanding when this code will be executed:

- The Processor runs on micro-batched data, which means that not every changed attribute and newly added event will lead to a run of the Processor.
- The Processor receives events exactly once, or in other words the exposed events are the ones between now and the last run of the Processor.
